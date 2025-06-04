
import React, { createContext, useContext, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X } from 'lucide-react';

// Définir le type correct pour les variantes d'alerte
type AlertVariant = 'default' | 'destructive' | 'success';

interface AlertContextType {
  showAlert: (message: string, type?: AlertVariant, title?: string) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: React.ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alert, setAlert] = useState<{
    message: string;
    type: AlertVariant;
    title?: string;
    visible: boolean;
  } | null>(null);

  const showAlert = (
    message: string,
    type: AlertVariant = 'default',
    title?: string
  ) => {
    setAlert({
      message,
      type,
      title,
      visible: true,
    });

    // Auto-hide after 2 seconds
    setTimeout(() => {
      hideAlert();
    }, 2000);
  };

  const hideAlert = () => {
    if (alert) {
      setAlert({ ...alert, visible: false });
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alert && alert.visible && (
        <div className="fixed bottom-4 right-4 sm:bottom-4 sm:right-4 z-50 w-80 sm:w-80 left-1/2 sm:left-auto transform -translate-x-1/2 sm:translate-x-0">
          <Alert 
            variant={alert.type === 'success' ? 'default' : alert.type}
            className={`relative ${alert.type === 'success' ? 'border-green-500 bg-green-50 text-green-700' : ''}`}
          >
            {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
            <AlertDescription>{alert.message}</AlertDescription>
            <button
              onClick={hideAlert}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50"
            >
              <X size={14} />
            </button>
          </Alert>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export default AlertProvider;
