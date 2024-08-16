import { IEquipment, IIngredient, ISale } from '../electron/database';

declare global {
  interface Window {
    electronAPI: {
      getEquipment: () => Promise<IEquipment[]>;
      addEquipment: (equipment: IEquipment) => Promise<number>;
      updateEquipment: (id: number, updates: Partial<IEquipment>) => Promise<number>;
      deleteEquipment: (id: number) => Promise<void>;

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