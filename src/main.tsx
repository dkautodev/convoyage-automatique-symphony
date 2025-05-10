
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
// Remove duplicate Toaster import - it's already in RootLayout

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* Remove duplicate Toaster - it's already in RootLayout */}
    </BrowserRouter>
  </React.StrictMode>
);
