### Next Steps
1. I would like a row at the bottom of the Crafted Item List to tell me the total sum of the costs and the profit (taking total amount into account)
2. I would like to have all numbers be comma seperated eg 123456 becomes 123,456 decimals are not needed.
3. I would like color coding on the ingredient tab on whether the value is pulled from the JSON file from a previous session or the value has been modified this session. Let's do no color change on a value modified this session and a yellow color change when it is 'old'. Should look the same as when I override a intermediate item
4. I want the window position and size to be retained between sessions if possible.
5. I want a dropdown button in the bottom right of the tracker screen to set the pagination between 10/25/50/100
6. I want to remove the duplication option in the tracker and instead have a new functionality.
   - Add a column called 'Quantity Sold' between item name and Quantity. This signifies the amount sold so far. I want a new action through the actions button called 'move Unsold' This will do the following:
       - It creates a new row with the same item name, cost price and sell price, added date. The quantity is the remain unsold amount of the original row. 'Quantity Sold' will start at 0 again.
       - Then the original row 'Amount' is lowered to match the quantity sold. So the total amount of items should remain the same.