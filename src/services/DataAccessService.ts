import axios from 'axios';
import { IDofusItem, IIngredient, IDataFile } from '../types';
import { joinPaths } from '../utils/pathUtils';

declare global {
  interface Window {
    electronAPI: {
      getDataPath: () => Promise<string>;
      getUserDataPath: () => Promise<string>;
      fileExists: (path: string) => Promise<boolean>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, data: string) => Promise<void>;
    }
  }
}

class DataAccessService {
  private dataFiles: IDataFile[] = [
    { filename: 'dofus_equipment.json', url: 'https://api.dofusdu.de/dofus2/en/items/equipment/all', data: [] },
    { filename: 'dofus_resources.json', url: 'https://api.dofusdu.de/dofus2/en/items/resources/all', data: [] },
    { filename: 'dofus_consumables.json', url: 'https://api.dofusdu.de/dofus2/en/items/consumables/all', data: [] }
  ];

  private ingredientCosts: { [key: string]: IIngredient } = {};
  private dataPath: string = '';
  private cache: { [key: string]: IDofusItem[] } = {};

  async init() {
    try {
      this.dataPath = await window.electronAPI.getDataPath();
      console.log('Data path:', this.dataPath);
    } catch (error) {
      console.error('Failed to get data path:', error);
      throw new Error('Failed to initialize DataAccessService: Unable to get data path');
    }

    await this.loadIngredientCosts();
  }

  private async loadFile(file: IDataFile): Promise<void> {
    const filePath = joinPaths(this.dataPath, file.filename);
    const fileExists = await window.electronAPI.fileExists(filePath);

    if (fileExists) {
      const fileContent = await window.electronAPI.readFile(filePath);
      const parsedData = JSON.parse(fileContent);
      file.data = parsedData.items;
      file.lastUpdated = parsedData.lastUpdated;
    } else {
      await this.downloadAndStoreFile(file);
    }
  }

  private async downloadAndStoreFile(file: IDataFile) {
    try {
      const response = await axios.get(file.url);
      file.data = response.data.items;
      file.lastUpdated = Date.now();
      const filePath = joinPaths(this.dataPath, file.filename);
      await window.electronAPI.writeFile(filePath, JSON.stringify({ items: file.data, lastUpdated: file.lastUpdated }));
    } catch (error) {
      console.error(`Error downloading ${file.filename}:`, error);
      throw error;
    }
  }

  async searchItems(searchTerm: string): Promise<IDofusItem[]> {
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (this.cache[lowerSearchTerm]) {
      return this.cache[lowerSearchTerm];
    }

    let results: IDofusItem[] = [];
    for (const file of this.dataFiles) {
      if (file.data.length === 0) {
        await this.loadFile(file);
      }
      results = results.concat(file.data.filter(item => 
        item.name.toLowerCase().includes(lowerSearchTerm)
      ));
    }

    this.cache[lowerSearchTerm] = results;
    return results;
  }

  getItemDetails(ankamaId: number): IDofusItem | undefined {
    for (const file of this.dataFiles) {
      const item = file.data.find(item => item.ankama_id === ankamaId);
      if (item) return item;
    }
    return undefined;
  }

  async loadIngredientCosts(): Promise<{ [key: string]: IIngredient }> {
    const filePath = joinPaths(this.dataPath, 'ingredient_costs.json');
    try {
      const fileExists = await window.electronAPI.fileExists(filePath);
      if (fileExists) {
        const fileContent = await window.electronAPI.readFile(filePath);
        this.ingredientCosts = JSON.parse(fileContent);
      }
      return this.ingredientCosts;
    } catch (error) {
      console.error('Error loading ingredient costs:', error);
      return {};
    }
  }

  async setIngredientCost(name: string, ingredient: IIngredient): Promise<void> {
    this.ingredientCosts[name] = ingredient;
    await this.saveIngredientCosts();
  }

  async getIngredientCost(name: string): Promise<number> {
    return this.ingredientCosts[name]?.cost || 0;
  }

  private async saveIngredientCosts(): Promise<void> {
    const filePath = joinPaths(this.dataPath, 'ingredient_costs.json');
    try {
      await window.electronAPI.writeFile(filePath, JSON.stringify(this.ingredientCosts));
    } catch (error) {
      console.error('Error saving ingredient costs:', error);
    }
  }

  async checkForUpdates(): Promise<void> {
    const updateInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    for (const file of this.dataFiles) {
      if (!file.lastUpdated || Date.now() - file.lastUpdated > updateInterval) {
        await this.downloadAndStoreFile(file);
      }
    }
  }

  clearCache(): void {
    this.cache = {};
  }
}

export const dataAccessService = new DataAccessService();