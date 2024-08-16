// App.tsx

import React, { useState, useEffect } from 'react';
import Craftimizer from './components/Craftimizer';
import SearchBar from './components/Craftimizer/SearchBar';
import { dataAccessService} from './services/DataAccessService';
import { IDofusItem } from './types';
import { useCalculation } from './hooks/useCalculation';
import './globals.css';
import { Button } from "../@/components/ui/button";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IDofusItem | null>(null);
  
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

  console.log("App rendering. equipmentList length:", equipmentList.length);

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
      </div>
      <div className="flex-grow overflow-hidden p-4 pb-8">
        <Craftimizer selectedItem={selectedItem} />
      </div>
    </div>
  );
}

export default App;