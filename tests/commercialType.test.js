const request = require('supertest');

const app = require('../src/app');
const { createEquipment } = require('./helpers/factories');

describe('modalidade comercial (commercialType)', () => {
  test('rental aparece em /locacao, sale não aparece', async () => {
    await createEquipment({ title: 'Rental', slug: 'rental-1', commercialType: 'rental' });
    await createEquipment({ title: 'Sale', slug: 'sale-1', commercialType: 'sale' });

    const res = await request(app).get('/api/equipamentos?modalidade=rental');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('rental-1');
  });

  test('sale aparece em /seminovos, rental não aparece', async () => {
    await createEquipment({ title: 'Rental', slug: 'rental-2', commercialType: 'rental' });
    await createEquipment({ title: 'Sale', slug: 'sale-2', commercialType: 'sale' });

    const res = await request(app).get('/api/equipamentos?modalidade=sale');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('sale-2');
  });

  test('both aparece em /locacao e em /seminovos', async () => {
    await createEquipment({ title: 'Both', slug: 'both-1', commercialType: 'both' });

    const locacao = await request(app).get('/api/equipamentos?modalidade=rental');
    const seminovos = await request(app).get('/api/equipamentos?modalidade=sale');

    expect(locacao.body.items).toHaveLength(1);
    expect(locacao.body.items[0].slug).toBe('both-1');
    expect(seminovos.body.items).toHaveLength(1);
    expect(seminovos.body.items[0].slug).toBe('both-1');
  });

  test('sem modalidade retorna todos os publicados', async () => {
    await createEquipment({ title: 'Rental', slug: 'r-all', commercialType: 'rental' });
    await createEquipment({ title: 'Sale', slug: 's-all', commercialType: 'sale' });
    await createEquipment({ title: 'Both', slug: 'b-all', commercialType: 'both' });

    const res = await request(app).get('/api/equipamentos');

    expect(res.body.items).toHaveLength(3);
  });

  test('filtro por ano', async () => {
    await createEquipment({ title: 'Ano 2023', slug: 'a-2023', year: 2023 });
    await createEquipment({ title: 'Ano 2024', slug: 'a-2024', year: 2024 });

    const res = await request(app).get('/api/equipamentos?ano=2024');

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].year).toBe(2024);
  });

  test('commercialType default é both', async () => {
    const eq = await createEquipment({ title: 'Default', slug: 'default-ct' });
    expect(eq.commercialType).toBe('both');
  });

  test('salePrice opcional — rental sem salePrice', async () => {
    const eq = await createEquipment({
      title: 'Rental Sem Preco',
      slug: 'rental-no-price',
      commercialType: 'rental',
    });
    expect(eq.salePrice).toBeUndefined();
  });

  test('availability estendida: reservado e vendido', async () => {
    const reservado = await createEquipment({
      title: 'Reservado',
      slug: 'reservado-1',
      availability: 'reservado',
    });
    const vendido = await createEquipment({
      title: 'Vendido',
      slug: 'vendido-1',
      availability: 'vendido',
    });
    expect(reservado.availability).toBe('reservado');
    expect(vendido.availability).toBe('vendido');
  });
});
