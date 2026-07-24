require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });


const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = 'baimdigital2026';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(process.cwd(), '.'), { extensions: ['html'] }));

// Simple Authentication Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (token === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized. Invalid password.' });
    }
};

// Helper for GitHub API Commits
async function uploadToGitHub(owner, repo, token, filePath, contentString, commitMessage) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
    const base64Content = Buffer.from(contentString).toString('base64');
    
    let sha = '';
    try {
        const getResponse = await axios.get(url, { headers });
        sha = getResponse.data.sha;
    } catch (err) {
        if (err.response && err.response.status !== 404) throw err;
    }

    const payload = { message: commitMessage, content: base64Content };
    if (sha) payload.sha = sha;

    await axios.put(url, payload, { headers });
}

// --- API ROUTES ---

// Get Products (Public)
app.get('/api/products', (req, res) => {
    fs.readFile(path.join(process.cwd(), 'data', 'products.json'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read products.' });
        res.json(JSON.parse(data));
    });
});

// Update Products (Protected)
app.post('/api/products', authMiddleware, async (req, res) => {
    const newProducts = req.body;
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
        return res.status(500).json({ success: false, message: 'GitHub credentials not configured in .env file.' });
    }

    try {
        await uploadToGitHub(owner, repo, token, 'data/products.json', JSON.stringify(newProducts, null, 2), 'Update products data via CMS');
        
        // --- Static Site Generation for Products ---
        const templatePath = path.join(process.cwd(), 'produk.html');
        if (fs.existsSync(templatePath)) {
            const templateHtml = fs.readFileSync(templatePath, 'utf8');
            
            for (const product of newProducts) {
                if(!product.slug) continue;
                let html = templateHtml;
                const pageTitle = `${product.title} | Baim Warunk Arsi`;
                const rawContent = product.description || "";
                const cleanDesc = rawContent.replace(/(<([^>]+)>)/gi, "").substring(0, 150) + "...";
                const img = product.image || 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105147/cjxn9nkbq9fk27itqs0z.png';
                
                html = html.replace(/<title id="meta-title">.*?<\/title>/, `<title id="meta-title">${pageTitle}</title>`);
                html = html.replace(/id="meta-title">.*?<\/title>/, `id="meta-title">${pageTitle}</title>`);
                html = html.replace(/id="meta-desc" content=".*?"/, `id="meta-desc" content="${cleanDesc}"`);
                html = html.replace(/id="og-title" content=".*?"/, `id="og-title" content="${pageTitle}"`);
                html = html.replace(/id="og-desc" content=".*?"/, `id="og-desc" content="${cleanDesc}"`);
                html = html.replace(/id="og-image" content=".*?"/, `id="og-image" content="${img}"`);
                html = html.replace(/id="tw-title" content=".*?"/, `id="tw-title" content="${pageTitle}"`);
                html = html.replace(/id="tw-desc" content=".*?"/, `id="tw-desc" content="${cleanDesc}"`);
                html = html.replace(/id="tw-image" content=".*?"/, `id="tw-image" content="${img}"`);
                
                await uploadToGitHub(owner, repo, token, `produk/${product.slug}.html`, html, `Auto update product page: ${product.slug}`);
            }
        }
        res.json({ success: true, message: 'Products saved successfully.' });
    } catch (e) {
        console.error('SSG Error (Produk):', e);
        res.status(500).json({ success: false, message: 'Failed to save products.' });
    }
});

// Get Articles (Public)
app.get('/api/articles', (req, res) => {
    fs.readFile(path.join(process.cwd(), 'data', 'articles.json'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read articles.' });
        res.json(JSON.parse(data));
    });
});

// Update Articles (Protected)
app.post('/api/articles', authMiddleware, async (req, res) => {
    const newArticles = req.body;
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
        return res.status(500).json({ success: false, message: 'GitHub credentials not configured in .env file.' });
    }

    try {
        await uploadToGitHub(owner, repo, token, 'data/articles.json', JSON.stringify(newArticles, null, 2), 'Update articles data via CMS');
        
        // --- Static Site Generation for Articles ---
        const templatePath = path.join(process.cwd(), 'blog.html');
        if (fs.existsSync(templatePath)) {
            const templateHtml = fs.readFileSync(templatePath, 'utf8');
            
            for (const article of newArticles) {
                if(!article.slug) continue;
                let html = templateHtml;
                const pageTitle = `${article.title} | Blog Baim`;
                const rawContent = article.excerpt || article.content || "";
                const cleanDesc = rawContent.replace(/(<([^>]+)>)/gi, "").substring(0, 150) + "...";
                const img = article.image || 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105147/cjxn9nkbq9fk27itqs0z.png';
                
                html = html.replace(/<title id="meta-title">.*?<\/title>/, `<title id="meta-title">${pageTitle}</title>`);
                html = html.replace(/content="[^"]*"/g, (match) => match);
                
                html = html.replace(/id="meta-title">.*?<\/title>/, `id="meta-title">${pageTitle}</title>`);
                html = html.replace(/id="meta-desc" content=".*?"/, `id="meta-desc" content="${cleanDesc}"`);
                html = html.replace(/id="og-title" content=".*?"/, `id="og-title" content="${pageTitle}"`);
                html = html.replace(/id="og-desc" content=".*?"/, `id="og-desc" content="${cleanDesc}"`);
                html = html.replace(/id="og-image" content=".*?"/, `id="og-image" content="${img}"`);
                html = html.replace(/id="tw-title" content=".*?"/, `id="tw-title" content="${pageTitle}"`);
                html = html.replace(/id="tw-desc" content=".*?"/, `id="tw-desc" content="${cleanDesc}"`);
                html = html.replace(/id="tw-image" content=".*?"/, `id="tw-image" content="${img}"`);
                
                await uploadToGitHub(owner, repo, token, `blog/${article.slug}.html`, html, `Auto update article page: ${article.slug}`);
            }
        }
        res.json({ success: true, message: 'Articles saved successfully.' });
    } catch (e) {
        console.error('SSG Error:', e);
        res.status(500).json({ success: false, message: 'Failed to save articles.' });
    }
});

// Upload Image to Cloudinary (Protected)
app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file gambar yang dipilih.' });
        }

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: 'baim-warunkarsi',
            resource_type: 'auto'
        });

        res.json({ success: true, url: uploadResponse.secure_url });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({ success: false, message: 'Gagal upload gambar ke Cloudinary.' });
    }
});

// Git Publish (Protected)
app.post('/api/publish', authMiddleware, async (req, res) => {
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
        return res.status(500).json({ success: false, message: 'GitHub credentials not configured in .env file.' });
    }

    const filesToUpdate = ['data/products.json', 'data/articles.json'];
    
    // Auto-detect all files in blog/ directory
    try {
        const blogDir = path.join(__dirname, 'blog');
        if (fs.existsSync(blogDir)) {
            const blogFiles = fs.readdirSync(blogDir);
            blogFiles.forEach(f => {
                if(f.endsWith('.html')) {
                    filesToUpdate.push(`blog/${f}`);
                }
            });
        }
    } catch(e) {
        console.error("Error reading blog directory for publish", e);
    }
    // Auto-detect all files in produk/ directory
    try {
        const produkDir = path.join(__dirname, 'produk');
        if (fs.existsSync(produkDir)) {
            const produkFiles = fs.readdirSync(produkDir);
            produkFiles.forEach(f => {
                if(f.endsWith('.html')) {
                    filesToUpdate.push(`produk/${f}`);
                }
            });
        }
    } catch(e) {
        console.error("Error reading produk directory for publish", e);
    }
    const commitMessage = 'Auto update content via CMS Admin';

    try {
        for (const filePath of filesToUpdate) {
            const localFilePath = path.join(__dirname, filePath);
            if (!fs.existsSync(localFilePath)) continue; // Skip if file doesn't exist locally

            const fileContent = fs.readFileSync(localFilePath, 'utf8');
            const base64Content = Buffer.from(fileContent).toString('base64');
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
            
            const headers = {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            };

            // Step 1: Get the current SHA of the file on GitHub
            let sha = '';
            try {
                const getResponse = await axios.get(url, { headers });
                sha = getResponse.data.sha;
            } catch (err) {
                // If error is 404, it means the file doesn't exist on GitHub yet, which is fine.
                if (err.response && err.response.status !== 404) {
                    throw new Error(`Failed to fetch SHA for ${filePath}: ${err.message}`);
                }
            }

            // Step 2: Update (or create) the file on GitHub
            const payload = {
                message: commitMessage,
                content: base64Content,
            };
            if (sha) payload.sha = sha;

            await axios.put(url, payload, { headers });
        }

        res.json({ success: true, message: 'Successfully published to GitHub!' });
    } catch (error) {
        console.error('Publish error:', error.message);
        res.status(500).json({ success: false, message: `Publish failed: ${error.message}` });
    }
});

// Start Server (if not in serverless environment)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Local CMS server running on http://localhost:${PORT}`);
        console.log(`Admin panel: http://localhost:${PORT}/admin`);
    });
}

// Export the app for Vercel Serverless
module.exports = app;
