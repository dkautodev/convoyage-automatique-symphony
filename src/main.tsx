import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Remove duplicate Toaster import - it's already in RootLayout

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
