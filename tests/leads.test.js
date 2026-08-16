const request = require('supertest');

const app = require('../src/app');
const Equipment = require('../src/models/Equipment');
const Lead = require('../src/models/Lead');
const { createEquipment } = require('./helpers/factories');
const { loginAsAdmin } = require('./helpers/auth');

describe('leads — captação pública e funil administrativo', () => {
  test('POST /api/leads cria o lead com snapshot do título e incrementa leadsCount', async () => {
    const equipment = await createEquipment({ title: 'Sider Randon 2024' });

    const res = await request(app).post('/api/leads').send({
      equipmentId: equipment._id.toString(),
      name: 'João Frotista',
      phone: '11999999999',
    });

    expect(res.status).toBe(201);
    expect(res.body.equipmentTitle).toBe('Sider Randon 2024');
    expect(res.body.status).toBe('novo');

    const updated = await Equipment.findById(equipment._id);
    expect(updated.metrics.leadsCount).toBe(1);
  });

  test('lead sobrevive à exclusão do anúncio original (snapshot do título)', async () => {
    const equipment = await createEquipment({ title: 'Sider que será excluído' });
    const lead = await Lead.create({
      equipmentId: equipment._id,
      equipmentTitle: equipment.title,
      name: 'Maria',
      phone: '11988887777',
    });
    await Equipment.findByIdAndDelete(equipment._id);

    const { agent } = await loginAsAdmin();
    const res = await agent.get('/api/painel/leads');

    const found = res.body.items.find((l) => l._id === lead._id.toString());
    expect(found.equipmentTitle).toBe('Sider que será excluído');
  });

  test('POST /api/leads com equipmentId de anúncio inexistente retorna 400', async () => {
    const { Types } = require('mongoose');
    const res = await request(app).post('/api/leads').send({
      equipmentId: new Types.ObjectId().toString(),
      name: 'João',
      phone: '11999999999',
    });

    expect(res.status).toBe(400);
  });

  test('painel move um lead pelo funil: novo → contatado → convertido', async () => {
    const equipment = await createEquipment({});
    const lead = await Lead.create({
      equipmentId: equipment._id,
      equipmentTitle: equipment.title,
      name: 'Ana',
      phone: '11977776666',
    });

    const { agent } = await loginAsAdmin();

    const toContatado = await agent
      .patch(`/api/painel/leads/${lead._id}/status`)
      .send({ status: 'contatado' });
    expect(toContatado.body.status).toBe('contatado');

    const toConvertido = await agent
      .patch(`/api/painel/leads/${lead._id}/status`)
      .send({ status: 'convertido' });
    expect(toConvertido.body.status).toBe('convertido');
  });

  test('painel filtra leads por status', async () => {
    const equipment = await createEquipment({});
    await Lead.create({
      equipmentId: equipment._id,
      equipmentTitle: equipment.title,
      name: 'Novo Lead',
      phone: '11911112222',
      status: 'novo',
    });
    await Lead.create({
      equipmentId: equipment._id,
      equipmentTitle: equipment.title,
      name: 'Lead Perdido',
      phone: '11933334444',
      status: 'perdido',
    });

    const { agent } = await loginAsAdmin();
    const res = await agent.get('/api/painel/leads?status=perdido');

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe('Lead Perdido');
  });

  test('rotas de leads do painel exigem autenticação', async () => {
    const res = await request(app).get('/api/painel/leads');
    expect(res.status).toBe(401);
  });
});
