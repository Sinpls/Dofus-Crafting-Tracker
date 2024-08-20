import React, { useEffect } from 'react';
import CraftedItemList from './Craftimizer/CraftedItemList';
import IngredientList from './Craftimizer/IngredientList';
import IntermediateItemsList from './Craftimizer/IntermediateItemsList';
import SearchBar from './Craftimizer/SearchBar';
import { ICraftedItem, IIngredient, IIntermediateItem, IDofusItem } from '../types';

interface CraftimizerProps {
  craftedItemList: ICraftedItem[];
  ingredients: IIngredient[];
  intermediateItems: IIntermediateItem[];
  addCraftedItem: (item: IDofusItem) => void;
  removeCraftedItem: (ankama_id: number) => void;
  updateCraftedItem: (ankama_id: number, field: 'amount' | 'sellPrice', value: number) => void;
  updateIngredientCost: (name: string, cost: number) => void;
  updateIntermediateItemCost: (name: string, cost: number) => void;
}

const Craftimizer: React.FC<CraftimizerProps> = ({
  craftedItemList,
  ingredients,
  intermediateItems,
  addCraftedItem,
  removeCraftedItem,
  updateCraftedItem,
  updateIngredientCost,
  updateIntermediateItemCost,
}) => {
  useEffect(() => {
    console.log('Craftimizer received updated props:', {
      craftedItemList,
      ingredients,
      intermediateItems
    });
  }, [craftedItemList, ingredients, intermediateItems]);

  const handleSearchItemSelect = (item: IDofusItem) => {
    addCraftedItem(item);
  };

  const existingCraftedItem = craftedItemList.reduce((acc, item) => {
    acc[item.ankama_id] = item.amount;
    return acc;
  }, {} as { [key: number]: number });

  return (
    <div className="flex flex-col h-full space-y-0 overflow-hidden bg-background text-foreground">
      <div className="flex-shrink-0">
        <SearchBar onItemSelect={handleSearchItemSelect} existingCraftedItem={existingCraftedItem} />
      </div>
      <div className="flex flex-1 space-x-4 overflow-hidden">
        <div className="flex flex-col w-1/2 space-y-2 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CraftedItemList 
              craftedItemList={craftedItemList}
              updateCraftedItem={updateCraftedItem}
              removeCraftedItem={removeCraftedItem}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <IntermediateItemsList 
              intermediateItems={intermediateItems}
              updateIntermediateItemCost={updateIntermediateItemCost}
            />
          </div>
        </div>
        <div className="w-1/2 overflow-hidden">
          <IngredientList 
            ingredients={ingredients}
            updateIngredientCost={updateIngredientCost}
          />
        </div>
      </div>
    </div>
  );
};


export default Craftimizer;