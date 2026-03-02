import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
}

const PullToRefresh = ({ children, onRefresh }: PullToRefreshProps) => {
  const { isRefreshing, pullDistance, handlers } = usePullToRefresh({
    onRefresh,
    threshold: 80,
  });

  return (
    <div {...handlers} className="min-h-screen relative">
      {/* Pull indicator */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 z-50 transition-all duration-200"
        style={{ 
          top: Math.max(0, pullDistance - 40),
          opacity: pullDistance > 30 ? Math.min(1, (pullDistance - 30) / 50) : 0,
        }}
      >
        <div className={`w-10 h-10 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
      </div>
      
      {/* Content with pull transform */}
      <div 
        style={{ 
          transform: `translateY(${isRefreshing ? 40 : pullDistance * 0.3}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
