
import React from 'react';
import { checkPasswordStrength } from '@/utils/validation';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const strength = checkPasswordStrength(password);
  
  if (!password) return null;
  
  const getLabel = () => {
    switch (strength) {
      case 'weak':
        return 'Weak';
      case 'medium':
        return 'Medium';
      case 'strong':
        return 'Strong';
      default:
        return '';
    }
  };
  
  const getColorClass = () => {
    switch (strength) {
      case 'weak':
        return 'password-strength-weak';
      case 'medium':
        return 'password-strength-medium';
      case 'strong':
        return 'password-strength-strong';
      default:
        return '';
    }
  };
  
  const getWidth = () => {
    switch (strength) {
      case 'weak':
        return '33%';
      case 'medium':
        return '67%';
      case 'strong':
        return '100%';
      default:
        return '0%';
    }
  };
  
  return (
    <div className="mt-1 space-y-1">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: getWidth() }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium">{getLabel()}</span>
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
