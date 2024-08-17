// Craftimizer.tsx

import React, { useEffect } from 'react';
import CraftedItemList from './Craftimizer/CraftedItemList';
import IngredientList from './Craftimizer/IngredientList';
import IntermediateItemsList from './Craftimizer/IntermediateItemsList';
import { useCalculation } from '../hooks/useCalculation';
import { IDofusItem } from '../types';

interface CraftimizerProps {
  selectedItem: IDofusItem | null;
}

const Craftimizer: React.FC<CraftimizerProps> = ({ selectedItem }) => {
  const {
    equipmentList,
    intermediateItems,
    ingredients,
    addEquipment,
    removeEquipment,
    updateEquipment,
    updateIngredientCost,
    updateIntermediateItemCost,
  } = useCalculation();

  useEffect(() => {
    if (selectedItem) {
      addEquipment(selectedItem);
    }
  }, [selectedItem, addEquipment]);

  console.log("Craftimizer rendering:", {
    equipmentListLength: equipmentList.length,
    intermediateItemsLength: intermediateItems.length,
    ingredientsLength: ingredients.length
  });

  if (!equipmentList || !intermediateItems || !ingredients) {
    console.error("One or more lists are undefined");
    return <div>Error: Data is not available</div>;
  }

  return (
    <div className="flex h-full space-x-4 overflow-hidden p-4">
      <div className="flex flex-col w-1/2 space-y-4 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <CraftedItemList 
            equipmentList={equipmentList}
            updateEquipment={updateEquipment}
            removeEquipment={removeEquipment}
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
  );
};

export default Craftimizer;