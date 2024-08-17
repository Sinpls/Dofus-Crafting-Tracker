import { useState, useCallback, useEffect, useRef } from 'react';
import { ICraftedItem, IIngredient, IIntermediateItem, IDofusItem } from '../types';
import { calculationService } from '../services/CalculationService';

export const useCalculation = () => {
  const [craftedItemList, setCraftedItemList] = useState<ICraftedItem[]>([]);
  const [ingredients, setIngredients] = useState<IIngredient[]>([]);
  const [intermediateItems, setIntermediateItems] = useState<IIntermediateItem[]>([]);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousCraftedItemListRef = useRef<ICraftedItem[]>([]);


  const updateStates = useCallback(() => {
    setIngredients(calculationService.getIngredients());
    setIntermediateItems(calculationService.getIntermediateItems());
  }, []);

  const calculateCosts = useCallback(async () => {
    console.log("Starting cost calculation...");
    try {
      const updatedCraftedItemList = await calculationService.calculateCraftedItemCosts(craftedItemList);
      setCraftedItemList(updatedCraftedItemList);
      updateStates();
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

  const hasCraftedItemListChanged = useCallback((prevList: ICraftedItem[], currentList: ICraftedItem[]) => {
    if (prevList.length !== currentList.length) return true;
    return prevList.some((prevItem, index) => {
      const currentItem = currentList[index];
      return prevItem.ankama_id !== currentItem.ankama_id ||
             prevItem.amount !== currentItem.amount ||
             prevItem.sellPrice !== currentItem.sellPrice;
    });
  }, []);

  useEffect(() => {
    if (hasCraftedItemListChanged(previousCraftedItemListRef.current, craftedItemList)) {
      debouncedCalculateCosts();
      previousCraftedItemListRef.current = craftedItemList;
    }
  }, [craftedItemList, debouncedCalculateCosts, hasCraftedItemListChanged]);

  const addCraftedItem = useCallback((item: IDofusItem) => {
    console.log("Adding item:", item);
    setCraftedItemList(prevList => {
      const existingItemIndex = prevList.findIndex(eq => eq.ankama_id === item.ankama_id);
      if (existingItemIndex !== -1) {
        return prevList.map((eq, index) =>
          index === existingItemIndex
            ? { ...eq, amount: eq.amount + 1 }
            : eq
        );
      } else {
        const newItem: ICraftedItem = {
          ankama_id: item.ankama_id,
          name: item.name,
          amount: 1,
          costPerUnit: 0,
          sellPrice: 0,
          profit: 0
        };
        return [...prevList, newItem];
      }
    });
  }, []);

  const removeCraftedItem = useCallback((ankama_id: number) => {
    console.log("Removing item:", ankama_id);
    setCraftedItemList(prevList => prevList.filter(item => item.ankama_id !== ankama_id));
  }, []);

  const updateCraftedItem = useCallback((ankama_id: number, field: 'amount' | 'sellPrice', value: number) => {
    console.log("Updating item:", ankama_id, field, value);
    setCraftedItemList(prevList => 
      prevList.map(item => 
        item.ankama_id === ankama_id ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const updateIngredientCost = useCallback((name: string, cost: number) => {
    calculationService.setUserCost(name, cost);
    updateStates();
    calculateCosts();
  }, [updateStates, calculateCosts]);

  const updateIntermediateItemCost = useCallback((name: string, cost: number) => {
    calculationService.setUserCost(name, cost);
    const updatedIntermediateItems = calculationService.getIntermediateItems();
    const updatedIngredients = calculationService.getIngredients();
    setIntermediateItems(updatedIntermediateItems);
    setIngredients(updatedIngredients);
    calculateCosts();
  }, [calculateCosts]);

  return {
    craftedItemList: craftedItemList || [],
    ingredients: ingredients || [],
    intermediateItems: intermediateItems || [],
    addCraftedItem,
    removeCraftedItem,
    updateCraftedItem,
    updateIngredientCost,
    updateIntermediateItemCost,
  };
};