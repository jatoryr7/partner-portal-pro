import { useState, DragEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Handshake, 
  Trophy,
  XCircle,
  DollarSign,
  Mail,
  Building2,
  GripVertical,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/config/inputOptions';

type PipelineStage = 'prospecting' | 'initial_pitch' | 'negotiation' | 'contract_sent' | 'closed_won' | 'closed_lost';

interface Prospect {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  industry: string | null;
  estimated_deal_value: number | null;
  stage: PipelineStage;
  notes: string | null;
  source: string | null;
  assigned_to: string | null;
  created_by: string;
  stage_updated_at: string;
  created_at: string;
  updated_at: string;
}

interface PipelineKanbanProps {
  prospects: Prospect[];
  onStageChange: (id: string, stage: PipelineStage) => void;
  isLoading?: boolean;
}

// Simplified 4-stage flow as requested: Prospecting → Qualified → Negotiation → Won
const SIMPLIFIED_STAGES: { key: PipelineStage; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'prospecting', label: 'Prospecting', icon: Search, color: 'border-muted-foreground/30 bg-muted/30' },
  { key: 'initial_pitch', label: 'Qualified', icon: Target, color: 'border-primary/30 bg-primary/5' },
  { key: 'negotiation', label: 'Negotiation', icon: Handshake, color: 'border-warning/30 bg-warning/5' },
  { key: 'closed_won', label: 'Won', icon: Trophy, color: 'border-success/30 bg-success/5' },
];

// Map legacy stages to simplified flow
const STAGE_MAP: Record<PipelineStage, PipelineStage> = {
  prospecting: 'prospecting',
  initial_pitch: 'initial_pitch',
  negotiation: 'negotiation',
  contract_sent: 'negotiation', // Map contract_sent to negotiation
  closed_won: 'closed_won',
  closed_lost: 'closed_won', // Show lost deals in won column with different badge
};

export function PipelineKanban({ prospects, onStageChange, isLoading }: PipelineKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, stage: PipelineStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id && draggedId) {
      const prospect = prospects.find(p => p.id === id);
      if (prospect && prospect.stage !== stage) {
        onStageChange(id, stage);
      }
    }
    setDraggedId(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStage(null);
  };

  const getProspectsByStage = (stage: PipelineStage) => {
    return prospects.filter(p => {
      // Handle mapping for simplified flow
      if (stage === 'negotiation') {
        return p.stage === 'negotiation' || p.stage === 'contract_sent';
      }
      if (stage === 'closed_won') {
        return p.stage === 'closed_won' || p.stage === 'closed_lost';
      }
      return p.stage === stage;
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTimeSinceUpdate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {SIMPLIFIED_STAGES.map((stage) => (
          <div key={stage.key} className="space-y-3">
            <div className="h-10 bg-muted rounded-none animate-pulse" />
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-none animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 min-h-[600px]">
      {SIMPLIFIED_STAGES.map((stage) => {
        const stageProspects = getProspectsByStage(stage.key);
        const stageValue = stageProspects.reduce((sum, p) => sum + (p.estimated_deal_value || 0), 0);
        const Icon = stage.icon;

        return (
          <div
            key={stage.key}
            className={cn(
              "flex flex-col rounded-none border transition-colors",
              stage.color,
              dragOverStage === stage.key && "border-primary ring-2 ring-primary/20"
            )}
            onDragOver={(e) => handleDragOver(e, stage.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            {/* Column Header */}
            <div className="p-3 border-b bg-surface rounded-none">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm tracking-wide">{stage.label}</span>
                <Badge variant="secondary" className="ml-auto text-xs rounded-none">
                  {stageProspects.length}
                </Badge>
              </div>
              {stageValue > 0 && (
                <p className="text-xs text-muted-foreground font-medium">
                  {formatCurrency(stageValue)}
                </p>
              )}
            </div>

            {/* Cards Container */}
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
                {stageProspects.map((prospect) => (
                  <Card
                    key={prospect.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, prospect.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "cursor-grab active:cursor-grabbing hover:shadow-md transition-all rounded-none border",
                      draggedId === prospect.id && "opacity-50 scale-95",
                      prospect.stage === 'closed_lost' && "border-critical/30 bg-critical/5"
                    )}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {prospect.company_name}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{prospect.contact_name}</span>
                          </div>
                        </div>
                        {prospect.stage === 'closed_lost' && (
                          <XCircle className="w-4 h-4 text-critical flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{prospect.contact_email}</span>
                      </div>

                      {prospect.estimated_deal_value && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-success" />
                          <span className="text-sm font-medium text-success">
                            {formatCurrency(prospect.estimated_deal_value)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        {prospect.source && (
                          <Badge variant="outline" className="text-xs rounded-none">
                            {prospect.source}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {getTimeSinceUpdate(prospect.stage_updated_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {stageProspects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No prospects
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
