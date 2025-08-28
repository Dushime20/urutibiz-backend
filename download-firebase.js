const https = require('https');
const fs = require('fs');
const path = require('path');

const firebaseFiles = [
    {
        url: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
        filename: 'firebase-app-compat.js'
    },
    {
        url: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js',
        filename: 'firebase-messaging-compat.js'
    }
];

function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const filepath = path.join(__dirname, 'public', 'firebase', filename);
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${filename}`);
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete the file if download failed
            reject(err);
        });
    });
}

async function downloadAll() {
    console.log('🚀 Starting Firebase files download...');
    
    for (const file of firebaseFiles) {
        try {
            await downloadFile(file.url, file.filename);
        } catch (error) {
            console.error(`❌ Failed to download ${file.filename}:`, error.message);
        }
    }
    
    console.log('✨ Download process completed!');
}

downloadAll();
