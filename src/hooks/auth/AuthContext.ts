
import { createContext } from 'react';
import { AuthContextType } from './types';

// Création du contexte d'authentification avec une valeur par défaut
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
