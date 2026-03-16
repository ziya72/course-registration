import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface ModeSelectorProps {
  courseCode: string;
  registrationType: 'regular' | 'backlog' | 'improvement' | 'graduating';
  allowedModes: string[];
  selectedMode: 'A' | 'B' | 'C';
  onModeChange: (mode: 'A' | 'B' | 'C') => void;
  attemptNumber?: number;
  lastGrade?: string;
  courseType?: string;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({
  courseCode,
  registrationType,
  allowedModes,
  selectedMode,
  onModeChange,
  attemptNumber,
  lastGrade,
  courseType,
}) => {
  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'A':
        return {
          title: 'Mode A',
          subtitle: 'Full Attendance',
          description: 'Attend all classes + complete all evaluations + appear in end-semester exam',
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case 'B':
        return {
          title: 'Mode B',
          subtitle: 'Evaluations Only',
          description: 'Appear in all evaluations (attendance not required) + end-semester exam',
          icon: <Info className="h-4 w-4" />,
        };
      case 'C':
        return {
          title: 'Mode C',
          subtitle: 'Exam Only',
          description: 'Only end-semester exam (no attendance or evaluations)',
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      default:
        return {
          title: 'Unknown Mode',
          subtitle: '',
          description: '',
          icon: null,
        };
    }
  };

  const getRegistrationTypeInfo = () => {
    switch (registrationType) {
      case 'regular':
        return {
          label: 'First Attempt',
          color: 'bg-primary/10 text-primary',
        };
      case 'backlog':
        return {
          label: 'Backlog',
          color: 'bg-destructive/10 text-destructive',
        };
      case 'improvement':
        return {
          label: 'Improvement',
          color: 'bg-blue-500/10 text-blue-500',
        };
      case 'graduating':
        return {
          label: 'Graduating',
          color: 'bg-purple-500/10 text-purple-500',
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-muted text-muted-foreground',
        };
    }
  };

  const typeInfo = getRegistrationTypeInfo();

  return (
    <div className="flex items-center gap-1">
      {['A', 'B', 'C'].map((mode) => {
        const isAllowed = allowedModes.includes(mode);
        const isSelected = selectedMode === mode;
        const modeInfo = getModeDescription(mode);

        return (
          <TooltipProvider key={mode}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled={!isAllowed}
                  onClick={() => isAllowed && onModeChange(mode as 'A' | 'B' | 'C')}
                  className={`
                    px-2 py-1 rounded-md border transition-all duration-200 text-xs font-medium
                    ${isSelected 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-muted bg-background hover:border-primary/50'
                    }
                    ${!isAllowed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center gap-1">
                    <div className={`${isSelected ? 'text-primary-foreground' : 'text-primary'}`}>
                      {modeInfo.icon}
                    </div>
                    <span>{modeInfo.title}</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <div className="font-semibold">{modeInfo.title} - {modeInfo.subtitle}</div>
                  <div className="text-sm">{modeInfo.description}</div>
                  {!isAllowed && (
                    <div className="text-xs text-destructive font-medium mt-2">
                      Not available for this registration type
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

export default ModeSelector;