import { useState, useCallback, useEffect, useRef } from 'react';
import { ICraftedItem, IIngredient, IIntermediateItem, IDofusItem } from '../types';
import { calculationService } from '../services/CalculationService';
import { dataAccessService } from '../services/DataAccessService';

export const useCalculation = () => {
  const [craftedItemList, setCraftedItemList] = useState<ICraftedItem[]>([]);
  const [ingredients, setIngredients] = useState<IIngredient[]>([]);
  const [intermediateItems, setIntermediateItems] = useState<IIntermediateItem[]>([]);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCalculationNeededRef = useRef(false);

  const updateStates = useCallback(() => {
    setIngredients(calculationService.getIngredients());
    setIntermediateItems(calculationService.getIntermediateItems());
  }, []);

  const calculateCosts = useCallback(async () => {
    if (!isCalculationNeededRef.current) return;

    console.log("Starting cost calculation...");
    try {
      const updatedCraftedItemList = await calculationService.calculateCraftedItemCosts(craftedItemList);
      setCraftedItemList(updatedCraftedItemList);
      updateStates();
      isCalculationNeededRef.current = false;
    } catch (error) {
      console.error("Error during calculation:", error);
    }
  }, [craftedItemList, updateStates]);

  const debouncedCalculateCosts = useCallback(() => {
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    calculationTimeoutRef.current = setTimeout(() => {
      calculateCosts();
    }, 300);
  }, [calculateCosts]);

  useEffect(() => {
    if (isCalculationNeededRef.current) {
      debouncedCalculateCosts();
    }
  }, [craftedItemList, debouncedCalculateCosts]);

  const addCraftedItem = useCallback(async (item: IDofusItem | { name: string, ankama_id?: number }) => {
    console.log("Adding item:", item);
    let ankamaId = item.ankama_id;
    
    if (!ankamaId) {
      const searchResults = await dataAccessService.searchItems(item.name);
      const matchedItem = searchResults.find(result => result.name.toLowerCase() === item.name.toLowerCase());
      if (matchedItem) {
        ankamaId = matchedItem.ankama_id;
      } else {
        console.error(`Item not found: ${item.name}`);
        return;
      }
    }

    setCraftedItemList(prevList => {
      const existingItemIndex = prevList.findIndex(eq => eq.ankama_id === ankamaId);
      if (existingItemIndex !== -1) {
        return prevList.map((eq, index) =>
          index === existingItemIndex
            ? { ...eq, amount: eq.amount + 1 }
            : eq
        );
      } else {
        const newItem: ICraftedItem = {
          ankama_id: ankamaId!,
          name: item.name,
          amount: 1,
          costPerUnit: 0,
          sellPrice: 0,
          profit: 0
        };
        return [...prevList, newItem];
      }
    });
    isCalculationNeededRef.current = true;
  }, []);

  const removeCraftedItem = useCallback((ankama_id: number) => {
    console.log("Removing item:", ankama_id);
    setCraftedItemList(prevList => prevList.filter(item => item.ankama_id !== ankama_id));
    isCalculationNeededRef.current = true;
  }, []);

  const updateCraftedItem = useCallback((ankama_id: number, field: 'amount' | 'sellPrice', value: number) => {
    console.log("Updating item:", ankama_id, field, value);
    setCraftedItemList(prevList => 
      prevList.map(item => 
        item.ankama_id === ankama_id ? { ...item, [field]: value } : item
      )
    );
    isCalculationNeededRef.current = true;
  }, []);

  const updateIngredientCost = useCallback((name: string, cost: number) => {
    calculationService.setUserCost(name, cost);
    updateStates();
    isCalculationNeededRef.current = true;
    debouncedCalculateCosts();
  }, [updateStates, debouncedCalculateCosts]);

  const updateIntermediateItemCost = useCallback((name: string, cost: number) => {
    calculationService.setUserCost(name, cost);
    updateStates();
    isCalculationNeededRef.current = true;
    debouncedCalculateCosts();
  }, [updateStates, debouncedCalculateCosts]);

  return {
    craftedItemList,
    ingredients,
    intermediateItems,
    addCraftedItem,
    removeCraftedItem,
    updateCraftedItem,
    updateIngredientCost,
    updateIntermediateItemCost,
  };
};