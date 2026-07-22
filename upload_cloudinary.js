const fs = require('fs');
const path = require('path');

const CLOUD_NAME = 'heswgpdc';
const UPLOAD_PRESET = 'baim warunk arsi';
const IMAGES_DIR = path.join(__dirname, 'images');

const uploadImage = async (filePath, filename) => {
    const fileData = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let mime = 'image/jpeg';
    if (ext === '.png') mime = 'image/png';
    else if (ext === '.webp') mime = 'image/webp';
    
    const blob = new Blob([fileData], { type: mime });
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });
    
    const data = await res.json();
    if (res.ok && data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error(data.error ? data.error.message : 'Unknown error');
    }
};

const main = async () => {
    const files = fs.readdirSync(IMAGES_DIR);
    const urlMap = {};

    for (const file of files) {
        if (!file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
        console.log(`Uploading ${file}...`);
        try {
            const url = await uploadImage(path.join(IMAGES_DIR, file), file);
            urlMap[`images/${file}`] = url;
            console.log(`Success: ${url}`);
        } catch (e) {
            console.error(`Failed ${file}:`, e.message);
        }
    }

    if (Object.keys(urlMap).length === 0) {
        console.log("No images uploaded successfully.");
        return;
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
