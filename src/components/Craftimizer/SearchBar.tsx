import React, { useState, useEffect, useRef } from 'react';
import { Input } from "../../../@/components/ui/input"
import { IDofusItem } from '../../types';
import { dataAccessService } from '../../services/DataAccessService';

interface SearchBarProps {
  onItemSelect: (item: IDofusItem) => void;
  existingCraftedItem: { [key: number]: number };  // Map of ankama_id to amount
}

const SearchBar: React.FC<SearchBarProps> = ({ onItemSelect, existingCraftedItem: existingCraftedItem }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IDofusItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async () => {
    if (query.length > 2) {
      const searchResults = await dataAccessService.searchItems(query);
      setResults(searchResults);
      setIsDropdownOpen(true);
    } else {
      setResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleItemClick = (item: IDofusItem) => {
    onItemSelect(item);
    setQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Input
        type="text"
        placeholder="Search Items..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch();
        }}
        onKeyPress={handleKeyPress}
        className="w-64 bg-background text-foreground border-input"
      />
      {isDropdownOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[80vh] overflow-y-auto">
          {results.map((item) => (
            <div
              key={item.ankama_id}
              className="p-2 hover:bg-muted/50 cursor-pointer text-foreground"
              onClick={() => handleItemClick(item)}
            >
              {item.name} - {item.type.name}
              {existingCraftedItem[item.ankama_id] !== undefined && (
                <span className="ml-2 text-muted-foreground">
                  (Current: {existingCraftedItem[item.ankama_id]})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default SearchBar;