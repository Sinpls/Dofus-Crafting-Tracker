// src/services/DataAccessService.ts

import axios from 'axios';
import { IDofusItem } from '../types';

interface DataFile {
  filename: string;
  url: string;
  data: IDofusItem[];
}

class DataAccessService {
  private dataFiles: DataFile[] = [
    { filename: 'dofus_equipment.json', url: 'https://api.dofusdu.de/dofus2/en/items/equipment/all', data: [] },
    { filename: 'dofus_resources.json', url: 'https://api.dofusdu.de/dofus2/en/items/resources/all', data: [] },
    { filename: 'dofus_consumables.json', url: 'https://api.dofusdu.de/dofus2/en/items/consumables/all', data: [] }
  ];

  private ingredientCosts: { [key: string]: number } = {};

  async init() {
    await Promise.all(this.dataFiles.map(file => this.checkAndUpdateFile(file)));
    this.loadIngredientCosts();
  }

  private async checkAndUpdateFile(file: DataFile) {
    const storedData = localStorage.getItem(file.filename);
    const storedTimestamp = localStorage.getItem(`${file.filename}_timestamp`);

    if (!storedData || !storedTimestamp || this.isDataStale(storedTimestamp)) {
      await this.downloadAndStoreFile(file);
    } else {
      file.data = JSON.parse(storedData).items;
    }
  }

  private isDataStale(timestamp: string): boolean {
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return Date.now() - parseInt(timestamp) > staleThreshold;
  }

  private async downloadAndStoreFile(file: DataFile) {
    try {
      const response = await axios.get(file.url);
      file.data = response.data.items;
      localStorage.setItem(file.filename, JSON.stringify(response.data));
      localStorage.setItem(`${file.filename}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error(`Error downloading ${file.filename}:`, error);
      throw error;
    }
  }

  searchItems(searchTerm: string, dataType?: 'equipment' | 'resources' | 'consumables'): IDofusItem[] {
    let results: IDofusItem[] = [];
    
    if (dataType) {
      const file = this.dataFiles.find(f => f.filename.includes(dataType));
      if (file) {
        results = file.data.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    } else {
      // Search across all data files if no specific type is provided
      for (const file of this.dataFiles) {
        results = results.concat(file.data.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      }
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

  private loadIngredientCosts(): void {
    const storedCosts = localStorage.getItem('ingredientCosts');
    if (storedCosts) {
      this.ingredientCosts = JSON.parse(storedCosts);
    }
  }

  private saveIngredientCosts(): void {
    localStorage.setItem('ingredientCosts', JSON.stringify(this.ingredientCosts));
  }
}

export const dataAccessService = new DataAccessService();