const fs = require('fs');
const path = require('path');

// Create a simple BMP image for all products
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

// Create a single product image with a nice gradient-like color
const productImage = createBMPImage(600, 400, { r: 70, g: 130, b: 180 }); // Steel blue color
const filePath = path.join(imagesDir, 'product-image.bmp');
fs.writeFileSync(filePath, productImage);

console.log(`Created single product image: ${filePath}`);
