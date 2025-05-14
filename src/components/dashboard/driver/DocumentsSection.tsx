
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import DriverDocuments from './DriverDocuments';

const DocumentsSection = () => {
  const { profile } = useAuth();
  
  // N'afficher la section de documents que pour les chauffeurs
  if (profile?.role !== 'chauffeur') {
    return null;
  }
  
  return <DriverDocuments />;
};

export default DocumentsSection;
