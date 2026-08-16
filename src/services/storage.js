const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Pipeline de otimização de imagem: corrige orientação EXIF, limita a 1600px
// de largura (sem ampliar imagens menores) e converte para WebP.
async function processImage(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

// Armazenamento de imagens: S3 em produção, disco local em desenvolvimento.
// Basta definir S3_BUCKET (e credenciais AWS) para ativar o S3 — nenhuma
// outra mudança de código é necessária.
async function saveImage(buffer, filename, { localBaseUrl }) {
  if (process.env.S3_BUCKET) {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const region = process.env.AWS_REGION || 'us-east-1';
    const bucket = process.env.S3_BUCKET;
    const key = `uploads/${filename}`;

    const s3 = new S3Client({ region });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=2592000',
      })
    );

    // S3_PUBLIC_URL cobre CloudFront/domínio próprio; senão, URL direta do bucket
    const base = process.env.S3_PUBLIC_URL || `https://${bucket}.s3.${region}.amazonaws.com`;
    return `${base.replace(/\/$/, '')}/${key}`;
  }

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `${localBaseUrl}/uploads/${filename}`;
}

module.exports = { saveImage, processImage };
