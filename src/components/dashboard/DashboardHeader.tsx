
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  titleColor?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
  titleColor,
}) => {
  return (
    <div className={cn("pb-6 flex flex-col sm:flex-row items-center justify-between gap-4", className)}>
      <div className="text-center w-full">
        <h1 className={cn("text-2xl sm:text-3xl font-bold", titleColor)}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
