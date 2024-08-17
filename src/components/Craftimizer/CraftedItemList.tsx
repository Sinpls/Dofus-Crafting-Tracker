import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table"
import { Input } from "../../../@/components/ui/input"
import { Button } from "../../../@/components/ui/button"
import { ICraftedItem } from '../../types';
import { db } from '../../services/DatabaseService';

interface CraftedItemListProps {
  craftedItemList: ICraftedItem[];
  updateCraftedItem: (ankama_id: number, field: 'amount' | 'sellPrice', value: number) => void;
  removeCrafedItem: (ankama_id: number) => void;
}

const CraftedItemList: React.FC<CraftedItemListProps> = ({ 
  craftedItemList: craftedItemList, 
  updateCraftedItem: updateCraftedItem, 
  removeCrafedItem: removeCraftedItem
}) => {
  const [localValues, setLocalValues] = useState<{ [key: string]: string }>({});

  const sortedCraftedItemList = [...craftedItemList].sort((a, b) => a.name.localeCompare(b.name));

  const handleChange = (ankama_id: number, field: 'amount' | 'sellPrice', value: string) => {
    setLocalValues(prev => ({
      ...prev,
      [`${ankama_id}-${field}`]: value
    }));
  };

  const handleBlur = (ankama_id: number, field: 'amount' | 'sellPrice') => {
    const value = localValues[`${ankama_id}-${field}`];
    if (value !== undefined) {
      const numericValue = value.replace(/^0+/, '');
      updateCraftedItem(ankama_id, field, numericValue === '' ? 0 : Number(numericValue));
    }
  };

  const handleExportToSalesTracker = async (item: ICraftedItem) => {
    try {
      await db.addSale({
        itemName: item.name,
        quantity: item.amount,
        costPrice: item.costPerUnit,
        sellPrice: item.sellPrice,
        addedDate: new Date(),
        sellDate: null,
        profit: (item.sellPrice - item.costPerUnit) * item.amount
      });
      console.log(`Exported ${item.name} to Sales Tracker`);
    } catch (error) {
      console.error('Failed to export to Sales Tracker:', error);
    }
  };
  return (
    <div className="flex flex-col h-full bg-background text-foreground ">
      <div className="flex-shrink-1 p-2">
        <h2 className="text-xl font-bold">Crafted Items</h2>
      </div>
      <div className="flex-grow overflow-auto rounded-md border border-border h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="border-b border-border">
                <TableHead className="text-muted-foreground py-1 px-2">Name</TableHead>
                <TableHead className="text-muted-foreground py-1 px-2">Amount</TableHead>
                <TableHead className="text-muted-foreground py-1 px-2">Cost per Unit</TableHead>
                <TableHead className="text-muted-foreground py-1 px-2">Sell Price</TableHead>
                <TableHead className="text-muted-foreground py-1 px-2">Profit</TableHead>
                <TableHead className="text-muted-foreground py-1 px-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCraftedItemList.map((item) => (
                <TableRow 
                  key={item.ankama_id} 
                  className={`border-b border-border hover:bg-muted/50 ${
                    item.profit > 0 ? 'bg-green-900/20' : item.profit < 0 ? 'bg-red-900/20' : ''
                  }`}
                >
                  <TableCell className="py-0.5 px-2">{item.name}</TableCell>
                  <TableCell className="py-0.5 px-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={localValues[`${item.ankama_id}-amount`] ?? item.amount}
                      onChange={(e) => handleChange(item.ankama_id, 'amount', e.target.value)}
                      onBlur={() => handleBlur(item.ankama_id, 'amount')}
                      className="w-20 bg-background text-foreground h-6 px-1"
                    />
                  </TableCell>
                  <TableCell className="py-0.5 px-2">{item.costPerUnit.toLocaleString()}</TableCell>
                  <TableCell className="py-0.5 px-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={localValues[`${item.ankama_id}-sellPrice`] ?? item.sellPrice}
                      onChange={(e) => handleChange(item.ankama_id, 'sellPrice', e.target.value)}
                      onBlur={() => handleBlur(item.ankama_id, 'sellPrice')}
                      className="w-24 bg-background text-foreground h-6 px-1"
                    />
                  </TableCell>
                  <TableCell className="py-0.5 px-2">{item.profit.toLocaleString()}</TableCell>
                  <TableCell className="py-0.5 px-2">
                    <Button 
                      onClick={() => removeCraftedItem(item.ankama_id)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                    <Button 
                      onClick={() => handleExportToSalesTracker(item)}
                      variant="outline"
                      size="sm"
                      className="ml-2"
                    >
                      Export to Sales
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
  );
};

export default CraftedItemList;