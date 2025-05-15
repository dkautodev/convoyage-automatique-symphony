
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './types';

// Création d'un hook pour utiliser le contexte d'authentification
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
}
