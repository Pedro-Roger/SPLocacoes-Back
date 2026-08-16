// Popula o catálogo com dados realistas provisórios (mitigação de risco do
// plano: conteúdo real pode não estar pronto no início).
// Uso: node scripts/seed-demo.js
require('dotenv').config();

const { connectDB } = require('../src/config/db');
const Equipment = require('../src/models/Equipment');

const ITEMS = [
  {
    title: 'Semirreboque Randon 2024 Sider',
    slug: 'semirreboque-randon-2024-sider',
    brand: 'Randon',
    sku: 'SP-SR-2024-001',
    category: 'sider',
    year: 2024,
    axles: 3,
    priceBRL: 185000,
    capacityM3: 40,
    status: 'publicado',
    availability: 'disponivel',
    featured: true,
    images: [{ url: '/placeholder-trailer.svg', alt: 'Semirreboque Randon Sider' }],
    specs: [
      { label: 'Suspensão', value: 'Pneumática' },
      { label: 'Pneus', value: '295/80 R22.5' },
    ],
  },
  {
    title: 'Semirreboque Librelato 2023 Graneleiro 4 Eixos',
    slug: 'semirreboque-librelato-2023-graneleiro',
    brand: 'Librelato',
    sku: 'SP-LB-2023-002',
    category: 'graneleiro',
    year: 2023,
    axles: 4,
    priceBRL: 185000,
    status: 'publicado',
    availability: 'disponivel',
    featured: true,
    images: [{ url: '/placeholder-trailer.svg', alt: 'Semirreboque Librelato Graneleiro' }],
  },
  {
    title: 'Semirreboque Facchini 2024 Frigorífico Thermo King',
    slug: 'semirreboque-facchini-2024-frigorifico',
    brand: 'Facchini',
    sku: 'SP-FC-2024-003',
    category: 'frigorifico',
    year: 2024,
    axles: 3,
    priceBRL: 185000,
    lengthM: 14.6,
    status: 'publicado',
    availability: 'disponivel',
    images: [{ url: '/placeholder-trailer.svg', alt: 'Semirreboque Facchini Frigorífico' }],
  },
  {
    title: 'Semirreboque Randon 2023 Prancha Carga Rebaixada',
    slug: 'semirreboque-randon-2023-prancha',
    brand: 'Randon',
    sku: 'SP-PR-2023-004',
    category: 'prancha',
    year: 2023,
    axles: 4,
    priceBRL: 118000,
    lengthM: 15,
    status: 'publicado',
    availability: 'disponivel',
    images: [{ url: '/placeholder-trailer.svg', alt: 'Semirreboque Randon Prancha' }],
  },
];

async function main() {
  await connectDB();
  for (const item of ITEMS) {
    await Equipment.findOneAndUpdate({ slug: item.slug }, item, { upsert: true });
  }
  console.log(`${ITEMS.length} equipamentos de demonstração criados/atualizados.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
