const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // URL pública (/atualizacoes/[slug]) — importante para SEO e compartilhamento
    slug: { type: String, required: true, unique: true, lowercase: true },
    coverImage: {
      url: { type: String },
      alt: { type: String, default: '' },
    },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['rascunho', 'publicado', 'agendado'],
      default: 'rascunho',
    },
    publishedAt: { type: Date },
    // Agendamento sem cron: a query pública trata "agendado" com
    // scheduledFor <= agora como publicada
    // (ver docs/modelagem-banco.md na raiz do projeto)
    scheduledFor: { type: Date },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ status: 1, scheduledFor: 1 });

// Filtro reutilizável do mural público
newsSchema.statics.publicFilter = function () {
  return {
    $or: [
      { status: 'publicado' },
      { status: 'agendado', scheduledFor: { $lte: new Date() } },
    ],
  };
};

// Auto-publicação: ao marcar como "publicado" sem publishedAt definido,
// carimba a data automaticamente — vale tanto para criação (News.create)
// quanto para atualização (findByIdAndUpdate) usadas no painel.
newsSchema.pre('save', function (next) {
  if (this.status === 'publicado' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

newsSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  if (update.status === 'publicado' && !update.publishedAt) {
    update.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('News', newsSchema);
