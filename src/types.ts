import Dexie from 'dexie';

export interface ICraftedItem {
  id?: number;
  ankama_id: number;
  name: string;
  amount: number;
  costPerUnit: number;
  sellPrice: number;
  profit: number;
}

export interface IIngredient {
  ankama_id?: number;
  name: string;
  amount: number;
  cost: number;
  type: string;
  isManuallyOverridden?: boolean;
}

export interface ISale {
  id?: number;
  itemName: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  addedDate: Date;
  sellDate: Date | null;
  profit: number;
}
export interface IIntermediateItem {
    name: string;
    amount: number;
    cost: number;
    level: number;
    isManuallyOverridden: boolean;
  }

export interface IDofusItem {
  ankama_id: number;
  name: string;
  level: number;
  type: {
    name: string;
    id: number;
  };
  recipe?: any[]; // We'll define this more precisely if needed later
}

export interface IDataFile {
  filename: string;
  url: string;
  data: IDofusItem[];
}

export interface DofusDatabase extends Dexie {
  equipment: Dexie.Table<ICraftedItem, number>;
  ingredients: Dexie.Table<IIngredient, number>;
  sales: Dexie.Table<ISale, number>;
}