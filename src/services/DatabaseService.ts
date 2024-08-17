import Dexie from 'dexie';
import { ICraftedItem, IIngredient, ISale, DofusDatabase } from '../types';

class DofusDatabaseImpl extends Dexie implements DofusDatabase {
  equipment!: Dexie.Table<ICraftedItem, number>;
  ingredients!: Dexie.Table<IIngredient, number>;
  sales!: Dexie.Table<ISale, number>;

  constructor() {
    super('DofusDatabase');
    this.version(1).stores({
      equipment: '++id, ankama_id, name, amount, sellPrice',
      ingredients: '++id, name, amount, cost, type',
      sales: '++id, itemName, quantity, costPrice, sellPrice, addedDate, sellDate, profit'
    });
  }

  async addSale(sale: Omit<ISale, 'id'>): Promise<number> {
    return await this.sales.add(sale);
  }

  async getSales(): Promise<ISale[]> {
    return await this.sales.toArray();
  }

  async updateSale(id: number, updates: Partial<ISale>): Promise<number> {
    const sale = await this.sales.get(id);
    if (sale) {
      const updatedSale = { ...sale, ...updates };
      updatedSale.profit = this.calculateProfit(updatedSale);
      return await this.sales.update(id, updatedSale);
    }
    return 0;
  }

  async deleteSale(id: number): Promise<void> {
    await this.sales.delete(id);
  }

  private calculateProfit(sale: ISale): number {
    return (sale.sellPrice - sale.costPrice) * sale.quantity;
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