import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table"
import { Input } from "../../../@/components/ui/input"
import { IIngredient } from '../../types';
import { copyToClipboard } from '../../utils/clipboard';
import { formatNumber } from '../../utils/formatters';

interface IngredientListProps {
  ingredients: IIngredient[];
  updateIngredientCost: (name: string, cost: number) => void;
}

const IngredientList: React.FC<IngredientListProps> = ({ 
  ingredients, 
  updateIngredientCost
}) => {
  const [localCosts, setLocalCosts] = useState<{ [key: string]: string }>({});

  const sortedIngredients = [...(ingredients || [])].sort((a, b) => 
    (a?.name || '').localeCompare(b?.name || '')
  );

  const handleChange = (name: string, value: string) => {
    setLocalCosts(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name: string) => {
    const value = localCosts[name];
    if (value !== undefined) {
      const numericValue = value.replace(/^0+/, '');
      const newCost = numericValue === '' ? 0 : Number(numericValue);
      updateIngredientCost(name, newCost);
    }
  };

  if (!ingredients || ingredients.length === 0) {
    return <div>No ingredients available</div>;
  }

  const handleItemClick = (itemName: string) => {
    copyToClipboard(itemName);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex-shrink-1 p-2">
        <h2 className="text-xl font-bold">Ingredients</h2>
      </div>
      <div className="flex-grow overflow-auto rounded-md border border-border">
        <Table className="table-custom">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Cost</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIngredients.map((ingredient) => (
              <TableRow 
                key={ingredient.name} 
                className="hover:bg-muted/50"
              >
                <TableCell 
                  onClick={() => handleItemClick(ingredient.name)}
                  className="cursor-pointer hover:underline"
                >
                  {ingredient.name}
                </TableCell>
                <TableCell>{formatNumber(ingredient.amount)}</TableCell>
                <TableCell>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={localCosts[ingredient.name] ?? formatNumber(ingredient.cost)}
                    onChange={(e) => handleChange(ingredient.name, e.target.value)}
                    onBlur={() => handleBlur(ingredient.name)}
                    className="w-24 bg-background text-foreground border-input"
                  />
                </TableCell>
                <TableCell>{ingredient.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IngredientList;