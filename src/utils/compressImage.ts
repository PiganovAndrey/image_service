import sharp from 'sharp';

export default async function compressImage(
    file: Express.Multer.File,
    desiredSize: number,
    quality: number,
    width: number,
    height: number
) {
    let compressedBuffer = file.buffer;
    let compressedSize = file.size;
    while (compressedSize > desiredSize) {
        compressedBuffer = await sharp(compressedBuffer).resize({ width, height }).jpeg({ quality }).toBuffer();
        compressedSize = compressedBuffer.length;
    }
    return compressedBuffer;
}
