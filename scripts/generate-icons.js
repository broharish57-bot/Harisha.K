import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Function to generate a simple uncompressed PNG with teal background and white cross
function createPng(width, height) {
  // A minimal valid PNG generator in pure Node without external dependencies
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    // Calculate CRC32
    let crc = 0xFFFFFFFF;
    const combined = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < combined.length; i++) {
      let byte = combined[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xEDB88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    crcBuf.writeInt32BE((crc ^ 0xFFFFFFFF) | 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 2; // Color type 2 (RGB)
  ihdr[10] = 0; // Compression deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace none

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw pixel data: each scanline has 1 filter byte (0) + width * 3 bytes (R, G, B)
  const rowLen = 1 + width * 3;
  const rawData = Buffer.alloc(rowLen * height);

  const cx = width / 2;
  const cy = height / 2;
  const armWidth = Math.floor(width * 0.18);
  const armLength = Math.floor(width * 0.55);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      
      // Is pixel in the white cross?
      const inV = Math.abs(x - cx) <= armWidth / 2 && Math.abs(y - cy) <= armLength / 2;
      const inH = Math.abs(y - cy) <= armWidth / 2 && Math.abs(x - cx) <= armLength / 2;

      if (inV || inH) {
        rawData[pxOffset] = 255;     // R
        rawData[pxOffset + 1] = 255; // G
        rawData[pxOffset + 2] = 255; // B
      } else {
        // Teal background (#0d9488 => 13, 148, 136)
        rawData[pxOffset] = 13;
        rawData[pxOffset + 1] = 148;
        rawData[pxOffset + 2] = 136;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('./public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180));

console.log('PWA PNG icons generated successfully in public/');
