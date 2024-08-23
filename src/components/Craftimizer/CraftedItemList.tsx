import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table"
import { Input } from "../../../@/components/ui/input"
import { Button } from "../../../@/components/ui/button"
import { ICraftedItem } from '../../types';
import { db } from '../../services/DatabaseService';
import { copyToClipboard } from '../../utils/clipboard';

interface CraftedItemListProps {
  craftedItemList: ICraftedItem[];
  updateCraftedItem: (ankama_id: number, field: 'amount' | 'sellPrice', value: number) => void;
  removeCraftedItem: (ankama_id: number) => void;
}

const CraftedItemList: React.FC<CraftedItemListProps> = ({ 
  craftedItemList, 
  updateCraftedItem, 
  removeCraftedItem 
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

  const handleExportAllToSalesTracker = async () => {
    try {
      for (const item of craftedItemList) {
        await db.addSale({
          itemName: item.name,
          quantity: item.amount,
          costPrice: item.costPerUnit,
          sellPrice: item.sellPrice,
          addedDate: new Date(),
          sellDate: null,
          profit: (item.sellPrice - item.costPerUnit) * item.amount
        });
      }
      console.log(`Exported all items to Sales Tracker`);
    } catch (error) {
      console.error('Failed to export to Sales Tracker:', error);
    }
  };

  const handleItemClick = (itemName: string) => {
    copyToClipboard(itemName);
  };

  const totals = useMemo(() => {
    return craftedItemList.reduce((acc, item) => {
      acc.totalCost += item.costPerUnit * item.amount;
      acc.totalProfit += item.profit;
      return acc;
    }, { totalCost: 0, totalProfit: 0 });
  }, [craftedItemList]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex-shrink-0 p-2 flex justify-between items-center">
        <h2 className="text-xl font-bold">Crafted Items</h2>
        <Button 
          onClick={handleExportAllToSalesTracker}
          variant="outline"
          size="sm"
          className="bg-secondary text-secondary-foreground"
        >
          Export All
        </Button>
      </div>
      <div className="flex-grow overflow-auto rounded-md border border-border">
        <Table className="table-custom">
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Cost per Unit</TableHead>
              <TableHead className="text-muted-foreground">Sell Price</TableHead>
              <TableHead className="text-muted-foreground">Profit</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCraftedItemList.map((item) => (
              <TableRow 
                key={item.ankama_id} 
                className={`hover:bg-muted/50 ${
                  item.profit > 0 ? 'bg-green-900/20' : item.profit < 0 ? 'bg-red-900/20' : ''
                }`}
              >
                <TableCell 
                  onClick={() => handleItemClick(item.name)}
                  className="cursor-pointer hover:underline"
                >
                  {item.name}
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={localValues[`${item.ankama_id}-amount`] ?? item.amount}
                    onChange={(e) => handleChange(item.ankama_id, 'amount', e.target.value)}
                    onBlur={() => handleBlur(item.ankama_id, 'amount')}
                    className="table-input w-20"
                  />
                </TableCell>
                <TableCell>{item.costPerUnit.toLocaleString()}</TableCell>
                <TableCell>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={localValues[`${item.ankama_id}-sellPrice`] ?? item.sellPrice}
                    onChange={(e) => handleChange(item.ankama_id, 'sellPrice', e.target.value)}
                    onBlur={() => handleBlur(item.ankama_id, 'sellPrice')}
                    className="table-input w-24"
                  />
                </TableCell>
                <TableCell>{item.profit.toLocaleString()}</TableCell>
                <TableCell>
                  <Button 
                    onClick={() => removeCraftedItem(item.ankama_id)}
                    className="btn-remove"
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold">
              <TableCell>Totals</TableCell>
              <TableCell></TableCell>
              <TableCell>{totals.totalCost.toLocaleString()}</TableCell>
              <TableCell></TableCell>
              <TableCell>{totals.totalProfit.toLocaleString()}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CraftedItemList;