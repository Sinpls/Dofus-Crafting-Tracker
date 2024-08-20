import Dexie from 'dexie';
import { ICraftedItem, IIngredient, ISale, DofusDatabase } from '../types';

class DofusDatabaseImpl extends Dexie implements DofusDatabase {
  craftedItem!: Dexie.Table<ICraftedItem, number>;
  ingredients!: Dexie.Table<IIngredient, number>;
  sales!: Dexie.Table<ISale, number>;

  constructor() {
    super('DofusDatabase');
    this.version(1).stores({
      craftedItem: '++id, ankama_id, name, amount, sellPrice',
      ingredients: '++id, name, amount, cost, type',
      sales: '++id, itemName, quantity, costPrice, sellPrice, addedDate, sellDate, profit'
    });
    this.version(2).stores({
      sales: '++id, itemName, quantity, costPrice, sellPrice, addedDate, sellDate, profit'
    }).upgrade(tx => {
      return tx.table('sales').toCollection().modify(sale => {
        if (!sale.addedDate) {
          sale.addedDate = new Date();
        }
      });
    });
  }

  async addSale(sale: Omit<ISale, 'id'>): Promise<number> {
    return await this.sales.add(sale);
  }

  async getSales(page: number = 1, itemsPerPage: number = 10, filters: Partial<ISale> = {}): Promise<{ sales: ISale[], total: number }> {
    try {
      let query = this.sales.orderBy('addedDate');

      // Apply filters
      if (filters.itemName) {
        query = query.filter(sale => sale.itemName.toLowerCase().includes(filters.itemName!.toLowerCase()));
      }
      if (filters.sellDate !== undefined) {
        query = filters.sellDate === null
          ? query.filter(sale => sale.sellDate === null)
          : query.filter(sale => sale.sellDate !== null);
      }

      const total = await query.count();

      const sales = await query
        .reverse() // To get the most recent sales first
        .offset((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .toArray();

      return { sales, total };
    } catch (error) {
      console.error('Error in getSales:', error);
      throw error;
    }
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

  async getTotalProfitAndTurnover(): Promise<{ totalProfit: number, totalTurnover: number }> {
    const sales = await this.sales.toArray();
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.sellDate ? sale.profit : 0), 0);
    const totalTurnover = sales.reduce((sum, sale) => sum + (sale.sellDate ? sale.sellPrice * sale.quantity : 0), 0);
    return { totalProfit, totalTurnover };
  }
}

const db = new DofusDatabaseImpl();

export async function setupDatabase() {
  try {
    await db.open();
    console.log('Database opened successfully');
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
}

export { db };