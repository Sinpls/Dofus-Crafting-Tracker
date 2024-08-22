import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Equipment
  getEquipment: () => ipcRenderer.invoke('get-equipment'),
  addEquipment: (equipment: any) => ipcRenderer.invoke('add-equipment', equipment),
  updateEquipment: (id: number, updates: any) => ipcRenderer.invoke('update-equipment', id, updates),
  deleteEquipment: (id: number) => ipcRenderer.invoke('delete-equipment', id),

  // Ingredients
  getIngredients: () => ipcRenderer.invoke('get-ingredients'),
  addIngredient: (ingredient: any) => ipcRenderer.invoke('add-ingredient', ingredient),
  updateIngredient: (id: number, updates: any) => ipcRenderer.invoke('update-ingredient', id, updates),
  deleteIngredient: (id: number) => ipcRenderer.invoke('delete-ingredient', id),

  // Sales
  getSales: () => ipcRenderer.invoke('get-sales'),
  addSale: (sale: any) => ipcRenderer.invoke('add-sale', sale),
  updateSale: (id: number, updates: any) => ipcRenderer.invoke('update-sale', id, updates),
  deleteSale: (id: number) => ipcRenderer.invoke('delete-sale', id),

  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  fileExists: (path: string) => ipcRenderer.invoke('file-exists', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, data: string) => ipcRenderer.invoke('write-file', path, data),


  // Other APIs can be added here as needed
});

ipcRenderer.on('user-data-path', (_, path) => {
  localStorage.setItem('userDataPath', path);
});