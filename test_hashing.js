
const fs = require('fs');
const CryptoJS = require('crypto-js');

// Simulate chunked hashing in Node
function hashFileChunked(filePath) {
    const fileSize = fs.statSync(filePath).size;
    const chunkSize = 2 * 1024 * 1024; // 2MB
    const buffer = Buffer.alloc(chunkSize);

    const fd = fs.openSync(filePath, 'r');
    let bytesRead = 0;

    const md5 = CryptoJS.algo.MD5.create();
    const sha1 = CryptoJS.algo.SHA1.create();
    const sha256 = CryptoJS.algo.SHA256.create();

    console.log(`Hashing file: ${filePath} (${fileSize} bytes)`);

    while ((bytesRead = fs.readSync(fd, buffer, 0, chunkSize, null)) !== 0) {
        // Convert Buffer to WordArray
        const wordArray = CryptoJS.lib.WordArray.create(buffer.slice(0, bytesRead));

        md5.update(wordArray);
        sha1.update(wordArray);
        sha256.update(wordArray);

        process.stdout.write('.');
    }

    console.log('\nDone.');
    console.log('MD5:', md5.finalize().toString());
    console.log('SHA1:', sha1.finalize().toString());
    console.log('SHA256:', sha256.finalize().toString());

    fs.closeSync(fd);
}

// Create a dummy file if not exists
const testFile = 'large_test_file.bin';
if (!fs.existsSync(testFile)) {
    console.log('Creating dummy file...');
    const data = Buffer.alloc(5 * 1024 * 1024, 'a'); // 5MB
    fs.writeFileSync(testFile, data);
}

hashFileChunked(testFile);
