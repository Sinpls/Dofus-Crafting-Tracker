import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../@/components/ui/table";
import { Input } from "../../@/components/ui/input";
import { Button } from "../../@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../@/components/ui/dropdown-menu";
import { ISale, IDofusItem } from '../types';
import { db, setupDatabase } from '../services/DatabaseService';
import { formatNumber } from '../utils/formatters';

interface SalesTrackerProps {
  addCraftedItem: (item: IDofusItem | { name: string; ankama_id?: number }) => Promise<void>;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const SalesTracker: React.FC<SalesTrackerProps> = ({ addCraftedItem }) => {
  const [sales, setSales] = useState<ISale[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [localValues, setLocalValues] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSold, setFilterSold] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalTurnover, setTotalTurnover] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await setupDatabase();
        await loadSales();
        await loadTotals();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setError('Failed to initialize database. Please refresh the page and try again.');
      }
    };

    initDatabase();
  }, []);

  const loadSales = useCallback(async () => {
    setError(null);
    try {
      const filters: Partial<ISale> = {};
      if (searchTerm) filters.itemName = searchTerm;
      if (filterSold !== null) filters.sellDate = filterSold ? new Date() : null;

      console.log('Fetching sales with filters:', filters);
      const { sales: loadedSales, total } = await db.getSales(currentPage, itemsPerPage, filters);
      console.log('Loaded sales:', loadedSales);
      console.log('Total sales:', total);

      setSales(loadedSales);
      setTotalSales(total);
    } catch (err) {
      console.error('Error loading sales:', err);
      setError('Failed to load sales. Please try again.');
    }
  }, [currentPage, searchTerm, filterSold, itemsPerPage]);

  const debouncedLoadSales = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      loadSales();
    }, 300);
  }, [loadSales]);

  useEffect(() => {
    if (db.isOpen()) {
      debouncedLoadSales();
      loadTotals();
    }
  }, [debouncedLoadSales, itemsPerPage]);

  const loadTotals = async () => {
    try {
      const { totalProfit, totalTurnover } = await db.getTotalProfitAndTurnover();
      setTotalProfit(totalProfit);
      setTotalTurnover(totalTurnover);
    } catch (err) {
      console.error('Error loading totals:', err);
      setError('Failed to load totals. Please refresh the page.');
    }
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
      try {
        await db.updateSale(id, { [field]: updatedValue });
        loadSales();
        loadTotals();
      } catch (err) {
        console.error('Error updating sale:', err);
        setError('Failed to update sale. Please try again.');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.deleteSale(id);
      loadSales();
      loadTotals();
    } catch (err) {
      console.error('Error deleting sale:', err);
      setError('Failed to delete sale. Please try again.');
    }
  };

  const handleDuplicate = async (sale: ISale) => {
    try {
      const { id, ...saleWithoutId } = sale;
      await db.addSale({
        ...saleWithoutId,
        addedDate: new Date()
      });
      loadSales();
      loadTotals();
    } catch (err) {
      console.error('Error duplicating sale:', err);
      setError('Failed to duplicate sale. Please try again.');
    }
  };

  const handleAddToCraftimizer = (itemName: string) => {
    addCraftedItem({ name: itemName });
  };

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    debouncedLoadSales();
  };

  const totalPages = Math.ceil(totalSales / itemsPerPage);

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden bg-background text-foreground">
      <div className="flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-64 bg-background text-foreground border-input"
          />
          <Button
            onClick={() => { setFilterSold(null); setCurrentPage(1); debouncedLoadSales(); }}
            variant={filterSold === null ? "default" : "outline"}
            className="bg-primary text-primary-foreground"
          >
            All
          </Button>
          <Button
            onClick={() => { setFilterSold(true); setCurrentPage(1); debouncedLoadSales(); }}
            variant={filterSold === true ? "default" : "outline"}
            className="bg-primary text-primary-foreground"
          >
            Sold
          </Button>
          <Button
            onClick={() => { setFilterSold(false); setCurrentPage(1); debouncedLoadSales(); }}
            variant={filterSold === false ? "default" : "outline"}
            className="bg-primary text-primary-foreground"
          >
            Unsold
          </Button>
        </div>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Sales Tracker</h2>
          <div>
            <span className="mr-4">Total Profit: {formatNumber(totalProfit)}</span>
            <span>Total Turnover: {formatNumber(totalTurnover)}</span>
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
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">No sales found</TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.itemName}</TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={localValues[`${sale.id}-quantity`] ?? formatNumber(sale.quantity)}
                        onChange={(e) => handleChange(sale.id!, 'quantity', e.target.value)}
                        onBlur={() => handleBlur(sale.id!, 'quantity')}
                        className="w-20 h-6 px-1 bg-background text-foreground border-input"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={localValues[`${sale.id}-costPrice`] ?? formatNumber(sale.costPrice)}
                        onChange={(e) => handleChange(sale.id!, 'costPrice', e.target.value)}
                        onBlur={() => handleBlur(sale.id!, 'costPrice')}
                        className="w-24 h-6 px-1 bg-background text-foreground border-input"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={localValues[`${sale.id}-sellPrice`] ?? formatNumber(sale.sellPrice)}
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
                    <TableCell>{formatNumber(sale.profit)}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalSales)} of {totalSales} entries
        </div>
        <div className="flex space-x-2 items-center">
          <Button
            onClick={() => { setCurrentPage(page => Math.max(1, page - 1)); debouncedLoadSales(); }}
            disabled={currentPage === 1}
            variant="default"
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Previous
          </Button>
          <Button
            onClick={() => { setCurrentPage(page => Math.min(totalPages, page + 1)); debouncedLoadSales(); }}
            disabled={currentPage === totalPages}
            variant="default"
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Next
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default" 
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {itemsPerPage} per page
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <DropdownMenuItem 
                  key={option}
                  onClick={() => {
                    setItemsPerPage(option);
                    setCurrentPage(1);
                    debouncedLoadSales();
                  }}
                >
                  {option} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default SalesTracker;