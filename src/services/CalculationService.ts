// CalculationService.ts

import { dataAccessService } from './DataAccessService';
import { ICraftedItem, IIngredient, IIntermediateItem, IDofusItem } from '../types';

class CalculationService {
  private userSetCosts: { [key: string]: number } = {};
  private calculatedCosts: { [key: string]: number } = {};
  private intermediateItems: { [key: string]: IIntermediateItem } = {};
  private ingredients: { [key: string]: IIngredient } = {};
  private itemRecipes: { [key: string]: IDofusItem['recipe'] } = {};

  async calculateItemCost(item: IDofusItem, amount: number, depth: number = 0): Promise<number> {
    const itemName = item.name;

    if (this.userSetCosts[itemName] !== undefined) {
      return this.userSetCosts[itemName] * amount;
    }

    if (this.calculatedCosts[itemName] !== undefined) {
      return this.calculatedCosts[itemName] * amount;
    }

    let totalCost = 0;
    if (item.recipe && item.recipe.length > 0) {
      this.itemRecipes[itemName] = item.recipe;
      for (const ingredient of item.recipe) {
        const ingredientDetails = await dataAccessService.getItemDetails(ingredient.item_ankama_id);
        if (ingredientDetails) {
          const ingredientCost = await this.calculateItemCost(ingredientDetails, ingredient.quantity * amount, depth + 1);
          totalCost += ingredientCost;

          this.updateIngredientOrIntermediate(ingredientDetails, ingredient.quantity * amount, ingredientCost, depth + 1);
        }
      }
    } else {
      totalCost = (this.userSetCosts[itemName] || 0) * amount;
    }

    const costPerUnit = totalCost / amount;
    this.calculatedCosts[itemName] = costPerUnit;
    return totalCost;
  }

  private updateIngredientOrIntermediate(item: IDofusItem, amount: number, cost: number, depth: number) {
    const itemName = item.name;
    if (item.recipe && item.recipe.length > 0) {
      // It's an intermediate item
      if (!this.intermediateItems[itemName]) {
        this.intermediateItems[itemName] = {
          name: itemName,
          amount: amount,
          cost: this.userSetCosts[itemName] !== undefined ? this.userSetCosts[itemName] : cost / amount,
          level: depth,
          isManuallyOverridden: this.userSetCosts[itemName] !== undefined
        };
      } else {
        const existingItem = this.intermediateItems[itemName];
        if (!existingItem.isManuallyOverridden) {
          existingItem.amount += amount;
          existingItem.cost = (existingItem.cost * existingItem.amount + cost) / (existingItem.amount + amount);
        }
        existingItem.level = Math.max(existingItem.level, depth);
      }
    } else {
      // It's a base ingredient
      if (!this.ingredients[itemName]) {
        this.ingredients[itemName] = {
          name: itemName,
          amount: amount,
          cost: this.userSetCosts[itemName] !== undefined ? this.userSetCosts[itemName] : cost / amount,
          type: item.type.name,
          isManuallyOverridden: this.userSetCosts[itemName] !== undefined
        };
      } else {
        const existingIngredient = this.ingredients[itemName];
        if (!existingIngredient.isManuallyOverridden) {
          existingIngredient.amount += amount;
          existingIngredient.cost = (existingIngredient.cost * existingIngredient.amount + cost) / (existingIngredient.amount + amount);
        }
      }
    }
  }

  setUserCost(itemName: string, cost: number): void {
    
    if (this.intermediateItems[itemName]) {
      const intermediateItem = this.intermediateItems[itemName];
      
      if (cost !== 0) {
        this.userSetCosts[itemName] = cost;
        intermediateItem.cost = cost;
        intermediateItem.isManuallyOverridden = true;
        this.removeUnusedIngredients(itemName);
      } else {
        delete this.userSetCosts[itemName];
        intermediateItem.isManuallyOverridden = false;
        this.recalculateIntermediateItemCost(itemName);
        this.restoreRecipeIngredients(itemName);
      }

    } else if (this.ingredients[itemName]) {
      this.ingredients[itemName].cost = cost;
      this.ingredients[itemName].isManuallyOverridden = cost !== 0;
      if (cost !== 0) {
        this.userSetCosts[itemName] = cost;
      } else {
        delete this.userSetCosts[itemName];
      }
    }

    delete this.calculatedCosts[itemName];
  }

  private recalculateIntermediateItemCost(itemName: string): void {
    const recipe = this.itemRecipes[itemName];
    if (recipe) {
      let totalCost = 0;
      for (const ingredient of recipe) {
        const ingredientCost = this.getIngredientCost(ingredient.name);
        totalCost += ingredientCost * ingredient.quantity;
      }
      this.intermediateItems[itemName].cost = totalCost / this.intermediateItems[itemName].amount;
    }
  }
  private getIngredientCost(ingredientName: string): number {
    if (this.userSetCosts[ingredientName] !== undefined) {
      return this.userSetCosts[ingredientName];
    }
    if (this.ingredients[ingredientName]) {
      return this.ingredients[ingredientName].cost;
    }
    if (this.intermediateItems[ingredientName]) {
      return this.intermediateItems[ingredientName].cost;
    }
    return 0;
  }
  private removeUnusedIngredients(intermediateItemName: string): void {
    const recipe = this.itemRecipes[intermediateItemName];
    if (recipe) {
      for (const ingredient of recipe) {
        const ingredientName = ingredient.name;
        if (this.ingredients[ingredientName]) {
          this.ingredients[ingredientName].amount -= ingredient.quantity;
          if (this.ingredients[ingredientName].amount <= 0) {
            delete this.ingredients[ingredientName];
          }
        }
      }
    }
  }

  private restoreRecipeIngredients(intermediateItemName: string): void {
    const recipe = this.itemRecipes[intermediateItemName];
    if (recipe) {
      for (const ingredient of recipe) {
        const ingredientName = ingredient.name;
        if (this.ingredients[ingredientName]) {
          this.ingredients[ingredientName].amount += ingredient.quantity;
        } else {
          this.ingredients[ingredientName] = {
            name: ingredientName,
            amount: ingredient.quantity,
            cost: 0,
            type: 'Resource', // Default to Resource, update if needed
            isManuallyOverridden: false
          };
        }
      }
    }
  }

  async calculateCraftedItemCosts(craftedItemList: ICraftedItem[]): Promise<ICraftedItem[]> {
    this.clearCalculations();
    const updatedList: ICraftedItem[] = [];

    for (const item of craftedItemList) {
      const itemDetails = await dataAccessService.getItemDetails(item.ankama_id);
      if (itemDetails) {
        const totalCost = await this.calculateItemCost(itemDetails, item.amount);
        const costPerUnit = totalCost / item.amount;
        const totalSell = item.sellPrice * item.amount;
        const profit = totalSell - totalCost;

        updatedList.push({
          ...item,
          costPerUnit: Math.round(costPerUnit),
          profit: Math.round(profit)
        });
        console.log(`Updated ${itemDetails.name}: costPerUnit=${costPerUnit}, profit=${profit}`);
      }
    }

    console.log("Final ingredients:", this.ingredients);
    console.log("Final intermediate items:", this.intermediateItems);
    return updatedList;
  }

  getIntermediateItems(): IIntermediateItem[] {
    const items = Object.values(this.intermediateItems);
    return items.sort((a, b) => a.level - b.level);  // Sort by level in descending order
  }

  getIngredients(): IIngredient[] {
    return Object.values(this.ingredients);
  }

  clearCalculations(): void {
    this.calculatedCosts = {};
    this.intermediateItems = {};
    this.ingredients = {};
    // Note: We don't clear userSetCosts as these should persist
  }
}

export const calculationService = new CalculationService();