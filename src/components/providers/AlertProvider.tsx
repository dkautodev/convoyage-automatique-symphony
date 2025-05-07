
import React, { createContext, useContext, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X } from 'lucide-react';

interface AlertContextType {
  showAlert: (message: string, type?: 'default' | 'destructive' | 'success', title?: string) => void;
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
    type: 'default' | 'destructive' | 'success';
    title?: string;
    visible: boolean;
  } | null>(null);

  const showAlert = (
    message: string,
    type: 'default' | 'destructive' | 'success' = 'default',
    title?: string
  ) => {
    setAlert({
      message,
      type,
      title,
      visible: true,
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideAlert();
    }, 5000);
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
        <div className="fixed top-4 right-4 z-50 w-80">
          <Alert variant={alert.type} className="relative">
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
