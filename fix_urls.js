const fs = require('fs');
const path = require('path');

const map = {
    // ImgBB -> Cloudinary
    'https://i.ibb.co/fzM08Pgk/bd43e44c2699.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105140/huzhic5jwih3hi8jhfkr.png',
    'https://i.ibb.co/3Y5JpN5j/fbde8a944e73.jpg': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105142/jbcok4rxfzh8xwzz4ryp.jpg',
    'https://i.ibb.co/SYsVjpP/409454b1ef6c.jpg': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105143/lgdvzvjgapiocamd0lyv.jpg',
    'https://i.ibb.co/LDCBZ2nP/00eca285fb8a.jpg': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105144/lhxazr3buancnt5sahh7.jpg',
    'https://i.ibb.co/b5GR5JvV/5d5f7d589c6b.webp': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105145/r5tqgdiuf4b67fiqqdu7.webp',
    'https://i.ibb.co/8Ln0q3gb/8c1ce1b990ad.jpg': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105146/ranh3kvpsjm58qrgdzq9.jpg',
    'https://i.ibb.co/7JZkLtCg/842056e34fd9.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105147/cjxn9nkbq9fk27itqs0z.png',
    'https://i.ibb.co/mVsPjmHm/b2ee88eb50da.jpg': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105148/npauigtxbyqiq3t6hrxu.jpg',
    'https://i.ibb.co/rRs7H8nR/0a6bcb4c876f.jpg': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105149/h3pf0jtyjuxcxegphnnt.jpg',
    'https://i.ibb.co/G3Q4db27/01d04dbca9ae.jpg': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105151/wm2cm59qw5psplcp74mn.jpg',
    'https://i.ibb.co/qFPM9jcz/warsi-ai.webp': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105145/r5tqgdiuf4b67fiqqdu7.webp', // fallback to ebook cover 1
    
    // Local -> Cloudinary
    'images/about-collage.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105140/huzhic5jwih3hi8jhfkr.png',
    'images/blog-1.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105142/jbcok4rxfzh8xwzz4ryp.jpg',
    'images/blog-2.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105143/lgdvzvjgapiocamd0lyv.jpg',
    'images/blog-3.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105144/lhxazr3buancnt5sahh7.jpg',
    'images/ebook-cover-1.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105145/r5tqgdiuf4b67fiqqdu7.webp',
    'images/ebook-cover-2.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105146/ranh3kvpsjm58qrgdzq9.jpg',
    'images/hero-profile.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105147/cjxn9nkbq9fk27itqs0z.png',
    'images/testimoni-1.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105148/npauigtxbyqiq3t6hrxu.jpg',
    'images/testimoni-2.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105149/h3pf0jtyjuxcxegphnnt.jpg',
    'images/tools-cover.png': 'https://res.cloudinary.com/heswgpdc/image/upload/v1784105151/wm2cm59qw5psplcp74mn.jpg'
};

const replaceInFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [findStr, replaceStr] of Object.entries(map)) {
        content = content.replace(new RegExp(findStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceStr);
    }
    fs.writeFileSync(filePath, content);
    console.log('Fixed ' + filePath);
};

replaceInFile(path.join(__dirname, 'data/products.json'));
replaceInFile(path.join(__dirname, 'data/articles.json'));
replaceInFile(path.join(__dirname, 'index.html'));
