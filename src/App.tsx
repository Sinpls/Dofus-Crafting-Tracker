// src/App.tsx

import React, { useState, useEffect } from 'react';
import Craftimizer from './components/Craftimizer';
import SalesTracker from './components/SalesTracker';
import SearchBar from './components/Craftimizer/SearchBar';
import { dataAccessService} from './services/DataAccessService';
import { IDofusItem } from './types';
import { useCalculation } from './hooks/useCalculation';
import './globals.css';
import { Button } from "../@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../@/components/ui/tabs";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IDofusItem | null>(null);
  const [activeTab, setActiveTab] = useState('craftimizer');
  
  const {
    equipmentList,
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

  const handleSearchItemSelect = (item: IDofusItem) => {
    setSelectedItem(item);
    setActiveTab('craftimizer');
  };

  const existingEquipment = equipmentList.reduce((acc, item) => {
    acc[item.ankama_id] = item.amount;
    return acc;
  }, {} as { [key: number]: number });

  if (isLoading) {
    return <div className="text-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Dofus Craftimizer</h1>
            <SearchBar onItemSelect={handleSearchItemSelect} existingEquipment={existingEquipment} />
          </div>
          <Button onClick={toggleDarkMode} variant="outline">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="craftimizer">Craftimizer</TabsTrigger>
            <TabsTrigger value="salestracker">Sales Tracker</TabsTrigger>
          </TabsList>
          <TabsContent value="craftimizer">
            <Craftimizer selectedItem={selectedItem} />
          </TabsContent>
          <TabsContent value="salestracker">
            <SalesTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;