# Dofus-Salescraft: SalesTracker Design Document

## Current Implementation Status

### Completed Tasks
1. Tab System
   - Implemented a tab-based navigation in the main App component
   - Users can switch between Craftimizer, SalesTracker, and Charts
2. SalesTracker Component
   - Created a new React component for SalesTracker
   - Implemented in `src/components/SalesTracker/SalesTracker.tsx`
3. Data Export
   - Implemented functionality to export crafted items from Craftimizer to SalesTracker
4. Persistent Storage
   - Updated DatabaseService to handle sales-related operations
   - Uses IndexedDB via Dexie.js for SalesTracker data storage
5. SalesTracker List View
   - Created a table component to display sales data
   - Implemented in-place editing for all fields except the item name
6. Row Actions
   - Implemented dropdown menu for row actions in SalesTracker
   - Added functionality for deleting and duplicating sales entries
7. UI Improvements
   - Integrated shadcn/ui library components
   - Improved layout with tabs and dark mode toggle in the same row
8. State Management
   - Lifted state up to the App component to prevent resetting when switching tabs
9. Charts
   - Implemented a new Charts tab with a bar chart showing monthly sales and profit
10. Search and Filtering
    - Added search functionality to filter items by name in SalesTracker
    - Implemented filtering options for sold/unsold items
11. Summary Statistics
    - Added display of total profit and total turnover in SalesTracker
12. Integration between SalesTracker and Craftimizer
    - Implemented "Add to Craftimizer" functionality in SalesTracker
13. Performance Optimization
    - Resolved infinite loop issue in calculation logic
    - Implemented debouncing for calculations
14. Refined application styling
    - Updated color scheme for better dark/light mode support
    - Implemented more compact table layouts
    - Improved consistency across components

### Next Steps
1. Implement pagination or virtual scrolling for large datasets
2. Optimize database queries for better performance
3. Make the database storage location relative to the executable, same for the JSON files