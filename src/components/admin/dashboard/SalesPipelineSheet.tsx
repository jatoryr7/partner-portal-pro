import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STAGE_LABELS, STAGE_ORDER, type CampaignStage } from '@/types/campaign';
import { cn } from '@/lib/utils';

interface PipelinePartner {
  id: string;
  company_name: string;
  target_launch_date: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  campaign_status: {
    stage: string;
    priority: string;
    next_meeting_date: string | null;
  } | null;
}

interface SalesPipelineSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SalesPipelineSheet({ open, onOpenChange }: SalesPipelineSheetProps) {
  const { data: partnersByStage, isLoading, error } = useQuery({
    queryKey: ['sales-pipeline'],
    queryFn: async () => {
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select(`
          id,
          company_name,
          target_launch_date,
          primary_contact_name,
          primary_contact_email,
          campaign_status (
            stage,
            priority,
            next_meeting_date
          )
        `)
        .order('created_at', { ascending: false });

      if (partnersError) throw partnersError;

      // Group partners by stage
      const grouped = new Map<CampaignStage, PipelinePartner[]>();
      
      STAGE_ORDER.forEach((stage) => {
        grouped.set(stage, []);
      });

      partners?.forEach((partner: any) => {
        const stage = (partner.campaign_status?.stage || 'asset_collection') as CampaignStage;
        const stageList = grouped.get(stage);
        if (stageList) {
          stageList.push(partner);
        }
      });

      return grouped;
    },
  });

  const getPriorityBadge = (priority: string | null | undefined) => {
    if (!priority) return <Badge variant="outline">Medium</Badge>;
    
    const priorityConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      high: { label: 'High', variant: 'destructive' },
      medium: { label: 'Medium', variant: 'secondary' },
      low: { label: 'Low', variant: 'outline' },
    };

    const config = priorityConfig[priority] || { label: priority, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (error) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Sales Pipeline</SheetTitle>
            <SheetDescription>
              View all partners organized by campaign stage
            </SheetDescription>
          </SheetHeader>
          <div className="text-center py-8 text-destructive">
            Error loading pipeline data. Please try again.
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sales Pipeline</SheetTitle>
          <SheetDescription>
            View all partners organized by campaign stage
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {STAGE_ORDER.map((stage) => (
                <div key={stage} className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ))}
            </div>
          ) : (
            STAGE_ORDER.map((stage) => {
              const partners = partnersByStage?.get(stage) || [];
              const stageLabel = STAGE_LABELS[stage];

              return (
                <div key={stage} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      {stageLabel}
                    </h3>
                    <Badge variant="secondary" className="ml-2">
                      {partners.length} {partners.length === 1 ? 'partner' : 'partners'}
                    </Badge>
                  </div>

                  {partners.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
                      No partners in {stageLabel}
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Launch Date</TableHead>
                            <TableHead>Next Meeting</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partners.map((partner) => {
                            const launchDate = partner.target_launch_date
                              ? new Date(partner.target_launch_date)
                              : null;
                            const nextMeeting = partner.campaign_status?.next_meeting_date
                              ? new Date(partner.campaign_status.next_meeting_date)
                              : null;

                            return (
                              <TableRow key={partner.id}>
                                <TableCell className="font-medium">
                                  {partner.company_name}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-0.5">
                                    {partner.primary_contact_name && (
                                      <div className="text-sm font-medium">
                                        {partner.primary_contact_name}
                                      </div>
                                    )}
                                    {partner.primary_contact_email && (
                                      <div className="text-xs text-muted-foreground">
                                        {partner.primary_contact_email}
                                      </div>
                                    )}
                                    {!partner.primary_contact_name && !partner.primary_contact_email && (
                                      <span className="text-xs text-muted-foreground">No contact</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getPriorityBadge(partner.campaign_status?.priority)}
                                </TableCell>
                                <TableCell>
                                  {launchDate ? (
                                    <span className="text-sm">
                                      {format(launchDate, 'MMM d, yyyy')}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Not set</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {nextMeeting ? (
                                    <span className="text-sm">
                                      {format(nextMeeting, 'MMM d, yyyy')}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Not scheduled</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
