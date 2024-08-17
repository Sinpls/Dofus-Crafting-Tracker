import React, { useState, useEffect } from 'react';
import Craftimizer from './components/Craftimizer';
import SalesTracker from './components/SalesTracker';
import Charts from './components/Charts';
import { dataAccessService } from './services/DataAccessService';
import { useCalculation } from './hooks/useCalculation';
import './globals.css';
import { Button } from "../@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../@/components/ui/tabs";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('craftimizer');

  const {
    craftedItemList,
    ingredients,
    intermediateItems,
    addCraftedItem,
    removeCraftedItem,
    updateCraftedItem,
    updateIngredientCost,
    updateIntermediateItemCost,
  } = useCalculation();

  useEffect(() => {
    const initializeData = async () => {
      try {
        await dataAccessService.init();
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        setIsLoading(false);
      }
    };
    initializeData();

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (isLoading) {
    return <div className="text-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="p-4 flex-grow">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid grid-cols-3 w-96 bg-muted">
              <TabsTrigger value="craftimizer" className="px-4 py-2 data-[state=active]:bg-background">Calculator</TabsTrigger>
              <TabsTrigger value="salestracker" className="px-4 py-2 data-[state=active]:bg-background">Tracker</TabsTrigger>
              <TabsTrigger value="charts" className="px-4 py-2 data-[state=active]:bg-background">Charts</TabsTrigger>
            </TabsList>
            <Button onClick={toggleDarkMode} variant="outline" className="bg-secondary text-secondary-foreground">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
          <TabsContent value="craftimizer" className="h-[calc(100vh-6rem)] overflow-hidden">
            <Craftimizer
              craftedItemList={craftedItemList}
              ingredients={ingredients}
              intermediateItems={intermediateItems}
              addCraftedItem={addCraftedItem}
              removeCraftedItem={removeCraftedItem}
              updateCraftedItem={updateCraftedItem}
              updateIngredientCost={updateIngredientCost}
              updateIntermediateItemCost={updateIntermediateItemCost}
            />
          </TabsContent>
          <TabsContent value="salestracker" className="h-[calc(100vh-6rem)] overflow-hidden">
            <SalesTracker addCraftedItem={addCraftedItem} />
          </TabsContent>
          <TabsContent value="charts" className="h-[calc(100vh-8rem)] overflow-hidden">
            <Charts />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;