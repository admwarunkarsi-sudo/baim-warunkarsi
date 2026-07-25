require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Config Supabase (Use same anon key as client)
const SUPABASE_URL = 'https://ghfnukejqcioulphszil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZm51a2VqcWNpb3VscGhzemlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTc1NDMsImV4cCI6MjA5OTg5MzU0M30.l7syGaYq2QPHNyJ8FIiGY7_WVVfYtKxjSXj1gIxoc4Y';
const FONNTE_TOKEN = 'q5fXFifuQdFfhmRprTUs';

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
app.use(cors());
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

// ==========================================
// MAYAR WEBHOOK
// ==========================================
app.post('/api/webhook/mayar', async (req, res) => {
    try {
        console.log("=== MAYAR WEBHOOK RAW DUMP ===");
        console.log(JSON.stringify(req.body, null, 2));
        console.log("==============================");
        const payload = req.body;

        // Mayar payload structure varies, try to extract customer data robustly
        let customerName = payload.customer_name || payload.name || (payload.customer && payload.customer.name) || (payload.data && payload.data.customer && payload.data.customer.name) || (payload.data && payload.data.customer_name) || (payload.data && payload.data.customerName) || (payload.data && payload.data.name) || "Member";
        let customerEmail = payload.customer_email || payload.email || (payload.customer && payload.customer.email) || (payload.data && payload.data.customer && payload.data.customer.email) || (payload.data && payload.data.customer_email) || (payload.data && payload.data.customerEmail) || (payload.data && payload.data.email) || null;
        let customerPhone = payload.customer_phone || payload.phone || payload.whatsapp || payload.hp || (payload.customer && payload.customer.phone) || (payload.data && payload.data.customer && payload.data.customer.phone) || (payload.data && payload.data.customer_phone) || (payload.data && payload.data.customerMobile) || (payload.data && payload.data.phone) || "";

        // Clean phone number (remove leading 0 or +62)
        let cleanPhone = customerPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('62')) cleanPhone = '0' + cleanPhone.substring(2);

        // Validate email format. If invalid, generate a dummy email based on phone number so they can still login.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!customerEmail || !emailRegex.test(customerEmail)) {
            console.log(`Invalid or missing email: ${customerEmail}. Using fallback.`);
            if (!cleanPhone) {
                return res.status(200).send("No valid email and no phone number. Ignored.");
            }
            customerEmail = `user_${cleanPhone}@warunkarsi.com`;
        }

        // ONLY PROCESS PAID/SETTLED TRANSACTIONS!
        const status = (payload.status || payload.transaction_status || (payload.data && payload.data.status) || (payload.data && payload.data.transactionStatus) || "").toLowerCase();
        if (status !== 'settled' && status !== 'paid' && status !== 'success' && status !== 'completed') {
            console.log(`Ignored status: ${status}. Waiting for payment to be settled.`);
            return res.status(200).send(`Ignored status: ${status}`);
        }

        // Generate Password: Baim + last 4 digits
        const last4 = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '1234';
        const password = `Baim${last4}`;

        // 1. Create Supabase Admin Client using Service Role Key
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
            console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!");
            return res.status(500).send("Server configuration error.");
        }
        
        const adminSupabase = createClient(SUPABASE_URL, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // 2. Check if user already exists
        let userId = null;
        try {
            console.log("Checking if user exists:", customerEmail);
            const { data: existingUsers, error: listError } = await adminSupabase.auth.admin.listUsers();
            if (listError) throw listError;
            
            const existingUser = existingUsers.users.find(u => u.email === customerEmail);
            if (existingUser) {
                userId = existingUser.id;
                console.log("User exists with ID:", userId);
            } else {
                console.log("Creating new user:", customerEmail);
                const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
                    email: customerEmail,
                    password: password,
                    email_confirm: true, // Auto-confirm email
                    user_metadata: { full_name: customerName, whatsapp_number: cleanPhone }
                });
                
                if (createError) throw createError;
                userId = newUser.user.id;
                console.log("New user created with ID:", userId);
            }
        } catch (authErr) {
            console.error("Auth Admin Error:", authErr);
            // We shouldn't send WA if user creation failed entirely
            return res.status(500).send("Failed to process user account.");
        }

        // 3. Ensure they are in users table (upsert)
        try {
            await adminSupabase.from('users').upsert({
                id: userId,
                email: customerEmail,
                full_name: customerName,
                whatsapp_number: cleanPhone
            });
        } catch (dbErr) {
            console.error("Warning: Failed to upsert users table:", dbErr);
        }

        // 4. Force insert into kelas_members
        try {
            // First check if they are already in kelas_members to avoid duplicate insert errors
            const { data: existingMember } = await adminSupabase.from('kelas_members').select('id').eq('user_id', userId).single();
            if (!existingMember) {
                const { error: memberError } = await adminSupabase.from('kelas_members').insert([{
                    user_id: userId,
                    email: customerEmail,
                    full_name: customerName,
                    whatsapp: cleanPhone,
                    status: 'active',
                    payment_method: 'mayar'
                }]);
                if (memberError) {
                    console.error("Warning: Failed to insert into kelas_members:", memberError);
                } else {
                    console.log("Successfully inserted into kelas_members for:", customerEmail);
                }
            } else {
                console.log("User already exists in kelas_members, skipping insert.");
            }
        } catch (memberCatchErr) {
            console.error("Warning: Exception while handling kelas_members:", memberCatchErr);
        }

        // 5. Send WhatsApp Notification via Fonnte
        const waMessage = `Halo *${customerName}*,\n\nTerima kasih sudah bergabung di *Klub Pendampingan Kuliner Go Digital*! 🎉\n\nAkun Anda telah otomatis diaktifkan. Silakan login ke Member Area melalui tautan berikut:\n🌐 https://baim.warunkarsi.com/member\n\nGunakan akses berikut:\n📧 Email: *${customerEmail}*\n🔑 Password: *${password}*\n\nSelamat belajar dan tingkatkan omzet warung Anda! 🚀`;
        
        await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': FONNTE_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: customerPhone,
                message: waMessage,
                countryCode: '62'
            })
        });

        res.status(200).send("OK");
    } catch (e) {
        console.error("Webhook Error:", e);
        res.status(500).send("Internal Server Error");
    }
});

// Get Affiliates (Public/Protected)
app.get('/api/affiliates', async (req, res) => {
    try {
        const owner = process.env.GITHUB_USERNAME;
        const repo = process.env.GITHUB_REPO;
        // Try fetching from raw github to avoid Vercel build delay
        const ghRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/data/affiliates.json`);
        if (ghRes.ok) {
            const data = await ghRes.json();
            return res.json(data);
        }
    } catch(e) {
        console.error("GitHub fetch failed, falling back to local:", e);
    }
    
    // Fallback
    fs.readFile(path.join(process.cwd(), 'data', 'affiliates.json'), 'utf8', (err, data) => {
        if (err) return res.json({});
        try {
            res.json(JSON.parse(data || '{}'));
        } catch(e) {
            res.json({});
        }
    });
});

// Update Affiliates (Protected)
app.post('/api/affiliates', authMiddleware, async (req, res) => {
    const newAffiliates = req.body;
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
        return res.status(500).json({ success: false, message: 'GitHub credentials not configured in .env file.' });
    }

    try {
        // 1. Try to update local file (will fail on Vercel, but works locally)
        try {
            fs.writeFileSync(path.join(process.cwd(), 'data', 'affiliates.json'), JSON.stringify(newAffiliates, null, 2));
        } catch (fsErr) {
            console.log("Could not write locally (expected on Vercel):", fsErr.message);
        }
        
        // 2. Upload to GitHub
        await uploadToGitHub(owner, repo, token, 'data/affiliates.json', JSON.stringify(newAffiliates, null, 2), 'Auto update affiliates mapping via API');
        
        res.json({ success: true, message: 'Affiliates saved successfully.' });
    } catch (e) {
        console.error('Save Affiliates Error:', e);
        res.status(500).json({ success: false, message: 'Failed to save affiliates.' });
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
// UBOS AI Promo Generator Endpoint
app.post('/api/generate-promo', async (req, res) => {
    const { toko, produk, detail, waktu, gaya } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key Gemini belum disetting di Vercel.' });
    }

    const prompt = `Anda adalah "Copywriter Kuliner Profesional" spesialis WhatsApp Broadcast.
Tugas Anda adalah membuat pesan promosi WhatsApp yang sangat menarik, natural, dan persuasif berdasarkan data berikut:

[DATA PROMOSI]
- Nama Toko: ${toko}
- Produk/Menu: ${produk}
- Penawaran Promo: ${detail}
- Batas Waktu: ${waktu}
- Gaya Bahasa Target: ${gaya}

[ATURAN KETAT]
1. STRUKTUR PESAN WA: 
   - Paragraf 1: Hook/Sapaan yang menarik perhatian (sesuai gaya bahasa).
   - Paragraf 2: Inti Promo (sebutkan produk dan detail promo secara jelas).
   - Paragraf 3: Urgency (batas waktu) & Call-to-Action (ajakan bertindak).
2. PANJANG PESAN: Buat ringkas, padat, dan jelas. Maksimal 3-4 paragraf pendek agar nyaman dibaca di layar HP.
3. EMOJI: Gunakan emoji yang relevan tapi JANGAN berlebihan (maksimal 1-2 emoji per paragraf).
4. FORMAT: Gunakan *bold* hanya untuk kata kunci penting (nama toko, harga, atau diskon).
5. KESIMPULAN: Jangan pernah membiarkan kalimat menggantung/terpotong. Pesan harus tuntas.
6. PENUTUP WAJIB: Akhiri pesan Anda dengan kalimat persis seperti ini (tanpa diubah sedikitpun): "Terimakasih udah mampir dan dukung terus ${toko} yaa 🙏"
7. LARANGAN: Jangan menuliskan basa-basi pembuka seperti "Berikut adalah teks promosinya:". Langsung berikan hasil akhir pesannya saja.`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2000
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                validateStatus: function (status) {
                    return status < 500; // Resolve only if the status code is less than 500
                }
            }
        );

        if (response.status !== 200) {
            const errData = response.data;
            throw new Error(`Google API Error: ${JSON.stringify(errData)}`);
        }

        const aiText = response.data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({ text: aiText });
    } catch (error) {
        console.error("AI Generation Error:", error);
        return res.status(500).json({ error: 'Gagal memuat AI. ' + error.message });
    }
});

// UBOS AI Market Research Endpoint
app.post('/api/generate-research', async (req, res) => {
    const { jenisUsaha, namaUsaha, lokasi } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key Gemini belum disetting di Vercel.' });
    }

    const prompt = `Kamu adalah "Teman Bisnis Warung" yang baik hati dan jago urusan jualan di pasar.
Kamu bantu ibu-ibu dan bapak-bapak pemilik warung atau usaha kecil agar makin maju dan laris.
Gunakan bahasa Indonesia yang sangat mudah dipahami, seperti ngobrol santai dengan tetangga.

Data usaha yang mau dianalisa:
- Jenis Usaha: ${jenisUsaha}
- Nama atau Produk: ${namaUsaha}
- Lokasi Jualan: ${lokasi}

Tolong berikan analisa dalam 3 bagian seperti ini:

🔍 ANALISA SAINGAN DI SEKITAR KAMU
Ceritakan 3 kelemahan umum para saingan usaha sejenis di area tersebut. Tulis dengan kalimat pendek yang mudah dimengerti. Mulai tiap poin dengan nomor (1. 2. 3.) dan jelaskan juga cara memanfaatkan kelemahannya itu.

💡 IDE BIAR JUALAN KAMU BEDA DAN LARIS
Berikan 3 ide kreatif yang bisa langsung dilakukan tanpa modal besar. Idenya harus praktis, tidak ribet, dan bisa dicoba besok pagi. Mulai tiap ide dengan nomor (1. 2. 3.).

💰 HARGA YANG PAS DI KANTONG PEMBELI
Berikan saran rentang harga jual yang cocok untuk pembeli di area lokasi tersebut. Tulis alasannya secara singkat dan jelas.

ATURAN PENULISAN PENTING:
- DILARANG KERAS menggunakan simbol bintang (*) atau garis bawah (_) apapun dalam jawaban.
- Gunakan HURUF KAPITAL saja jika ingin menekankan kata penting.
- Tulis dalam kalimat pendek dan sederhana. Maksimal 2 kalimat per poin.
- Gunakan emoji yang relevan sebagai pemanis, tapi jangan berlebihan.
- Langsung mulai dari bagian 🔍 ANALISA SAINGAN, jangan ada kalimat pembuka yang tidak perlu.`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2500
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                validateStatus: function (status) {
                    return status < 500;
                }
            }
        );

        if (response.status !== 200) {
            const errData = response.data;
            throw new Error(`Google API Error: ${JSON.stringify(errData)}`);
        }

        const aiText = response.data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({ text: aiText });
    } catch (error) {
        console.error("AI Research Generation Error:", error);
        return res.status(500).json({ error: 'Gagal meriset pasar. ' + error.message });
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
