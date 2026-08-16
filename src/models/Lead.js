const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
    },
    // Snapshot do título: o lead continua legível mesmo se o anúncio for editado/excluído
    equipmentTitle: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    message: { type: String, default: '' },
    // Funil do painel: novo → contatado → convertido | perdido
    status: {
      type: String,
      enum: ['novo', 'contatado', 'convertido', 'perdido'],
      default: 'novo',
    },
    source: {
      type: String,
      enum: ['formulario', 'whatsapp'],
      default: 'formulario',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ equipmentId: 1 });
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
