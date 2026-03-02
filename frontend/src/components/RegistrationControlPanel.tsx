import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  CalendarIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  getRegistrationPhases, 
  updateRegistrationPhase,
  bulkUpdatePhases 
} from '@/services/api';
import { cn } from '@/lib/utils';

interface Phase {
  phase_id: number;
  phase_name: string;
  phase_label: string;
  academic_year: number;
  semester_type: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  is_enabled: boolean;
}

const RegistrationControlPanel = () => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    try {
      setIsLoading(true);
      const response = await getRegistrationPhases();
      setPhases(response.phases || []);
    } catch (error) {
      console.error('Error fetching phases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (phaseId: number, field: 'start_date' | 'end_date', date: Date | undefined) => {
    setPhases(prev => prev.map(phase => 
      phase.phase_id === phaseId 
        ? { ...phase, [field]: date ? date.toISOString() : null }
        : phase
    ));
    setHasChanges(true);
  };

  const handleToggle = (phaseId: number) => {
    setPhases(prev => prev.map(phase => 
      phase.phase_id === phaseId 
        ? { ...phase, is_enabled: !phase.is_enabled }
        : phase
    ));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await bulkUpdatePhases(phases);
      setHasChanges(false);
      await fetchPhases();
    } catch (error) {
      console.error('Error saving phases:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getPhaseStatus = (phase: Phase) => {
    if (!phase.is_enabled) return 'disabled';
    if (!phase.start_date || !phase.end_date) return 'not-configured';
    
    const now = new Date();
    const start = new Date(phase.start_date);
    const end = new Date(phase.end_date);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Upcoming</Badge>;
      case 'ended':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Ended</Badge>;
      case 'disabled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Disabled</Badge>;
      case 'not-configured':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Not Configured</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Registration Window Control</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure registration phases with start and end dates
          </p>
        </div>
        {hasChanges && (
          <Button 
            onClick={handleSaveAll} 
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner className="h-4 w-4" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Set start and end dates for each registration phase</li>
              <li>Toggle phases on/off to enable or disable them</li>
              <li>Students can only register during active phases</li>
              <li>After the freeze date, no changes are allowed</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Phases List */}
      <div className="space-y-4">
        {phases.map((phase) => {
          const status = getPhaseStatus(phase);
          
          return (
            <Card key={phase.phase_id} className="p-6">
              <div className="space-y-4">
                {/* Phase Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {phase.phase_label}
                      </h3>
                      {getStatusBadge(status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {phase.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={phase.is_enabled}
                      onCheckedChange={() => handleToggle(phase.phase_id)}
                    />
                  </div>
                </div>

                {/* Date Pickers */}
                {phase.is_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Start Date & Time
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !phase.start_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {phase.start_date ? (
                              format(new Date(phase.start_date), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={phase.start_date ? new Date(phase.start_date) : undefined}
                            onSelect={(date) => handleDateChange(phase.phase_id, 'start_date', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        End Date & Time
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !phase.end_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {phase.end_date ? (
                              format(new Date(phase.end_date), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={phase.end_date ? new Date(phase.end_date) : undefined}
                            onSelect={(date) => handleDateChange(phase.phase_id, 'end_date', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* Phase Info */}
                {phase.is_enabled && phase.start_date && phase.end_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                    <Clock className="h-4 w-4" />
                    <span>
                      Duration: {format(new Date(phase.start_date), "MMM d")} - {format(new Date(phase.end_date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Example Timeline */}
      <Card className="p-6 bg-muted/30">
        <h3 className="text-lg font-semibold text-foreground mb-4">Example Timeline</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Regular Registration</span>
            <span className="font-medium">1 Aug - 5 Aug</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Late Registration</span>
            <span className="font-medium">6 Aug - 7 Aug</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Add/Drop</span>
            <span className="font-medium">8 Aug - 12 Aug</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Withdrawal (W grade)</span>
            <span className="font-medium">till 30 Sept</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Final Lock</span>
            <span className="font-medium">After 30 Sept</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RegistrationControlPanel;
