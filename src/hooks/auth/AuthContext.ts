
import { createContext } from 'react';
import { AuthContextType } from './types';

// Création du contexte d'authentification
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
