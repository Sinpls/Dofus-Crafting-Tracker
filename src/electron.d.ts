import { ICraftedItem, IIngredient, ISale, DofusDatabase } from '../src/types';

declare global {
  interface Window {
    electronAPI: {
      getCraftedItem: () => Promise<ICraftedItem[]>;
      addCraftedItem: (craftedItem: ICraftedItem) => Promise<number>;
      updateCraftedItem: (id: number, updates: Partial<ICraftedItem>) => Promise<number>;
      deleteCraftedItem: (id: number) => Promise<void>;

      getIngredients: () => Promise<IIngredient[]>;
      addIngredient: (ingredient: IIngredient) => Promise<number>;
      updateIngredient: (id: number, updates: Partial<IIngredient>) => Promise<number>;
      deleteIngredient: (id: number) => Promise<void>;

      getSales: () => Promise<ISale[]>;
      addSale: (sale: ISale) => Promise<number>;
      updateSale: (id: number, updates: Partial<ISale>) => Promise<number>;
      deleteSale: (id: number) => Promise<void>;
    };
  }
}

export {};