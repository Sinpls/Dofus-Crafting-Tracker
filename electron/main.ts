import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let win: BrowserWindow | null = null;
const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;

function setupPaths() {
  let basePath: string;

  if (isDevelopment) {
    console.log('Running in development mode');
    basePath = path.join(__dirname, '..');
  } else {
    console.log('Running in production mode');
    basePath = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'));
  }

  console.log('Base path:', basePath);

  const userDataPath = path.join(basePath, 'user_data');
  const dataPath = path.join(basePath, 'data');

  console.log('Setting userData path to:', userDataPath);
  app.setPath('userData', userDataPath);

  console.log('Data path:', dataPath);

  try {
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
      console.log('Created data directory');
    }
  } catch (error) {
    console.error('Failed to create data directory:', error);
  }

  return { userDataPath, dataPath };
}

function createWindow() {
  const { dataPath } = setupPaths();

  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'public', 'Dofus.ico')
  });

  if (isDevelopment) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  ipcMain.handle('get-data-path', () => dataPath);

  ipcMain.handle('file-exists', (_, path) => fs.existsSync(path));

  ipcMain.handle('read-file', (_, path) => fs.promises.readFile(path, 'utf-8'));

  ipcMain.handle('write-file', (_, path, data) => fs.promises.writeFile(path, data, 'utf-8'));

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('app-ready', dataPath);
  });
}

app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});