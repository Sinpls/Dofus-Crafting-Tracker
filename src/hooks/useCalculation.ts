import { useState, useCallback, useRef, useEffect } from 'react';
import { IDofusItem, IIngredient, IIntermediateItem, ICraftemItem } from '../types';
import { calculationService } from '../services/CalculationService';

export const useCalculation = () => {
  const [equipmentList, setEquipmentList] = useState<ICraftemItem[]>([]);
  const [ingredients, setIngredients] = useState<IIngredient[]>([]);
  const [intermediateItems, setIntermediateItems] = useState<IIntermediateItem[]>([]);
  const [pendingCostUpdates, setPendingCostUpdates] = useState<{ [key: string]: number }>({});
  const [pendingEquipmentUpdates, setPendingEquipmentUpdates] = useState<{ [key: number]: Partial<ICraftemItem> }>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousEquipmentListRef = useRef<ICraftemItem[]>([]);

  const [manuallyOverriddenItems, setManuallyOverriddenItems] = useState<Set<string>>(new Set());

  const calculateCosts = useCallback(async () => {
    if (isCalculating) return;
    setIsCalculating(true);
    try {
      const updatedEquipmentList = await calculationService.calculateEquipmentCosts(equipmentList);
      const { updatedIngredients, updatedIntermediateItems } = await calculationService.calculateIngredientsAndIntermediates(updatedEquipmentList);

      setEquipmentList(updatedEquipmentList);
      
      const preservedIngredients = updatedIngredients.map(ingredient => {
        const existingIngredient = ingredients.find(i => i.name === ingredient.name);
        if (manuallyOverriddenItems.has(ingredient.name) && ingredient.type === 'Intermediate') {
          return {
            ...ingredient,
            cost: existingIngredient?.cost || ingredient.cost,
            isManuallyOverridden: true
          };
        }
        return ingredient;
      });

      setIngredients(preservedIngredients);
      setIntermediateItems(updatedIntermediateItems);

      setPendingCostUpdates(prev => {
        const newPendingCosts = { ...prev };
        preservedIngredients.forEach(item => {
          if (manuallyOverriddenItems.has(item.name) && item.type === 'Intermediate') {
            newPendingCosts[item.name] = item.cost;
          }
        });
        return newPendingCosts;
      });
    } catch (error) {
      console.error("Error during calculation:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [equipmentList, isCalculating, ingredients, manuallyOverriddenItems]);

  const debouncedCalculateCosts = useCallback(() => {
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    calculationTimeoutRef.current = setTimeout(() => {
      calculateCosts();
    }, 500);
  }, [calculateCosts]);

  const addEquipment = useCallback((item: IDofusItem) => {
    setEquipmentList(prevList => {
      const existingItemIndex = prevList.findIndex(eq => eq.ankama_id === item.ankama_id);
      if (existingItemIndex !== -1) {
        return prevList.map((eq, index) =>
          index === existingItemIndex
            ? { ...eq, amount: eq.amount + 1 }
            : eq
        );
      } else {
        const newItem: ICraftemItem = {
          ...item,
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
    setEquipmentList(prevList => prevList.filter(item => item.ankama_id !== ankama_id));
  }, []);

  const updateEquipment = useCallback((ankama_id: number, field: 'amount' | 'sellPrice', value: number) => {
    setPendingEquipmentUpdates(prev => ({
      ...prev,
      [ankama_id]: { ...prev[ankama_id], [field]: value }
    }));
  }, []);

  const finalizeEquipmentUpdate = useCallback((ankama_id: number) => {
    setPendingEquipmentUpdates(prev => {
      const { [ankama_id]: pendingUpdate, ...rest } = prev;
      if (pendingUpdate) {
        setEquipmentList(prevList => {
          const updatedList = prevList.map(item =>
            item.ankama_id === ankama_id
              ? { ...item, ...pendingUpdate }
              : item
          ).filter(item => item.amount > 0);
          return updatedList;
        });
        // Trigger recalculation after updating equipment
        debouncedCalculateCosts();
      }
      return rest;
    });
  }, [debouncedCalculateCosts]);

  const updateIngredientCost = useCallback((name: string, cost: number) => {
    setPendingCostUpdates(prev => ({ ...prev, [name]: cost }));
  }, []);

  const updateIntermediateItemCost = useCallback((name: string, cost: number) => {
    setPendingCostUpdates(prev => ({ ...prev, [name]: cost }));
  }, []);

  const finalizeCostUpdate = useCallback((name: string) => {
    setPendingCostUpdates(prev => {
      const pendingCost = prev[name];
      if (pendingCost !== undefined) {
        const intermediateItem = intermediateItems.find(item => item.name === name);
        if (intermediateItem) {
          setManuallyOverriddenItems(prevSet => new Set(prevSet).add(name));
          setIngredients(prevIngredients => [
            ...prevIngredients,
            {
              name: intermediateItem.name,
              amount: intermediateItem.amount,
              cost: pendingCost,
              type: 'Intermediate',
              isManuallyOverridden: true
            }
          ]);
          setIntermediateItems(prevIntermediates => 
            prevIntermediates.filter(item => item.name !== name)
          );
        } else {
          setIngredients(prevIngredients => 
            prevIngredients.map(item => 
              item.name === name
                ? { ...item, cost: pendingCost, isManuallyOverridden: true }
                : item
            )
          );
        }
        
        calculationService.setUserCost(name, pendingCost);
        debouncedCalculateCosts();
        return prev;
      }
      return prev;
    });
  }, [intermediateItems, debouncedCalculateCosts]);


  const hasEquipmentListChanged = useCallback((prevList: ICraftemItem[], currentList: ICraftemItem[]) => {
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

  return {
    equipmentList,
    ingredients,
    intermediateItems,
    updateEquipment,
    finalizeEquipmentUpdate,
    addEquipment,
    removeEquipment,
    updateIngredientCost,
    updateIntermediateItemCost,
    finalizeCostUpdate,
    pendingCostUpdates,
    pendingEquipmentUpdates,
    isCalculating,
  };
};