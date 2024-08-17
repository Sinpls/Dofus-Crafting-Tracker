import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../@/components/ui/table";
import { Input } from "../../@/components/ui/input";
import { Button } from "../../@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../@/components/ui/dropdown-menu";
import { ISale, IDofusItem } from '../types';
import { db } from '../services/DatabaseService';

interface SalesTrackerProps {
  addCraftedItem: (item: IDofusItem | { name: string; ankama_id?: number }) => Promise<void>;
}

const SalesTracker: React.FC<SalesTrackerProps> = ({ addCraftedItem }) => {
  const [sales, setSales] = useState<ISale[]>([]);
  const [localValues, setLocalValues] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSold, setFilterSold] = useState<boolean | null>(null);

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
      addedDate: new Date()
    });
    loadSales();
  };

  const handleAddToCraftimizer = (itemName: string) => {
    addCraftedItem({ name: itemName });
  };

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
  };

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = sale.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSoldFilter = filterSold === null || 
        (filterSold && sale.sellDate !== null) || 
        (!filterSold && sale.sellDate === null);
      return matchesSearch && matchesSoldFilter;
    });
  }, [sales, searchTerm, filterSold]);

  const totalProfit = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + (sale.sellDate ? sale.profit : 0), 0);
  }, [filteredSales]);

  const totalTurnover = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + (sale.sellDate ? sale.sellPrice * sale.quantity : 0), 0);
  }, [filteredSales]);


  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden bg-background text-foreground">
      <div className="flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-background text-foreground border-input"
          />
          <Button
            onClick={() => setFilterSold(null)}
            variant={filterSold === null ? "default" : "outline"}
            className="bg-primary text-primary-foreground"
          >
            All
          </Button>
          <Button
            onClick={() => setFilterSold(true)}
            variant={filterSold === true ? "default" : "outline"}
            className="bg-primary text-primary-foreground"
          >
            Sold
          </Button>
          <Button
            onClick={() => setFilterSold(false)}
            variant={filterSold === false ? "default" : "outline"}
            className="bg-primary text-primary-foreground"
          >
            Unsold
          </Button>
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Sales Tracker</h2>
          <div>
            <span className="mr-4">Total Profit: {totalProfit.toFixed(0)}</span>
            <span>Total Turnover: {totalTurnover.toFixed(0)}</span>
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="rounded-md border border-border">
          <Table className="table-custom">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Item Name</TableHead>
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
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.itemName}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={localValues[`${sale.id}-quantity`] ?? sale.quantity}
                      onChange={(e) => handleChange(sale.id!, 'quantity', e.target.value)}
                      onBlur={() => handleBlur(sale.id!, 'quantity')}
                      className="w-20 h-6 px-1 bg-background text-foreground border-input"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={localValues[`${sale.id}-costPrice`] ?? sale.costPrice}
                      onChange={(e) => handleChange(sale.id!, 'costPrice', e.target.value)}
                      onBlur={() => handleBlur(sale.id!, 'costPrice')}
                      className="w-24 h-6 px-1 bg-background text-foreground border-input"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={localValues[`${sale.id}-sellPrice`] ?? sale.sellPrice}
                      onChange={(e) => handleChange(sale.id!, 'sellPrice', e.target.value)}
                      onBlur={() => handleBlur(sale.id!, 'sellPrice')}
                      className="w-24 h-6 px-1 bg-background text-foreground border-input"
                    />
                  </TableCell>
                  <TableCell>{formatDate(sale.addedDate)}</TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={localValues[`${sale.id}-sellDate`] ?? (sale.sellDate ? new Date(sale.sellDate).toISOString().split('T')[0] : '')}
                      onChange={(e) => handleChange(sale.id!, 'sellDate', e.target.value)}
                      onBlur={() => handleBlur(sale.id!, 'sellDate')}
                      className="w-32 h-6 px-1 bg-background text-foreground border-input"
                    />
                  </TableCell>
                  <TableCell>{sale.profit.toFixed(0)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-secondary text-secondary-foreground">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-popover text-popover-foreground">
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