import React, { useCallback, useEffect } from 'react';
import EquipmentList from './Craftimizer/EquipmentList';
import IngredientList from './Craftimizer/IngredientList';
import IntermediateItemsList from './Craftimizer/IntermediateItemsList';
import { useCalculation } from '../hooks/useCalculation';
import { DofusItem } from '../services/DataAccessService';

interface CraftimizerProps {
  selectedItem: DofusItem | null;
}

const Craftimizer: React.FC<CraftimizerProps> = ({ selectedItem }) => {
  const {
    equipmentList,
    intermediateItems,
    ingredients,
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
  } = useCalculation();

  const handleEquipmentUpdate = useCallback((ankama_id: number, field: 'amount' | 'sellPrice', value: number) => {
    updateEquipment(ankama_id, field, value);
  }, [updateEquipment]);

  const handleFinalizeEquipmentUpdate = useCallback((ankama_id: number) => {
    finalizeEquipmentUpdate(ankama_id);
  }, [finalizeEquipmentUpdate]);

  const handleRemoveEquipment = useCallback((ankama_id: number) => {
    removeEquipment(ankama_id);
  }, [removeEquipment]);

  useEffect(() => {
    if (selectedItem) {
      console.log("Selected item changed, adding to equipment:", selectedItem);
      addEquipment(selectedItem);
    }
  }, [selectedItem, addEquipment]);

  return (
    <div className="flex h-full space-x-4">
      {isCalculating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded text-black">Calculating...</div>
        </div>
      )}
      <div className="flex flex-col w-1/2 space-y-4 overflow-hidden">
        <div className="flex-1 overflow-hidden min-h-[200px]">
          <EquipmentList 
            equipmentList={equipmentList}
            updateEquipment={handleEquipmentUpdate}
            finalizeEquipmentUpdate={handleFinalizeEquipmentUpdate}
            removeEquipment={handleRemoveEquipment}
            pendingEquipmentUpdates={pendingEquipmentUpdates}
          />
        </div>
        <div className="flex-1 overflow-hidden min-h-[200px]">
          <IntermediateItemsList 
            intermediateItems={intermediateItems}
            updateIntermediateItemCost={updateIntermediateItemCost}
            finalizeCostUpdate={finalizeCostUpdate}
            pendingCostUpdates={pendingCostUpdates}
          />
        </div>
      </div>
      <div className="w-1/2 overflow-hidden">
        <IngredientList 
          ingredients={ingredients}
          updateIngredientCost={updateIngredientCost}
          finalizeCostUpdate={finalizeCostUpdate}
          pendingCostUpdates={pendingCostUpdates}
        />
      </div>
    </div>
  );
};

export default Craftimizer;