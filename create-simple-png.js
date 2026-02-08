const fs = require('fs');
const path = require('path');

// Create a simple 100x100 PNG with solid color
function createSimplePNG() {
    // PNG signature
    const png = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    ]);
    
    // IHDR chunk (100x100 RGB image)
    const ihdr = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x0D]), // length: 13
        Buffer.from('IHDR'),
        Buffer.from([0x00, 0x00, 0x00, 0x64]), // width: 100
        Buffer.from([0x00, 0x00, 0x00, 0x64]), // height: 100
        Buffer.from([0x08, 0x02, 0x00, 0x00, 0x00]), // bit depth: 8, color type: 2 (RGB)
        Buffer.from([0x4B, 0x6D, 0x29, 0xDC]) // CRC
    ]);
    
    // IDAT chunk with solid blue pixels
    const pixels = Buffer.alloc(100 * 100 * 3);
    for (let i = 0; i < pixels.length; i += 3) {
        pixels[i] = 70;     // R
        pixels[i + 1] = 130; // G  
        pixels[i + 2] = 180; // B
    }
    
    const idat = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x0F, 0x42]), // length
        Buffer.from('IDAT'),
        Buffer.from([0x78, 0x9C]), // zlib header
        Buffer.from([0x63]), // compression
        pixels,
        Buffer.from([0x02, 0x00, 0x00, 0xFF, 0xFF, 0x8D, 0x8A, 0x0D, 0x0A]) // zlib footer
    ]);
    
    // IEND chunk
    const iend = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x00]), // length: 0
        Buffer.from('IEND'),
        Buffer.from([0xAE, 0x42, 0x60, 0x82]) // CRC
    ]);
    
    return Buffer.concat([png, ihdr, idat, iend]);
}

// Create the image
const imageData = createSimplePNG();
const filePath = path.join(__dirname, 'public', 'images', 'product-image.png');
fs.writeFileSync(filePath, imageData);

console.log(`Created product image: ${filePath}`);
console.log(`File size: ${imageData.length} bytes`);
