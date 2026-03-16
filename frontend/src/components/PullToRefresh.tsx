import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

const PullToRefresh = ({ children, onRefresh, disabled = false }: PullToRefreshProps) => {
  const isMobile = useIsMobile();
  const { isRefreshing, pullDistance, handlers } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    disabled: disabled || !isMobile,
  });

  // Don't apply pull-to-refresh on desktop
  if (!isMobile) {
    return <>{children}</>;
  }

  const getIndicatorText = () => {
    if (isRefreshing) return 'Refreshing...';
    if (pullDistance > 80) return 'Release to refresh';
    if (pullDistance > 30) return 'Pull to refresh';
    return '';
  };

  return (
    <div {...handlers} className="min-h-screen relative overflow-hidden">
      {/* Enhanced pull indicator for mobile */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 z-50 transition-all duration-200 flex flex-col items-center"
        style={{ 
          top: Math.max(-60, pullDistance - 60),
          opacity: pullDistance > 20 ? Math.min(1, (pullDistance - 20) / 40) : 0,
        }}
      >
        <div className={`w-12 h-12 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center shadow-lg ${isRefreshing ? 'animate-spin' : ''}`}>
          <RefreshCw 
            className="h-6 w-6 text-primary" 
            style={{
              transform: isRefreshing ? 'none' : `rotate(${Math.min(pullDistance * 2, 360)}deg)`,
            }}
          />
        </div>
        {getIndicatorText() && (
          <div className="mt-2 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full border border-border/50">
            <span className="text-xs font-medium text-foreground">{getIndicatorText()}</span>
          </div>
        )}
      </div>
      
      {/* Content with smooth pull transform */}
      <div 
        className="mobile-safe-top"
        style={{ 
          transform: `translateY(${isRefreshing ? 50 : Math.min(pullDistance * 0.4, 50)}px)`,
          transition: pullDistance === 0 || isRefreshing ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
