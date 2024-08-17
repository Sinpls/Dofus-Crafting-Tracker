# Dofus-Salescraft: SalesTracker Design Document

## 1. Overview
The SalesTracker is a new feature to be added to the existing Dofus-Salescraft application. It will provide users with the ability to track sales, analyze profitability, and manage their crafting business more effectively.

## 2. Current Project Structure
The project is built using TypeScript, Vite, Tailwind CSS, Electron, and the shadcn/ui library. The main components are:

- Craftimizer: Handles crafting calculations and ingredient management
- DataAccessService: Manages data retrieval and storage
- CalculationService: Performs cost and profit calculations

## 3. New Features

### 3.1 Tab System
- Implement a tab-based navigation system
  - Craftimizer Tab (existing functionality)
  - SalesTracker Tab (new functionality)

### 3.2 SalesTracker Component
- Create a new React component for the SalesTracker
- Implement in `src/components/SalesTracker/SalesTracker.tsx`

### 3.3 Data Export
- Add functionality to export crafted items to the SalesTracker
- Include: Item name, Amount, Cost price, Sell price, Current date

### 3.4 Persistent Storage
- Utilize IndexedDB via Dexie.js for SalesTracker data storage
- Implement in `src/services/DatabaseService.ts`

### 3.5 SalesTracker List View
- Create a table component to display sales data
- Columns: Item name, Amount, Cost price, Sell price, Date of sale
- Implement in-place editing for all fields except the item name
  - Use input fields for Amount, Cost price, and Sell price
  - Use a date picker for the Date of sale
- Ensure changes are immediately saved to the database after finishing editing a field

### 3.6 Row Actions via Context Menu
- Implement a context menu for each row in the SalesTracker list
- The context menu will include the following options:
  1. "Add to Craftimizer": Adds the item back to the Craftimizer equipment list
  2. "Duplicate": Creates a copy of the current row in the SalesTracker
  3. "Delete": Removes the row from the SalesTracker
- The context menu will appear on right-click of a row
- Implement handlers for each action to perform the respective operations

### 3.7 Data Filtering and Analysis
- Implement a search box for filtering items by name
- Utilize Dexie.js Query API for advanced querying and analysis
  - Examples: Quick turnover, highest profit percentage per item

### 3.8 Summary Statistics
- Display sum of profit made
- Display total turnover

## 4. Implementation Plan

1. Update project structure to accommodate new features
2. Implement tab system in the main App component
3. Create SalesTracker component and related sub-components
4. Extend DatabaseService to handle SalesTracker data
5. Implement data export functionality from Craftimizer to SalesTracker
6. Develop list view with in-place editing and row duplication
7. Add search and filtering capabilities
8. Implement summary statistics calculation and display
9. Integrate Dexie.js Query API for advanced analysis features

## 5. UI/UX Considerations
- Maintain consistent styling with the existing Craftimizer interface
- Ensure responsive design for all new components
- Implement user-friendly interactions for editing and duplicating sales entries

## 6. Performance Considerations
- Optimize IndexedDB queries for large datasets
- Implement pagination or virtual scrolling for the sales list if needed
- Consider caching strategies for frequently accessed data

## 7. Future Enhancements
- Implement more advanced filtering options
- Add data visualization features (e.g., charts, graphs)
- Develop an export feature for sales data

## 8. Testing Strategy
- Develop unit tests for new services and utility functions
- Implement integration tests for database operations
- Conduct thorough UI testing for the new SalesTracker component

## Current Implementation Status

### 1. Tab System
- Implemented a tab-based navigation in the main App component
- Users can switch between Craftimizer and SalesTracker

### 2. SalesTracker Component
- Created a new React component for SalesTracker
- Implemented in `src/components/SalesTracker/SalesTracker.tsx`
- Features:
  - Display a list of sales with all required columns (Item Name, Quantity, Cost Price, Sell Price, Added Date, Sell Date, Profit)
  - In-place editing for Quantity, Cost Price, Sell Price, and Sell Date
  - Delete sales
  - Duplicate sales (with a new Added Date)
  - Add items back to the Craftimizer

### 3. Data Export
- Implemented functionality to export crafted items from Craftimizer to SalesTracker
- Exports include: Item name, Amount, Cost price, Sell price, Current date (as Added Date)

### 4. Persistent Storage
- Updated DatabaseService to handle sales-related operations
- Implemented in `src/services/DatabaseService.ts`
- Uses IndexedDB via Dexie.js for SalesTracker data storage

### 5. Craftimizer Integration
- Modified useCalculation hook to export addEquipment function
- Allows adding items from SalesTracker back to Craftimizer (THIS IS CURRENTLY NOT FUNCTIONAL)

### 6. UI Components
- Integrated shadcn/ui library components
- Implemented dropdown menu for row actions in SalesTracker

### 7. Date Handling
- Improved date handling and formatting in SalesTracker
- Added Date is set to the current date when exporting from Craftimizer
- Sell Date can remain empty (null) if the sale hasn't been made yet

### Next Steps

0. - Fix the Importing of an item back into craftimizer from salestracker
   - Remove the export to Sales button on each row and instead have a single button for the complete list to the right of 'Crafted Items'
   - Improve padding and button layour of Calculator and Tracker tab buttons
   - Place the Craftimizer Search bar in the craftimizer component instead of App.tsx
   - Fix crafted items amount resetting to 2 when swapping between the calculator and tracker tabs.
   The crafteditemlist doesnt seem to persist. When moving back to the calaculator tab, the add equipment command gets executed twice.

1. Add search and filtering capabilities:
   - Implement a search box for filtering items by name
   - Add sorting functionality for columns

2. Implement summary statistics calculation and display:
   - Calculate and display the sum of profit made
   - Calculate and display the total turnover

3. (Optional) Integrate Dexie.js Query API for advanced analysis features:
   - Implement advanced querying capabilities
   - Add features like quick turnover analysis or highest profit percentage per item

4. Refine user experience:
   - Implement more advanced filtering options
   - Add data visualization features (e.g., charts, graphs)
   - Develop an export feature for sales data
