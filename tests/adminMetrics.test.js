const { createEquipment } = require('./helpers/factories');
const { loginAsAdmin } = require('./helpers/auth');

describe('GET /api/painel/metricas', () => {
  test('reflete anúncios ativos, novos leads e cliques com valores reais', async () => {
    await createEquipment({ title: 'A', slug: 'a', status: 'publicado' });
    await createEquipment({ title: 'B', slug: 'b', status: 'publicado' });
    await createEquipment({
      title: 'C',
      slug: 'c',
      status: 'rascunho',
      metrics: { views: 3, whatsappClicks: 2, shares: 0, leadsCount: 0 },
    });
    await createEquipment({
      title: 'D',
      slug: 'd',
      status: 'publicado',
      metrics: { views: 5, whatsappClicks: 1, shares: 0, leadsCount: 0 },
    });

    const { agent } = await loginAsAdmin();
    const res = await agent.get('/api/painel/metricas');

    expect(res.status).toBe(200);
    expect(res.body.anunciosAtivos).toBe(3); // A, B, D publicados
    expect(res.body.cliquesWhatsapp).toBe(3); // 2 + 1
    expect(res.body.visualizacoes).toBe(8); // 3 + 5
  });

  test('sem nenhum anúncio, retorna zeros em vez de erro', async () => {
    const { agent } = await loginAsAdmin();
    const res = await agent.get('/api/painel/metricas');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      anunciosAtivos: 0,
      novosLeads: 0,
      cliquesWhatsapp: 0,
      visualizacoes: 0,
    });
  });
});
