const fs = require('fs');
const path = require('path');

const map = {
    'https://i.ibb.co/fzM08Pgk/bd43e44c2699.png': 'images/about-collage.png',
    'https://i.ibb.co/3Y5JpN5j/fbde8a944e73.jpg': 'images/blog-1.png',
    'https://i.ibb.co/SYsVjpP/409454b1ef6c.jpg': 'images/blog-2.png',
    'https://i.ibb.co/LDCBZ2nP/00eca285fb8a.jpg': 'images/blog-3.png',
    'https://i.ibb.co/b5GR5JvV/5d5f7d589c6b.webp': 'images/ebook-cover-1.png',
    'https://i.ibb.co/8Ln0q3gb/8c1ce1b990ad.jpg': 'images/ebook-cover-2.png',
    'https://i.ibb.co/7JZkLtCg/842056e34fd9.png': 'images/hero-profile.png',
    'https://i.ibb.co/mVsPjmHm/b2ee88eb50da.jpg': 'images/testimoni-1.png',
    'https://i.ibb.co/rRs7H8nR/0a6bcb4c876f.jpg': 'images/testimoni-2.png',
    'https://i.ibb.co/G3Q4db27/01d04dbca9ae.jpg': 'images/tools-cover.png',
    'https://i.ibb.co/qFPM9jcz/warsi-ai.webp': 'images/ebook-cover-1.png' // original broken one, fallback to ebook-cover-1
};

const replaceInFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [imgbb, local] of Object.entries(map)) {
        content = content.replace(new RegExp(imgbb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), local);
    }
    fs.writeFileSync(filePath, content);
    console.log('Reverted ' + filePath);
};

replaceInFile(path.join(__dirname, 'data/products.json'));
replaceInFile(path.join(__dirname, 'data/articles.json'));
replaceInFile(path.join(__dirname, 'index.html'));
