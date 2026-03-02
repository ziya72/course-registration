import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Info, CheckCircle, Sparkles } from 'lucide-react';

const notifications = [
  { id: 1, message: 'Registration window opens in 3 days', type: 'info', time: '2 hours ago' },
  { id: 2, message: 'New course CS501 added to catalog', type: 'new', time: '1 day ago' },
  { id: 3, message: 'Your prerequisite for CS401 is verified', type: 'success', time: '2 days ago' },
];

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);

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
          className="rounded-full h-8 w-8 sm:h-9 sm:w-9 p-0 relative"
        >
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px]">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 rounded-2xl" 
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Notifications</h3>
            <Badge variant="secondary" className="text-xs">
              {notifications.length} new
            </Badge>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="p-2 space-y-1">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full text-sm">
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
