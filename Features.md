### Next Steps
1. The packaged version is functioning but the development environment is returning this issue 
react_jsx-dev-runtime.js:881 Uncaught SyntaxError: Unexpected end of input.
2. Can you analyze the current implementation of the calculation on ingredient and intermediate amounts? I put in 3 crafted items with overlapping ingredients, but the ingredients and intermediate items were not properly summed based on the total amount of crafted items. Provide a solution as well.
3. Add the ability to left click items(Crafted items, ingredients and intermediate items) to copy them to the clipboard. I do not need a pop up on success/failure
4. I want the ability to retain any ingredient costs I put it in between sessions. The JSON can be saved in the data path with the other JSON files.