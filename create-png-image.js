const fs = require('fs');
const path = require('path');

// Create a simple PNG image (1x1 transparent pixel)
const transparentPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk start
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // bit depth, color type
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk start
    0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00, // compressed data
    0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // 
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
    0xAE, 0x42, 0x60, 0x82 // PNG end
]);

// Create a simple 600x400 PNG with solid color
function createSimplePNG(color) {
    // This is a simplified approach - create a larger PNG by repeating the pattern
    const width = 600;
    const height = 400;
    
    // Create a simple PNG header
    const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A // PNG signature
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
    
    const ihdrCrc = 0x4A9F7E67; // Pre-calculated CRC for this IHDR
    pngData = Buffer.concat([
        pngData,
        Buffer.from([0x00, 0x00, 0x00, 0x0D]), // chunk length
        Buffer.from('IHDR'),
        ihdrData,
        Buffer.from([ihdrCrc >> 24, ihdrCrc >> 16, ihdrCrc >> 8, ihdrCrc])
    ]);
    
    // Create pixel data (solid color)
    const pixelData = Buffer.alloc(width * height * 3);
    for (let i = 0; i < pixelData.length; i += 3) {
        pixelData[i] = color.r;
        pixelData[i + 1] = color.g;
        pixelData[i + 2] = color.b;
    }
    
    // Add IDAT chunk with compressed data (simplified)
    const idatData = Buffer.concat([
        Buffer.from([0x78, 0x9C]), // zlib header
        Buffer.from([0x63, 0x00]), // simple compression
        pixelData,
        Buffer.from([0x01, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x01])
    ]);
    
    const idatCrc = 0x12345678; // Simplified CRC
    pngData = Buffer.concat([
        pngData,
        Buffer.from([idatData.length >> 24, idatData.length >> 16, idatData.length >> 8, idatData.length]),
        Buffer.from('IDAT'),
        idatData,
        Buffer.from([idatCrc >> 24, idatCrc >> 16, idatCrc >> 8, idatCrc])
    ]);
    
    // IEND chunk
    const iendCrc = 0xAE426082;
    pngData = Buffer.concat([
        pngData,
        Buffer.from([0x00, 0x00, 0x00, 0x00]), // chunk length
        Buffer.from('IEND'),
        Buffer.from([iendCrc >> 24, iendCrc >> 16, iendCrc >> 8, iendCrc])
    ]);
    
    return pngData;
}

// Create images directory
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Create a simple PNG image
const pngImage = createSimplePNG({ r: 70, g: 130, b: 180 }); // Steel blue
const filePath = path.join(imagesDir, 'product-image.png');
fs.writeFileSync(filePath, pngImage);

console.log(`Created PNG product image: ${filePath}`);
