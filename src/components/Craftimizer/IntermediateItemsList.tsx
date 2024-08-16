import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table"
import { Input } from "../../../@/components/ui/input"
import { IntermediateItem } from '../../services/CalculationService';

export interface IntermediateItemsListProps {
  intermediateItems: IntermediateItem[];
  updateIntermediateItemCost: (name: string, cost: number) => void;
  finalizeCostUpdate: (name: string) => void;
  pendingCostUpdates: { [key: string]: number };
}

const IntermediateItemsList: React.FC<IntermediateItemsListProps> = ({ 
  intermediateItems, 
  updateIntermediateItemCost, 
  finalizeCostUpdate,
  pendingCostUpdates
}) => {
  const [localCosts, setLocalCosts] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Update localCosts when pendingCostUpdates changes
    setLocalCosts(prev => {
      const newLocalCosts = { ...prev };
      Object.entries(pendingCostUpdates).forEach(([name, cost]) => {
        if (!newLocalCosts[name] || newLocalCosts[name] === '') {
          newLocalCosts[name] = cost.toString();
        }
      });
      return newLocalCosts;
    });
  }, [pendingCostUpdates]);

  const sortedIntermediateItems = [...intermediateItems].sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    return a.name.localeCompare(b.name);
  });

  const handleChange = (name: string, value: string) => {
    setLocalCosts(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name: string) => {
    const value = localCosts[name] || '';
    const numericValue = value.replace(/^0+/, '');
    const finalValue = numericValue === '' ? 0 : Number(numericValue);
    updateIntermediateItemCost(name, finalValue);
    finalizeCostUpdate(name);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="p-2">
        <h2 className="text-xl font-bold">Intermediate Items</h2>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="rounded-md border border-border h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="border-b border-border">
                <TableHead className="text-muted-foreground py-1 px-2">Name</TableHead>
                <TableHead className="text-muted-foreground py-1 px-2">Amount</TableHead>
                <TableHead className="text-muted-foreground py-1 px-2">Cost</TableHead>
                <TableHead className="text-muted-foreground py-1 px-2">Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIntermediateItems.map((item) => (
                <TableRow key={item.name} className="border-b border-border hover:bg-muted/50">
                  <TableCell className="py-0.5 px-2">{item.name}</TableCell>
                  <TableCell className="py-0.5 px-2">{item.amount}</TableCell>
                  <TableCell className="py-0.5 px-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={localCosts[item.name] ?? pendingCostUpdates[item.name]?.toString() ?? item.cost.toString()}
                      onChange={(e) => handleChange(item.name, e.target.value)}
                      onBlur={() => handleBlur(item.name)}
                      className="w-24 bg-background text-foreground h-6 px-1"
                    />
                  </TableCell>
                  <TableCell className="py-0.5 px-2">{item.level}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default IntermediateItemsList;