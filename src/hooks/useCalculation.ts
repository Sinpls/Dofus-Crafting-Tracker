import { useState, useCallback, useEffect, useRef } from 'react';
import { ICraftedItem, IIngredient, IIntermediateItem, IDofusItem } from '../types';
import { calculationService } from '../services/CalculationService';

export const useCalculation = () => {
  const [equipmentList, setEquipmentList] = useState<ICraftedItem[]>([]);
  const [ingredients, setIngredients] = useState<IIngredient[]>([]);
  const [intermediateItems, setIntermediateItems] = useState<IIntermediateItem[]>([]);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousEquipmentListRef = useRef<ICraftedItem[]>([]);


  const updateStates = useCallback(() => {
    setIngredients(calculationService.getIngredients());
    setIntermediateItems(calculationService.getIntermediateItems());
  }, []);

  const calculateCosts = useCallback(async () => {
    console.log("Starting cost calculation...");
    try {
      const updatedEquipmentList = await calculationService.calculateEquipmentCosts(equipmentList);
      setEquipmentList(updatedEquipmentList);
      updateStates();
    } catch (error) {
      console.error("Error during calculation:", error);
    }
  }, [equipmentList, updateStates]);
  const debouncedCalculateCosts = useCallback(() => {
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    calculationTimeoutRef.current = setTimeout(() => {
      calculateCosts();
    }, 300);
  }, [calculateCosts]);

  const hasEquipmentListChanged = useCallback((prevList: ICraftedItem[], currentList: ICraftedItem[]) => {
    if (prevList.length !== currentList.length) return true;
    return prevList.some((prevItem, index) => {
      const currentItem = currentList[index];
      return prevItem.ankama_id !== currentItem.ankama_id ||
             prevItem.amount !== currentItem.amount ||
             prevItem.sellPrice !== currentItem.sellPrice;
    });
  }, []);

  useEffect(() => {
    if (hasEquipmentListChanged(previousEquipmentListRef.current, equipmentList)) {
      debouncedCalculateCosts();
      previousEquipmentListRef.current = equipmentList;
    }
  }, [equipmentList, debouncedCalculateCosts, hasEquipmentListChanged]);

  const addEquipment = useCallback((item: IDofusItem) => {
    console.log("Adding equipment:", item);
    setEquipmentList(prevList => {
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

  const removeEquipment = useCallback((ankama_id: number) => {
    console.log("Removing equipment:", ankama_id);
    setEquipmentList(prevList => prevList.filter(item => item.ankama_id !== ankama_id));
  }, []);

  const updateEquipment = useCallback((ankama_id: number, field: 'amount' | 'sellPrice', value: number) => {
    console.log("Updating equipment:", ankama_id, field, value);
    setEquipmentList(prevList => 
      prevList.map(item => 
        item.ankama_id === ankama_id ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const updateIngredientCost = useCallback((name: string, cost: number) => {
    console.log("Updating ingredient cost:", name, cost);
    calculationService.setUserCost(name, cost);
    updateStates();
    calculateCosts();
  }, [updateStates, calculateCosts]);

  const updateIntermediateItemCost = useCallback((name: string, cost: number) => {
    console.log("Updating intermediate item cost:", name, cost);
    calculationService.setUserCost(name, cost);
    const updatedIntermediateItems = calculationService.getIntermediateItems();
    const updatedIngredients = calculationService.getIngredients();
    console.log("Updated intermediate items:", updatedIntermediateItems);
    console.log("Updated ingredients:", updatedIngredients);
    setIntermediateItems(updatedIntermediateItems);
    setIngredients(updatedIngredients);
    calculateCosts();
  }, [calculateCosts]);

  return {
    equipmentList: equipmentList || [],
    ingredients: ingredients || [],
    intermediateItems: intermediateItems || [],
    addEquipment,
    removeEquipment,
    updateEquipment,
    updateIngredientCost,
    updateIntermediateItemCost,
  };
};