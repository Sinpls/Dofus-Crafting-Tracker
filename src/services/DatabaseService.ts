import Dexie from 'dexie';
import { ICraftedItem, IIngredient, ISale, DofusDatabase } from '../types';
import { joinPaths } from '../utils/pathUtils';

class DofusDatabaseImpl extends Dexie implements DofusDatabase {
  craftedItem!: Dexie.Table<ICraftedItem, number>;
  ingredients!: Dexie.Table<IIngredient, number>;
  sales!: Dexie.Table<ISale, number>;

  constructor() {
    const userDataPath = localStorage.getItem('dataPath') || '';
    const dbPath = joinPaths(userDataPath, 'dofus-salescraft.db');

    super(dbPath);

    this.version(4).stores({
      craftedItem: '++id, ankama_id, name, amount, sellPrice',
      ingredients: '++id, name, amount, cost, type',
      sales: '++id, itemName, quantity, quantitySold, costPrice, sellPrice, addedDate, profit'
    }).upgrade(tx => {
      return tx.table('sales').toCollection().modify(sale => {
        delete sale.sellDate;
      });
    });
  }

  async addSale(sale: Omit<ISale, 'id'>): Promise<number> {
    return await this.sales.add({
      ...sale,
      quantitySold: sale.quantitySold || 0
    });
  }

  async getSales(page: number = 1, itemsPerPage: number = 10, filters: Partial<ISale> = {}): Promise<{ sales: ISale[], total: number }> {
    try {
      let query = this.sales.orderBy('addedDate');

      // Apply filters
      if (filters.itemName) {
        query = query.filter(sale => sale.itemName.toLowerCase().includes(filters.itemName!.toLowerCase()));
      }
      if (filters.quantitySold !== undefined) {
        query = filters.quantitySold === 0
          ? query.filter(sale => sale.quantitySold === 0)
          : query.filter(sale => sale.quantitySold > 0);
      }

      const total = await query.count();

      const sales = await query
        .reverse() // To get the most recent sales first
        .offset((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .toArray();

      console.log('Fetched sales:', sales);

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
      
      const result = await this.sales.update(id, updatedSale);
      
      if (result === 0) {
        console.error(`Failed to update sale with id ${id}`);
      } else {
        console.log(`Successfully updated sale with id ${id}`, updatedSale);
      }
      
      return result;
    }
    return 0;
  }

  async deleteSale(id: number): Promise<void> {
    await this.sales.delete(id);
  }

  private calculateProfit(sale: ISale): number {
    return (sale.sellPrice - sale.costPrice) * sale.quantitySold;
  }

  async getTotalProfitAndTurnover(): Promise<{ totalProfit: number, totalTurnover: number }> {
    const sales = await this.sales.toArray();
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalTurnover = sales.reduce((sum, sale) => sum + (sale.sellPrice * sale.quantitySold), 0);
    return { totalProfit, totalTurnover };
  }

  async moveUnsold(id: number): Promise<void> {
    const sale = await this.sales.get(id);
    console.log('Original sale:', sale);
    if (sale && sale.quantity > sale.quantitySold) {
      const unsoldQuantity = sale.quantity - sale.quantitySold;
      
      // Create new row for unsold items
      const { id: _, ...saleWithoutId } = sale;
      await this.addSale({
        ...saleWithoutId,
        quantity: unsoldQuantity,
        quantitySold: 0,
        profit: 0,
        addedDate: new Date()
      });

      // Update original row
      const updatedSale: Partial<ISale> = {
        quantity: sale.quantitySold,
        profit: this.calculateProfit({...sale, quantity: sale.quantitySold})
      };
      
      console.log('Updated sale:', updatedSale);
      const updateResult = await this.updateSale(id, updatedSale);
      console.log('Update result:', updateResult);
      
      if (updateResult === 0) {
        console.error(`Failed to update sale with id ${id}`);
        throw new Error(`Failed to update sale with id ${id}`);
      }
    }
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