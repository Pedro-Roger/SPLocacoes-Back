// One-off: aplica bucket policy de leitura pública (s3:GetObject) no bucket
// de imagens. Necessário porque buckets novos da AWS têm ACLs desabilitadas —
// o upload funciona mas a URL pública retorna 403 AccessDenied.
// Uso: node scripts/fix-s3-public-read.js
require('dotenv').config();
const {
  S3Client,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
} = require('@aws-sdk/client-s3');

const bucket = process.env.S3_BUCKET;
const region = process.env.AWS_REGION || 'us-east-2';

if (!bucket) {
  console.error('S3_BUCKET não definido no .env');
  process.exit(1);
}

const POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${bucket}/*`,
    },
  ],
};

async function main() {
  const s3 = new S3Client({ region });

  // Mostra a policy atual (se houver) antes de sobrescrever
  try {
    const current = await s3.send(new GetBucketPolicyCommand({ Bucket: bucket }));
    console.log('Policy atual:', current.Policy);
  } catch (err) {
    console.log('Nenhuma policy atual (ou sem acesso):', err.name);
  }

  await s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(POLICY) }));
  console.log(`✓ Bucket policy aplicada em ${bucket} (${region})`);
  console.log('  Leitura pública habilitada para arn:aws:s3:::%s/*', bucket);

  // Verifica lendo um objeto de volta
  const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
  const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
  const first = listed.Contents?.[0];
  if (first) {
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${first.Key}`;
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`✓ Verificação pública: ${res.status} → ${url}`);
  }
}

main().catch((err) => {
  console.error('Falhou:', err.message || err);
  process.exit(1);
});
