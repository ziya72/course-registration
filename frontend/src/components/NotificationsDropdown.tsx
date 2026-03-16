import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Info, CheckCircle, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const notifications = [
  { id: 1, message: 'Registration window opens in 3 days', type: 'info', time: '2 hours ago' },
  { id: 2, message: 'New course CS501 added to catalog', type: 'new', time: '1 day ago' },
  { id: 3, message: 'Your prerequisite for CS401 is verified', type: 'success', time: '2 days ago' },
];

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'new':
        return <Sparkles className="h-4 w-4 text-secondary" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`rounded-full ${isMobile ? 'h-7 w-7' : 'h-8 w-8 sm:h-9 sm:w-9'} p-0 relative border-border/50 hover:bg-muted/50 transition-all duration-200`}
        >
          <Bell className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
          {notifications.length > 0 && (
            <Badge className={`absolute -top-1 -right-1 ${isMobile ? 'h-4 w-4 text-[9px]' : 'h-4 w-4 sm:h-5 sm:w-5 text-[10px]'} p-0 flex items-center justify-center bg-destructive text-destructive-foreground border-2 border-background rounded-full`}>
              {notifications.length > 99 ? '99+' : notifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={`${isMobile ? 'w-72' : 'w-80'} p-0 rounded-2xl bg-background/95 backdrop-blur-xl border border-border/50`}
        align="end"
        sideOffset={8}
      >
        <div className={`${isMobile ? 'p-3' : 'p-4'} border-b border-border`}>
          <div className="flex items-center justify-between">
            <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-foreground`}>Notifications</h3>
            <Badge variant="secondary" className={`${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {notifications.length} new
            </Badge>
          </div>
        </div>
        <div className={`${isMobile ? 'max-h-64' : 'max-h-80'} overflow-y-auto`}>
          {notifications.length > 0 ? (
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} space-y-1`}>
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`flex items-start gap-3 ${isMobile ? 'p-2.5' : 'p-3'} rounded-xl hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98]`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-foreground leading-tight`}>{notif.message}</p>
                    <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground mt-1`}>{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${isMobile ? 'p-6' : 'p-8'} text-center`}>
              <Bell className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-muted-foreground mx-auto mb-2 opacity-50`} />
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>No notifications</p>
            </div>
          )}
        </div>
        <div className={`${isMobile ? 'p-2.5' : 'p-3'} border-t border-border`}>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full ${isMobile ? 'text-xs h-8' : 'text-sm h-9'} hover:bg-muted/50`}
            onClick={() => setOpen(false)}
          >
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
