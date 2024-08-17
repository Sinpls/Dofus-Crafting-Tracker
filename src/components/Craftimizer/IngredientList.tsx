// IngredientList.tsx

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table"
import { Input } from "../../../@/components/ui/input"
import { IIngredient } from '../../types';

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
      updateIngredientCost(name, numericValue === '' ? 0 : Number(numericValue));
    }
  };

  if (!ingredients || ingredients.length === 0) {
    return <div>No ingredients available</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex-shrink-1 p-2">
        <h2 className="text-xl font-bold">Ingredients</h2>
      </div>
      <div className="flex-grow overflow-auto rounded-md border border-border h-full">
          <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {sortedIngredients.map((ingredient) => (
                <TableRow 
                  key={ingredient.name} 
                  className={`border-b border-border hover:bg-muted/50 ${
                    ingredient.type === 'Intermediate' ? 'bg-yellow-500/20' : ''
                  }`}
                >
                  <TableCell className="py-0.5 px-2">{ingredient.name}</TableCell>
                  <TableCell className="py-0.5 px-2">{ingredient.amount.toLocaleString()}</TableCell>
                  <TableCell className="py-0.5 px-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={localCosts[ingredient.name] ?? ingredient.cost}
                      onChange={(e) => handleChange(ingredient.name, e.target.value)}
                      onBlur={() => handleBlur(ingredient.name)}
                      className="w-24 bg-background text-foreground h-6 px-1"
                    />
                  </TableCell>
                  <TableCell className="py-0.5 px-2">{ingredient.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
  );
};

export default IngredientList;