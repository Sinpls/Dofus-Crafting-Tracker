import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table"
import { Input } from "../../../@/components/ui/input"
import { IIntermediateItem } from '../../types';

interface IntermediateItemsListProps {
  intermediateItems: IIntermediateItem[];
  updateIntermediateItemCost: (name: string, cost: number) => void;
}

const IntermediateItemsList: React.FC<IntermediateItemsListProps> = ({ 
  intermediateItems, 
  updateIntermediateItemCost
}) => {
  const [localCosts, setLocalCosts] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    console.log("IntermediateItemsList received new items:", intermediateItems);
  }, [intermediateItems]);

  const sortedIntermediateItems = [...(intermediateItems || [])].sort((a, b) => a.level - b.level);

  const handleChange = (name: string, value: string) => {
    setLocalCosts(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name: string) => {
    const value = localCosts[name];
    if (value !== undefined) {
      const numericValue = value.replace(/^0+/, '');
      updateIntermediateItemCost(name, numericValue === '' ? 0 : Number(numericValue));
    }
  };

  if (!intermediateItems || intermediateItems.length === 0) {
    return <div>No intermediate items available</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex-shrink-1 p-2">
        <h2 className="text-xl font-bold">Intermediate Items</h2>
      </div>
      <div className="flex-grow overflow-auto rounded-md border border-border">
        <Table className="table-custom">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Cost</TableHead>
              <TableHead className="text-muted-foreground">Recipe Depth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIntermediateItems.map((item) => (
              <TableRow 
                key={item.name} 
                className={`hover:bg-muted/50 ${
                  item.isManuallyOverridden ? 'bg-yellow-500/20' : ''
                }`}
              >
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.amount}</TableCell>
                <TableCell>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={localCosts[item.name] ?? item.cost}
                    onChange={(e) => handleChange(item.name, e.target.value)}
                    onBlur={() => handleBlur(item.name)}
                    className="w-24 bg-background text-foreground border-input"
                  />
                </TableCell>
                <TableCell>{item.level}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IntermediateItemsList;