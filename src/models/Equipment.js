const mongoose = require('mongoose');

const CATEGORIES = [
  'graneleiro',
  'bau',
  'sider',
  'tanque',
  'frigorifico',
  'prancha',
  'cacamba',
  'outro',
];

// Modalidade comercial — separa Locação (rental) de Seminovos (sale).
// BOTH aparece nas duas áreas.
const COMMERCIAL_TYPES = ['rental', 'sale', 'both'];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

// Ficha técnica flexível: novos campos entram sem migração de schema
const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const equipmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // Usado na URL pública (/equipamento/[slug]) — importante para SEO
    slug: { type: String, required: true, unique: true, lowercase: true },
    brand: { type: String, trim: true, default: '' },
    // Modelo do equipamento (ex.: Randon, Facchini)
    model: { type: String, trim: true, default: '' },
    // Código interno exibido no painel (ex.: SP-LB-2024-001)
    sku: { type: String, trim: true, default: '' },
    // Modalidade comercial: rental (Locação), sale (Seminovos), both (ambas)
    commercialType: {
      type: String,
      enum: COMMERCIAL_TYPES,
      default: 'both',
    },
    category: { type: String, enum: CATEGORIES, required: true },
    year: { type: Number, required: true },
    axles: { type: Number, required: true, min: 1 },
    // Valor de venda exibido em Seminovos (R$) — opcional; rental puro não tem.
    salePrice: { type: Number, min: 0 },
    // Valor de locação (mantido para compat — preço histórico do card)
    priceBRL: { type: Number, min: 0 },
    lengthM: { type: Number, min: 0 },
    capacityM3: { type: Number, min: 0 },
    loadCapacityKg: { type: Number, min: 0 },
    description: { type: String, default: '' },
    images: { type: [imageSchema], default: [] },
    specs: { type: [specSchema], default: [] },
    // "rascunho" some do catálogo público imediatamente (critério do Estágio 3)
    status: {
      type: String,
      enum: ['rascunho', 'publicado'],
      default: 'rascunho',
    },
    availability: {
      type: String,
      enum: ['disponivel', 'locado', 'indisponivel', 'reservado', 'vendido'],
      default: 'disponivel',
    },
    featured: { type: Boolean, default: false },
    // Contadores agregados — incrementar com $inc, nunca reescrever o objeto
    metrics: {
      views: { type: Number, default: 0 },
      whatsappClicks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      leadsCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

equipmentSchema.index({ status: 1, availability: 1 });
equipmentSchema.index({ category: 1, status: 1 });
equipmentSchema.index({ featured: 1, status: 1 });
equipmentSchema.index({ commercialType: 1, status: 1 });
equipmentSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Equipment', equipmentSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.COMMERCIAL_TYPES = COMMERCIAL_TYPES;
