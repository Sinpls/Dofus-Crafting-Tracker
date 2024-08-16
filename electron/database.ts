import Dexie from 'dexie';
import { ICraftemItem, IIngredient, ISale, DofusDatabase } from '../src/types';

class DofusDatabaseImpl extends Dexie implements DofusDatabase {
  equipment!: Dexie.Table<ICraftemItem, number>;
  ingredients!: Dexie.Table<IIngredient, number>;
  sales!: Dexie.Table<ISale, number>;

  constructor() {
    super('DofusDatabase');
    this.version(1).stores({
      equipment: '++id, ankama_id, name, amount, sellPrice',
      ingredients: '++id, name, amount, cost, type',
      sales: '++id, itemId, quantity, price, date'
    });
  }
}

const db = new DofusDatabaseImpl();

export async function setupDatabase() {
  try {
    await db.open();
    console.log('Database opened successfully');
  } catch (error) {
    console.error('Error opening database:', error);
  }
}

export { db };