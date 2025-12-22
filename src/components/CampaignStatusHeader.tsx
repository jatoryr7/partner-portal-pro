import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Flag, CheckCircle2, Clock, Rocket, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CampaignPriority, CampaignStage, STAGE_LABELS, STAGE_ORDER, PRIORITY_COLORS } from '@/types/campaign';

interface CampaignStatusHeaderProps {
  priority: CampaignPriority;
  stage: CampaignStage;
  launchDate: Date | null;
  nextMeetingDate: Date | null;
  conclusionDate: Date | null;
  isAdmin?: boolean;
  onPriorityChange?: (priority: CampaignPriority) => void;
  onStageChange?: (stage: CampaignStage) => void;
}

const STAGE_ICONS: Record<CampaignStage, React.ElementType> = {
  asset_collection: Clock,
  internal_review: CheckCircle2,
  live: Rocket,
  concluded: Trophy,
};

export default function CampaignStatusHeader({
  priority,
  stage,
  launchDate,
  nextMeetingDate,
  conclusionDate,
  isAdmin = false,
  onPriorityChange,
  onStageChange,
}: CampaignStatusHeaderProps) {
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const progressPercentage = ((stageIndex + 1) / STAGE_ORDER.length) * 100;
  const priorityStyle = PRIORITY_COLORS[priority];

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-4">
      {/* Priority & Stage Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Flag className="w-5 h-5 text-muted-foreground" />
          {isAdmin ? (
            <Select value={priority} onValueChange={(v) => onPriorityChange?.(v as CampaignPriority)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    High
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    Medium
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    Low
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className={`${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {(() => {
            const StageIcon = STAGE_ICONS[stage];
            return <StageIcon className="w-5 h-5 text-primary" />;
          })()}
          {isAdmin ? (
            <Select value={stage} onValueChange={(v) => onStageChange?.(v as CampaignStage)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm font-medium text-foreground">{STAGE_LABELS[stage]}</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {STAGE_ORDER.map((s, i) => (
            <span key={s} className={i <= stageIndex ? 'text-primary font-medium' : ''}>
              {STAGE_LABELS[s]}
            </span>
          ))}
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Events Feed */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
        {launchDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Launch:</span>
            <span className="font-medium">{format(launchDate, 'MMM d, yyyy')}</span>
          </div>
        )}
        {nextMeetingDate && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-muted-foreground">Next Meeting:</span>
            <span className="font-medium">{format(nextMeetingDate, 'MMM d, yyyy h:mm a')}</span>
          </div>
        )}
        {conclusionDate && (
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-success" />
            <span className="text-muted-foreground">Conclusion:</span>
            <span className="font-medium">{format(conclusionDate, 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
