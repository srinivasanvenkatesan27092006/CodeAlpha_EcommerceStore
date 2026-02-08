const fs = require('fs');
const path = require('path');

// Create a simple BMP image (easier to generate than PNG)
function createBMPImage(width, height, color) {
    const pixelData = Buffer.alloc(width * height * 3);
    
    // Fill with color (BGR format for BMP)
    for (let i = 0; i < pixelData.length; i += 3) {
        pixelData[i] = color.b;     // Blue
        pixelData[i + 1] = color.g; // Green  
        pixelData[i + 2] = color.r; // Red
    }
    
    // BMP header (54 bytes)
    const header = Buffer.alloc(54);
    header.write('BM', 0); // Signature
    header.writeUInt32LE(54 + pixelData.length, 2); // File size
    header.writeUInt32LE(0, 6); // Reserved
    header.writeUInt32LE(54, 10); // Data offset
    header.writeUInt32LE(40, 14); // Header size
    header.writeUInt32LE(width, 18); // Width
    header.writeUInt32LE(height, 22); // Height
    header.writeUInt16LE(1, 26); // Planes
    header.writeUInt16LE(24, 28); // Bits per pixel
    header.writeUInt32LE(0, 30); // Compression
    header.writeUInt32LE(pixelData.length, 34); // Image size
    header.writeUInt32LE(2835, 38); // X pixels per meter
    header.writeUInt32LE(2835, 42); // Y pixels per meter
    header.writeUInt32LE(0, 46); // Colors used
    header.writeUInt32LE(0, 50); // Important colors
    
    return Buffer.concat([header, pixelData]);
}

// Create images directory
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Create product images with different colors
const products = [
    { name: 'macbook-pro.bmp', color: { r: 52, g: 152, b: 219 } },   // Blue
    { name: 'iphone-15.bmp', color: { r: 231, g: 76, b: 60 } },     // Red
    { name: 'sony-headphones.bmp', color: { r: 46, g: 204, b: 113 } }, // Green
    { name: 'apple-watch.bmp', color: { r: 243, g: 156, b: 18 } },  // Orange
    { name: 'ipad-pro.bmp', color: { r: 155, g: 89, b: 182 } }      // Purple
];

products.forEach(product => {
    const imageData = createBMPImage(600, 400, product.color);
    const filePath = path.join(imagesDir, product.name);
    fs.writeFileSync(filePath, imageData);
    console.log(`Created: ${filePath}`);
});

console.log('BMP product images created successfully!');
