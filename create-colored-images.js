const fs = require('fs');
const path = require('path');

// Create a simple colored PNG with text representation
function createProductPNG(filename, color, text) {
    // Create a simple 100x100 PNG with solid color
    // This is a minimal PNG with IHDR and IDAT chunks
    const width = 600;
    const height = 400;
    
    // PNG header
    let pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    ]);
    
    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // bit depth
    ihdrData[9] = 2; // color type (RGB)
    ihdrData[10] = 0; // compression
    ihdrData[11] = 0; // filter
    ihdrData[12] = 0; // interlace
    
    const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
    pngData = Buffer.concat([
        pngData,
        Buffer.from([0x00, 0x00, 0x00, 0x0D]), // chunk length
        Buffer.from('IHDR'),
        ihdrData,
        Buffer.from([ihdrCrc >> 24, ihdrCrc >> 16, ihdrCrc >> 8, ihdrCrc])
    ]);
    
    // Create image data (solid color)
    const pixelData = Buffer.alloc(width * height * 3);
    const rgb = hexToRgb(color);
    for (let i = 0; i < pixelData.length; i += 3) {
        pixelData[i] = rgb.r;
        pixelData[i + 1] = rgb.g;
        pixelData[i + 2] = rgb.b;
    }
    
    // Compress the pixel data (simplified - just store raw)
    const idatData = Buffer.concat([
        Buffer.from([0x78, 0x9C]), // zlib header
        pixelData,
        Buffer.from([0x01, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x01]) // zlib footer
    ]);
    
    const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), idatData]));
    pngData = Buffer.concat([
        pngData,
        Buffer.from([idatData.length >> 24, idatData.length >> 16, idatData.length >> 8, idatData.length]),
        Buffer.from('IDAT'),
        idatData,
        Buffer.from([idatCrc >> 24, idatCrc >> 16, idatCrc >> 8, idatCrc])
    ]);
    
    // IEND chunk
    const iendCrc = crc32(Buffer.from('IEND'));
    pngData = Buffer.concat([
        pngData,
        Buffer.from([0x00, 0x00, 0x00, 0x00]), // chunk length
        Buffer.from('IEND'),
        Buffer.from([iendCrc >> 24, iendCrc >> 16, iendCrc >> 8, iendCrc])
    ]);
    
    return pngData;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 128, g: 128, b: 128 };
}

function crc32(data) {
    // Simple CRC32 implementation
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create images directory
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Create product images with different colors
const products = [
    { name: 'macbook-pro.png', color: '#3498db' },
    { name: 'iphone-15.png', color: '#e74c3c' },
    { name: 'sony-headphones.png', color: '#2ecc71' },
    { name: 'apple-watch.png', color: '#f39c12' },
    { name: 'ipad-pro.png', color: '#9b59b6' }
];

products.forEach(product => {
    const imageData = createProductPNG(product.name, product.color, product.name);
    const filePath = path.join(imagesDir, product.name);
    fs.writeFileSync(filePath, imageData);
    console.log(`Created: ${filePath}`);
});

console.log('Product images created successfully!');
