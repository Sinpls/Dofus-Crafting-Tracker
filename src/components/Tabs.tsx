import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "../../@/components/ui/tabs"

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabsComponent: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="crafting">Crafting</TabsTrigger>
        <TabsTrigger value="sales">Sales Tracker</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default TabsComponent;