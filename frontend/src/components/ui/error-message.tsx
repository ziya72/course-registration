import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  fullHeight?: boolean;
}

export const ErrorMessage = ({ 
  message, 
  onRetry, 
  className,
  fullHeight = false 
}: ErrorMessageProps) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 p-6 text-center',
      fullHeight && 'min-h-[300px]',
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Something went wrong</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
