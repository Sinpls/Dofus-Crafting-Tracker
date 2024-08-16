import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css';

console.log('React index.tsx is running');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('React app has been rendered');