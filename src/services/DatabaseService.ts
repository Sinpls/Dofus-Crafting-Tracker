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

    this.version(5).stores({
      craftedItem: '++id, ankama_id, name, amount, sellPrice',
      ingredients: '++id, name, amount, cost, type',
      sales: '++id, itemName, quantity, quantitySold, costPrice, sellPrice, addedDate, profit'
    });

    this.version(6).stores({
      sales: '++id, itemName, quantity, quantitySold, costPrice, sellPrice, addedDate, profit, *tags'
    }).upgrade(tx => {
      return tx.table('sales').toCollection().modify(sale => {
        if (!sale.tags || !Array.isArray(sale.tags)) {
          sale.tags = [sale.itemName.toLowerCase()];
        }
      });
    });

    this.version(7).stores({
      sales: '++id, itemName, quantity, quantitySold, costPrice, sellPrice, addedDate, profit, *tags'
    }).upgrade(tx => {
      return tx.table('sales').toCollection().modify(sale => {
        if (!sale.itemName) {
          delete sale.id; // This will cause Dexie to remove the entry
        }
      });
    });
    
  }

  async addSale(sale: Omit<ISale, 'id'>): Promise<number> {
    return await this.sales.add({
      ...sale,
      quantitySold: sale.quantitySold || 0,
      tags: [sale.itemName.toLowerCase()]
    });
  }

  async getSales(page: number = 1, itemsPerPage: number = 10, filters: Partial<ISale> = {}): Promise<{ sales: ISale[], total: number }> {
    try {
      let query = this.sales.orderBy('addedDate');
  
      if (filters.itemName) {
        const searchTerm = filters.itemName.toLowerCase();
        query = query.filter(sale => {
          if (sale.tags && Array.isArray(sale.tags)) {
            return sale.tags.some(tag => tag.includes(searchTerm));
          } else {
            return sale.itemName.toLowerCase().includes(searchTerm);
          }
        });
      }
  
      if (filters.quantitySold !== undefined) {
        if (filters.quantitySold === -1) { // Sold
          query = query.filter(sale => sale.quantitySold === sale.quantity);
        } else if (filters.quantitySold === -2) { // Unsold
          query = query.filter(sale => sale.quantitySold !== sale.quantity);
        }
      }
  
      const total = await query.count();
  
      const sales = await query
        .reverse() // To get the most recent sales first
        .offset((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .toArray();
  
      // Filter out any potential empty or invalid entries
      const validSales = sales.filter(sale => sale && sale.itemName);
  
      console.log('Fetched sales:', validSales);
  
      return { sales: validSales, total };
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
      
      if (updates.itemName) {
        updatedSale.tags = [updatedSale.itemName.toLowerCase()];
      }
      
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

  async addCraftedItem(item: Omit<ICraftedItem, 'id'>): Promise<number> {
    return await this.craftedItem.add(item);
  }

  async getCraftedItems(): Promise<ICraftedItem[]> {
    return await this.craftedItem.toArray();
  }

  async updateCraftedItem(id: number, updates: Partial<ICraftedItem>): Promise<number> {
    return await this.craftedItem.update(id, updates);
  }

  async deleteCraftedItem(id: number): Promise<void> {
    await this.craftedItem.delete(id);
  }

  async addIngredient(ingredient: Omit<IIngredient, 'id'>): Promise<number> {
    return await this.ingredients.add(ingredient);
  }

  async getIngredients(): Promise<IIngredient[]> {
    return await this.ingredients.toArray();
  }

  async updateIngredient(id: number, updates: Partial<IIngredient>): Promise<number> {
    return await this.ingredients.update(id, updates);
  }

  async deleteIngredient(id: number): Promise<void> {
    await this.ingredients.delete(id);
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