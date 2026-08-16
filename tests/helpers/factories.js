const Equipment = require('../../src/models/Equipment');

const BASE_EQUIPMENT = {
  title: 'Semirreboque Randon 2024 Sider',
  slug: 'semirreboque-randon-2024-sider',
  category: 'sider',
  year: 2024,
  axles: 3,
  status: 'publicado',
  availability: 'disponivel',
};

async function createEquipment(overrides = {}) {
  return Equipment.create({ ...BASE_EQUIPMENT, ...overrides });
}

module.exports = { createEquipment, BASE_EQUIPMENT };
