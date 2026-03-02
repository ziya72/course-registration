import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ 
  title = 'No data found',
  message, 
  icon,
  action,
  className 
}: EmptyStateProps) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[200px]',
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        {icon || <FileQuestion className="h-6 w-6 text-muted-foreground" />}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      {action}
    </div>
  );
};

export default EmptyState;
