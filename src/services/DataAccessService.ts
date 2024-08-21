import axios from 'axios';
import { IDofusItem } from '../types';
import { joinPaths } from '../utils/pathUtils';

interface DataFile {
  filename: string;
  url: string;
  data: IDofusItem[];
}

declare global {
  interface Window {
    electronAPI: {
      getDataPath: () => Promise<string>;
      fileExists: (path: string) => Promise<boolean>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, data: string) => Promise<void>;
    }
  }
}

class DataAccessService {
  private dataFiles: DataFile[] = [
    { filename: 'dofus_equipment.json', url: 'https://api.dofusdu.de/dofus2/en/items/equipment/all', data: [] },
    { filename: 'dofus_resources.json', url: 'https://api.dofusdu.de/dofus2/en/items/resources/all', data: [] },
    { filename: 'dofus_consumables.json', url: 'https://api.dofusdu.de/dofus2/en/items/consumables/all', data: [] }
  ];

  private ingredientCosts: { [key: string]: number } = {};
  private dataPath: string = '';

  async init() {
    try {
      this.dataPath = await window.electronAPI.getDataPath();
      console.log('Data path:', this.dataPath);
    } catch (error) {
      console.error('Failed to get data path:', error);
      throw new Error('Failed to initialize DataAccessService: Unable to get data path');
    }

    try {
      await Promise.all(this.dataFiles.map(file => this.checkAndUpdateFile(file)));
      await this.loadIngredientCosts();
    } catch (error) {
      console.error('Failed to initialize data files:', error);
      throw new Error('Failed to initialize DataAccessService: Unable to load data files');
    }
  }

  private async checkAndUpdateFile(file: DataFile) {
    const filePath = joinPaths(this.dataPath, file.filename);
    const timestampPath = joinPaths(this.dataPath, `${file.filename}_timestamp`);

    try {
      const fileExists = await window.electronAPI.fileExists(filePath);
      const timestampExists = await window.electronAPI.fileExists(timestampPath);

      if (!fileExists || !timestampExists || await this.isDataStale(timestampPath)) {
        await this.downloadAndStoreFile(file);
      } else {
        const fileContent = await window.electronAPI.readFile(filePath);
        file.data = JSON.parse(fileContent).items;
      }
    } catch (error) {
      console.error(`Error processing file ${file.filename}:`, error);
      throw error;
    }
  }

  private async isDataStale(timestampPath: string): Promise<boolean> {
    try {
      const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const timestamp = parseInt(await window.electronAPI.readFile(timestampPath));
      return Date.now() - timestamp > staleThreshold;
    } catch (error) {
      console.error('Error checking if data is stale:', error);
      return true; // Assume data is stale if we can't read the timestamp
    }
  }

  private async downloadAndStoreFile(file: DataFile) {
    try {
      const response = await axios.get(file.url);
      file.data = response.data.items;
      const filePath = joinPaths(this.dataPath, file.filename);
      const timestampPath = joinPaths(this.dataPath, `${file.filename}_timestamp`);
      await window.electronAPI.writeFile(filePath, JSON.stringify(response.data));
      await window.electronAPI.writeFile(timestampPath, Date.now().toString());
    } catch (error) {
      console.error(`Error downloading ${file.filename}:`, error);
      throw error;
    }
  }

  private async loadIngredientCosts(): Promise<void> {
    const costsPath = joinPaths(this.dataPath, 'ingredientCosts.json');
    try {
      if (await window.electronAPI.fileExists(costsPath)) {
        const costsData = await window.electronAPI.readFile(costsPath);
        this.ingredientCosts = JSON.parse(costsData);
      }
    } catch (error) {
      console.error('Error loading ingredient costs:', error);
    }
  }

  private async saveIngredientCosts(): Promise<void> {
    const costsPath = joinPaths(this.dataPath, 'ingredientCosts.json');
    try {
      await window.electronAPI.writeFile(costsPath, JSON.stringify(this.ingredientCosts));
    } catch (error) {
      console.error('Error saving ingredient costs:', error);
    }
  }

  searchItems(searchTerm: string): IDofusItem[] {
    let results: IDofusItem[] = [];
    for (const file of this.dataFiles) {
      results = results.concat(file.data.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
    return results;
  }

  getItemDetails(ankamaId: number): IDofusItem | undefined {
    for (const file of this.dataFiles) {
      const item = file.data.find(item => item.ankama_id === ankamaId);
      if (item) return item;
    }
    return undefined;
  }

  getIngredientCost(name: string): number {
    return this.ingredientCosts[name] || 0;
  }

  setIngredientCost(name: string, cost: number): void {
    this.ingredientCosts[name] = cost;
    this.saveIngredientCosts();
  }
}

export const dataAccessService = new DataAccessService();