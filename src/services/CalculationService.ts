import { dataAccessService } from './DataAccessService';
import { IIngredient } from '../types';

export interface EquipmentItem {
  ankama_id: number;
  name: string;
  amount: number;
  costPerUnit: number;
  sellPrice: number;
  profit: number;
}

export interface IntermediateItem {
  name: string;
  amount: number;
  cost: number;
  level: number;
}

class CalculationService {
  private userSetCosts: { [key: string]: number } = {};
  private intermediateItems: { [key: string]: IntermediateItem } = {};
  private totalAmounts: { [key: string]: number } = {};
  private calculatedCosts: { [key: string]: number } = {};
  private originalIntermediateItems: { [key: string]: IntermediateItem } = {};
  private calculationDepth: number = 0;
  private maxCalculationDepth: number = 50; // Adjust this value as needed

  async calculateItemCost(itemDetails: any, amount: number, level: number = 1): Promise<number> {
    if (this.calculationDepth >= this.maxCalculationDepth) {
      console.warn(`Max calculation depth reached for item: ${itemDetails.name}`);
      return 0; // or return a default cost
    }

    this.calculationDepth++;

    const itemName = itemDetails.name;
    if (this.userSetCosts[itemName]) {
      this.calculationDepth--;
      return this.userSetCosts[itemName] * amount;
    }

    if (this.calculatedCosts[itemName]) {
      this.calculationDepth--;
      return this.calculatedCosts[itemName] * amount;
    }

    let totalCost = 0;
    if (itemDetails.recipe && itemDetails.recipe.length > 0) {
      const ingredients = this.processRecipe(itemDetails.recipe, amount);
      for (const ingredient of ingredients) {
        const ingredientDetails = await dataAccessService.getItemDetails(ingredient.ankama_id);
        if (ingredientDetails) {
          const ingredientName = ingredientDetails.name;
          const ingredientAmount = ingredient.amount;

          this.totalAmounts[ingredientName] = (this.totalAmounts[ingredientName] || 0) + ingredientAmount;

          const subCost = await this.calculateItemCost(ingredientDetails, ingredientAmount, level + 1);
          totalCost += subCost;

          if (!this.userSetCosts[ingredientName] && ingredientDetails.recipe && ingredientDetails.recipe.length > 0) {
            if (!this.intermediateItems[ingredientName]) {
              const intermediateItem = {
                name: ingredientName,
                amount: ingredientAmount,
                cost: subCost / ingredientAmount,
                level: level + 1
              };
              this.intermediateItems[ingredientName] = intermediateItem;
              this.originalIntermediateItems[ingredientName] = { ...intermediateItem };
            } else {
              this.intermediateItems[ingredientName].amount += ingredientAmount;
              this.intermediateItems[ingredientName].cost = (this.intermediateItems[ingredientName].cost * (this.intermediateItems[ingredientName].amount - ingredientAmount) + subCost) / this.intermediateItems[ingredientName].amount;
            }
          }
        }
      }
    }

    this.calculatedCosts[itemName] = totalCost / amount;
    this.calculationDepth--;
    return totalCost;
  }

  processRecipe(recipe: any[], amount: number = 1): any[] {
    return recipe.map(item => ({
      ankama_id: item.item_ankama_id,
      amount: item.quantity * amount,
      type: item.item_subtype
    }));
  }

  async calculateEquipmentCosts(equipmentList: EquipmentItem[]): Promise<EquipmentItem[]> {
    this.clearCalculations();
    const updatedList: EquipmentItem[] = [];

    for (const item of equipmentList) {
      const itemDetails = await dataAccessService.getItemDetails(item.ankama_id);
      if (itemDetails) {
        this.calculationDepth = 0; // Reset depth for each equipment item
        const costPerUnit = await this.calculateItemCost(itemDetails, item.amount);
        const totalCost = costPerUnit;
        const totalSell = item.sellPrice * item.amount;
        const profit = totalSell - totalCost;

        updatedList.push({
          ...item,
          costPerUnit: Math.round(costPerUnit / item.amount),
          profit: Math.round(profit)
        });
      }
    }

    return updatedList;
  }

  async calculateIngredientsAndIntermediates(equipmentList: EquipmentItem[]): Promise<{
    updatedIngredients: IIngredient[],
    updatedIntermediateItems: IntermediateItem[]
  }> {
    this.clearCalculations();
    for (const item of equipmentList) {
      const itemDetails = await dataAccessService.getItemDetails(item.ankama_id);
      if (itemDetails) {
        await this.calculateItemCost(itemDetails, item.amount);
      }
    }
    return {
      updatedIngredients: this.getIngredients(),
      updatedIntermediateItems: this.getIntermediateItems()
    };
  }

  getIntermediateItems(): IntermediateItem[] {
    return Object.values(this.intermediateItems).filter(item => !this.userSetCosts[item.name]);
  }

  getIngredients(): IIngredient[] {
    return Object.entries(this.totalAmounts)
      .filter(([name]) => !this.intermediateItems[name] || this.userSetCosts[name])
      .map(([name, amount]) => ({
        name,
        amount,
        cost: this.userSetCosts[name] || this.calculatedCosts[name] || 0,
        type: this.intermediateItems[name] ? 'Intermediate' : 'Resource'
      }));
  }

  setUserCost(itemName: string, cost: number): void {
    if (cost === 0 && this.originalIntermediateItems[itemName]) {
      delete this.userSetCosts[itemName];
      this.intermediateItems[itemName] = { ...this.originalIntermediateItems[itemName] };
    } else {
      this.userSetCosts[itemName] = cost;
      if (this.intermediateItems[itemName]) {
        delete this.intermediateItems[itemName];
      }
    }
    delete this.calculatedCosts[itemName];
  }

  clearCalculations(): void {
    this.intermediateItems = {};
    this.totalAmounts = {};
    this.calculatedCosts = {};
    this.originalIntermediateItems = {};
    this.calculationDepth = 0;
  }
}

export const calculationService = new CalculationService();