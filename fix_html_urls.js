const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'images') {
                walkDir(dirPath, callback);
            }
        } else {
            callback(dirPath);
        }
    });
}

const htmlRegex = /href="(?!http)([^"]+)\.html(#.*)?"/g;

walkDir(__dirname, function(filePath) {
    if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        let newContent = content.replace(htmlRegex, (match, p1, p2) => {
            // p1 is the path without .html, p2 is the hash
            // If p1 ends with index, it should probably be just /
            if (p1 === 'index') p1 = '';
            // For GitHub Pages, the clean URL is just the path without .html
            return `href="${p1}${p2 || ''}"`;
        });
        
        // Also fix window.location.href assignments in JS
        const jsRegex = /window\.location\.href\s*=\s*'([^']+)\.html(#.*)?'/g;
        newContent = newContent.replace(jsRegex, (match, p1, p2) => {
             if (p1 === 'index') p1 = '';
             return `window.location.href = '${p1}${p2 || ''}'`;
        });

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
});
