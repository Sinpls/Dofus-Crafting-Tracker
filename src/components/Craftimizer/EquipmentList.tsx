import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table"
import { Input } from "../../../@/components/ui/input"
import { Button } from "../../../@/components/ui/button"
import { ICraftemItem } from '../../types';

interface EquipmentListProps {
  equipmentList: ICraftemItem[];
  updateEquipment: (ankama_id: number, field: 'amount' | 'sellPrice', value: number) => void;
  finalizeEquipmentUpdate: (ankama_id: number) => void;
  removeEquipment: (ankama_id: number) => void;
  pendingEquipmentUpdates: { [key: number]: Partial<ICraftemItem> };
}

const EquipmentList: React.FC<EquipmentListProps> = ({ 
  equipmentList, 
  updateEquipment, 
  finalizeEquipmentUpdate,
  removeEquipment,
  pendingEquipmentUpdates
}) => {
  const sortedEquipmentList = [...equipmentList].sort((a, b) => a.name.localeCompare(b.name));

  const handleChange = (ankama_id: number, field: 'amount' | 'sellPrice', value: string) => {
    const numericValue = value.replace(/^0+/, '');
    updateEquipment(ankama_id, field, numericValue === '' ? 0 : Number(numericValue));
  };

  const handleBlur = (ankama_id: number) => {
    finalizeEquipmentUpdate(ankama_id);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="p-2">
        <h2 className="text-xl font-bold">Equipment List</h2>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="rounded-md border border-border h-full">
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
              {sortedEquipmentList.map((item) => {
                const pendingUpdate = pendingEquipmentUpdates[item.ankama_id] || {};
                return (
                  <TableRow key={item.ankama_id} className={`border-b border-border hover:bg-muted/50 ${item.profit > 0 ? 'bg-green-900/20' : item.profit < 0 ? 'bg-red-900/20' : ''}`}>
                    <TableCell className="py-0.5 px-2">{item.name}</TableCell>
                    <TableCell className="py-0.5 px-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={pendingUpdate.amount !== undefined ? pendingUpdate.amount : item.amount}
                        onChange={(e) => handleChange(item.ankama_id, 'amount', e.target.value)}
                        onBlur={() => handleBlur(item.ankama_id)}
                        className="w-20 bg-background text-foreground h-6 px-1"
                      />
                    </TableCell>
                    <TableCell className="py-0.5 px-2">{item.costPerUnit.toLocaleString()}</TableCell>
                    <TableCell className="py-0.5 px-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={pendingUpdate.sellPrice !== undefined ? pendingUpdate.sellPrice : item.sellPrice}
                        onChange={(e) => handleChange(item.ankama_id, 'sellPrice', e.target.value)}
                        onBlur={() => handleBlur(item.ankama_id)}
                        className="w-24 bg-background text-foreground h-6 px-1"
                      />
                    </TableCell>
                    <TableCell className="py-0.5 px-2">{item.profit.toLocaleString()}</TableCell>
                    <TableCell className="py-0.5 px-2">
                      <Button 
                        onClick={() => removeEquipment(item.ankama_id)}
                        variant="destructive"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default EquipmentList;