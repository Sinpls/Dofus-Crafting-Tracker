import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../@/components/ui/table"
import { Input } from "../../@/components/ui/input"
import { Button } from "../../@/components/ui/button"
import { ISale } from '../types';

export const SalesTracker: React.FC = () => {
  const [sales, setSales] = useState<ISale[]>([]);
  const [newSale, setNewSale] = useState<Omit<ISale, 'id'>>({
    itemId: 0,
    quantity: 0,
    price: 0,
    date: new Date()
  });

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesData = await window.electronAPI.getSales();
        setSales(salesData);
      } catch (error) {
        console.error('Failed to fetch sales:', error);
      }
    };

    fetchSales();
  }, []);

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addedSale = await window.electronAPI.addSale(newSale);
      setSales([...sales, { ...newSale, id: addedSale }]);
      setNewSale({ itemId: 0, quantity: 0, price: 0, date: new Date() });
    } catch (error) {
      console.error('Failed to add sale:', error);
    }
  };

  return (
    <div className="p-4 bg-background text-foreground">
      <h2 className="text-2xl font-bold mb-4">Sales Tracker</h2>
      <form onSubmit={handleAddSale} className="mb-4 space-y-2">
        <Input
          type="number"
          placeholder="Item ID"
          value={newSale.itemId}
          onChange={(e) => setNewSale({ ...newSale, itemId: Number(e.target.value) })}
        />
        <Input
          type="number"
          placeholder="Quantity"
          value={newSale.quantity}
          onChange={(e) => setNewSale({ ...newSale, quantity: Number(e.target.value) })}
        />
        <Input
          type="number"
          placeholder="Price"
          value={newSale.price}
          onChange={(e) => setNewSale({ ...newSale, price: Number(e.target.value) })}
        />
        <Input
          type="date"
          value={newSale.date.toISOString().split('T')[0]}
          onChange={(e) => setNewSale({ ...newSale, date: new Date(e.target.value) })}
        />
        <Button type="submit">Add Sale</Button>
      </form>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="text-muted-foreground">Item ID</TableHead>
              <TableHead className="text-muted-foreground">Quantity</TableHead>
              <TableHead className="text-muted-foreground">Price</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} className="border-b border-border hover:bg-muted/50">
                <TableCell>{sale.itemId}</TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>{sale.price}</TableCell>
                <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* TODO: Add SalesChart component here */}
    </div>
  );
};

export default SalesTracker;