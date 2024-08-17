import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../@/components/ui/table";
import { Input } from "../../@/components/ui/input";
import { Button } from "../../@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../@/components/ui/dropdown-menu";
import { ISale } from '../types';
import { db } from '../services/DatabaseService';
import { useCalculation } from '../hooks/useCalculation';

const SalesTracker: React.FC = () => {
  const [sales, setSales] = useState<ISale[]>([]);
  const [localValues, setLocalValues] = useState<{ [key: string]: string }>({});
  const { addEquipment } = useCalculation();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const loadedSales = await db.getSales();
    setSales(loadedSales);
  };

  const handleChange = (id: number, field: keyof ISale, value: string) => {
    setLocalValues(prev => ({
      ...prev,
      [`${id}-${field}`]: value
    }));
  };

  const handleBlur = async (id: number, field: keyof ISale) => {
    const value = localValues[`${id}-${field}`];
    if (value !== undefined) {
      let updatedValue: number | Date | null = null;
      if (field === 'sellDate') {
        updatedValue = value ? new Date(value) : null;
      } else if (field !== 'itemName' && field !== 'addedDate') {
        updatedValue = Number(value);
      }
      await db.updateSale(id, { [field]: updatedValue });
      loadSales();
    }
  };

  const handleDelete = async (id: number) => {
    await db.deleteSale(id);
    loadSales();
  };

  const handleDuplicate = async (sale: ISale) => {
    const { id, ...saleWithoutId } = sale;
    await db.addSale({
      ...saleWithoutId,
      addedDate: new Date() // Set new added date for the duplicate
    });
    loadSales();
  };

  const handleAddToCraftimizer = (itemName: string) => {
    addEquipment({ name: itemName, ankama_id: 0, level: 0, type: { name: '', id: 0 } });
  };

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden p-4">
      <div className="flex-shrink-0 mb-4">
        <h2 className="text-xl font-bold">Sales Tracker</h2>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Sell Price</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Sell Date</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.itemName}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={localValues[`${sale.id}-quantity`] ?? sale.quantity}
                    onChange={(e) => handleChange(sale.id!, 'quantity', e.target.value)}
                    onBlur={() => handleBlur(sale.id!, 'quantity')}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={localValues[`${sale.id}-costPrice`] ?? sale.costPrice}
                    onChange={(e) => handleChange(sale.id!, 'costPrice', e.target.value)}
                    onBlur={() => handleBlur(sale.id!, 'costPrice')}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={localValues[`${sale.id}-sellPrice`] ?? sale.sellPrice}
                    onChange={(e) => handleChange(sale.id!, 'sellPrice', e.target.value)}
                    onBlur={() => handleBlur(sale.id!, 'sellPrice')}
                  />
                </TableCell>
                <TableCell>{formatDate(sale.addedDate)}</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={localValues[`${sale.id}-sellDate`] ?? (sale.sellDate ? new Date(sale.sellDate).toISOString().split('T')[0] : '')}
                    onChange={(e) => handleChange(sale.id!, 'sellDate', e.target.value)}
                    onBlur={() => handleBlur(sale.id!, 'sellDate')}
                  />
                </TableCell>
                <TableCell>{sale.profit.toFixed(0)}</TableCell>
                <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="relative">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="z-50 bg-background">
                        <DropdownMenuItem onClick={() => handleAddToCraftimizer(sale.itemName)}>
                          Add to Craftimizer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(sale)}>
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(sale.id!)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default SalesTracker;