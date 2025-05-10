
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from 'sonner'; // Assurez-vous que c'est bien importé

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" richColors closeButton /> {/* Ajout du composant Toaster */}
    </BrowserRouter>
  </React.StrictMode>
);
