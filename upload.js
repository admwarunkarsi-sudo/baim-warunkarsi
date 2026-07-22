const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = '52fdf8af9d7f503357cb6245c978c1ab';
const IMAGES_DIR = path.join(__dirname, 'images');

const uploadImage = (filePath) => {
    return new Promise((resolve, reject) => {
        const fileData = fs.readFileSync(filePath);
        const base64Data = fileData.toString('base64');
        const postData = new URLSearchParams({
            image: base64Data
        }).toString();

        const options = {
            hostname: 'api.imgbb.com',
            path: `/1/upload?key=${API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.success) {
                        resolve(json.data.url);
                    } else {
                        reject(new Error(json.error ? json.error.message : 'Unknown error'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
};

const main = async () => {
    const files = fs.readdirSync(IMAGES_DIR);
    const urlMap = {};

    for (const file of files) {
        if (!file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
        console.log(`Uploading ${file}...`);
        try {
            const url = await uploadImage(path.join(IMAGES_DIR, file));
            urlMap[`images/${file}`] = url;
            console.log(`Success: ${url}`);
        } catch (e) {
            console.error(`Failed ${file}:`, e.message);
        }
    }

    // Now update JSON files
    const productsPath = path.join(__dirname, 'data/products.json');
    if (fs.existsSync(productsPath)) {
        let productsContent = fs.readFileSync(productsPath, 'utf8');
        for (const [localPath, imgUrl] of Object.entries(urlMap)) {
            productsContent = productsContent.replace(new RegExp(localPath, 'g'), imgUrl);
        }
        productsContent = productsContent.replace('https://i.ibb.co/qFPM9jcz/warsi-ai.webp', urlMap['images/ebook-cover-1.png'] || 'https://i.ibb.co/qFPM9jcz/warsi-ai.webp');
        fs.writeFileSync(productsPath, productsContent);
        console.log('Updated products.json');
    }

    const articlesPath = path.join(__dirname, 'data/articles.json');
    if (fs.existsSync(articlesPath)) {
        let articlesContent = fs.readFileSync(articlesPath, 'utf8');
        for (const [localPath, imgUrl] of Object.entries(urlMap)) {
            articlesContent = articlesContent.replace(new RegExp(localPath, 'g'), imgUrl);
        }
        fs.writeFileSync(articlesPath, articlesContent);
        console.log('Updated articles.json');
    }

    const htmlPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        for (const [localPath, imgUrl] of Object.entries(urlMap)) {
            htmlContent = htmlContent.replace(new RegExp(localPath, 'g'), imgUrl);
        }
        fs.writeFileSync(htmlPath, htmlContent);
        console.log('Updated index.html');
    }
};

main();
