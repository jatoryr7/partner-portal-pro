import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Award, 
  Briefcase, 
  FileText, 
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Link as LinkIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateGrade } from '@/hooks/useMedicalReviews';

interface Brand360DrawerProps {
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-muted-foreground">Not scored</span>;
  
  const gradeStyles: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    B: 'bg-blue-100 text-blue-800 border-blue-300',
    C: 'bg-amber-100 text-amber-800 border-amber-300',
    D: 'bg-orange-100 text-orange-800 border-orange-300',
    F: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <Badge className={`rounded-none text-lg font-bold px-3 py-1 ${gradeStyles[grade] || ''}`}>
      Grade {grade}
    </Badge>
  );
}

export function Brand360Drawer({ brandId, isOpen, onClose }: Brand360DrawerProps) {
  // Fetch brand details with affiliate info
  const { data: brand } = useQuery({
    queryKey: ['brand-360', brandId],
    queryFn: async () => {
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', brandId)
        .maybeSingle();
      
      if (partnerError) throw partnerError;
      return partnerData;
    },
    enabled: !!brandId,
  });

  // Extract affiliate info from brand
  const affiliateLink = brand?.affiliate_link;
  const commissionRate = null; // Can be added to partners table if needed

  // Fetch medical review
  const { data: medicalReview } = useQuery({
    queryKey: ['medical-review-for-brand', brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_reviews')
        .select('*')
        .eq('partner_id', brandId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!brandId,
  });

  // Fetch active deals
  const { data: activeDeals = [] } = useQuery({
    queryKey: ['active-deals-for-brand', brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_deals')
        .select('*')
        .eq('partner_id', brandId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!brandId,
  });

  // Fetch pending creative requests
  const { data: pendingCreatives = [] } = useQuery({
    queryKey: ['pending-creatives-for-brand', brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_assets')
        .select('*')
        .eq('partner_id', brandId)
        .eq('is_complete', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!brandId,
  });

  const medicalGrade = medicalReview 
    ? calculateGrade({
        clinical: medicalReview.clinical_evidence_score,
        safety: medicalReview.safety_score,
        transparency: medicalReview.transparency_score,
      })
    : null;

  // Check if there's a high-grade brand with no active deal
  const hasHighGradeNoDeal = medicalGrade && ['A', 'B'].includes(medicalGrade) && activeDeals.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto rounded-none">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-[#1ABC9C]" />
            <div>
              <SheetTitle className="text-2xl">{brand?.company_name || 'Brand'}</SheetTitle>
              <SheetDescription>
                360° view of brand status across Medical, Sales, and Creative
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Revenue Opportunity Alert */}
          {hasHighGradeNoDeal && (
            <Card className="rounded-none border-amber-300 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-amber-900 mb-1">
                      Revenue Opportunity: High Medical Grade, No Active Deal
                    </div>
                    <p className="text-sm text-amber-800">
                      This brand scored a <strong>Grade {medicalGrade}</strong> but has no active deals. 
                      Consider reaching out to set up an affiliate link and commission structure.
                    </p>
                    {!affiliateLink && (
                      <Button 
                        size="sm" 
                        className="mt-2 rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
                        onClick={() => {
                          // TODO: Navigate to deal creation or affiliate setup
                          window.location.href = `/admin/deals?partner=${brandId}`;
                        }}
                      >
                        Create Deal & Affiliate Link
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Score Section */}
          <Card className="rounded-none border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#1ABC9C]" />
                <CardTitle className="text-lg">Medical Score</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicalReview ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Grade</span>
                    <GradeBadge grade={medicalGrade} />
                  </div>
                  {medicalReview.clinical_evidence_score && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Clinical Evidence</div>
                        <div className="font-semibold text-lg">{medicalReview.clinical_evidence_score}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Safety Profile</div>
                        <div className="font-semibold text-lg">{medicalReview.safety_score}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Transparency</div>
                        <div className="font-semibold text-lg">{medicalReview.transparency_score}/10</div>
                      </div>
                    </div>
                  )}
                  {medicalReview.status && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="rounded-none">
                        {medicalReview.status}
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No medical review on file
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Sales Deal Stage */}
          <Card className="rounded-none border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#1ABC9C]" />
                <CardTitle className="text-lg">Sales Pipeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeDeals.length > 0 ? (
                activeDeals.map((deal: any) => (
                  <div key={deal.id} className="border border-border/50 rounded-none p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{deal.deal_name}</span>
                      <Badge variant="outline" className="rounded-none">
                        {deal.deal_stage || 'Draft'}
                      </Badge>
                    </div>
                    {deal.deal_value && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">${deal.deal_value.toLocaleString()}</span>
                      </div>
                    )}
                    {deal.start_date && deal.end_date && (
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(deal.start_date), 'MMM d')} - {format(new Date(deal.end_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No active deals
                </div>
              )}
            </CardContent>
          </Card>

          {/* Affiliate Information */}
          {(affiliateLink || commissionRate) && (
            <Card className="rounded-none border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-[#1ABC9C]" />
                  <CardTitle className="text-lg">Affiliate Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {affiliateLink && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Affiliate Link</div>
                    <a 
                      href={affiliateLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#1ABC9C] hover:underline flex items-center gap-1"
                    >
                      {affiliateLink}
                      <LinkIcon className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {commissionRate && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Commission Rate</div>
                    <div className="font-semibold text-lg text-emerald-600">
                      {commissionRate}%
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pending Creative Requests */}
          <Card className="rounded-none border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1ABC9C]" />
                  <CardTitle className="text-lg">Pending Creative Requests</CardTitle>
                </div>
                {pendingCreatives.length > 0 && (
                  <Badge variant="outline" className="rounded-none bg-amber-50 text-amber-700 border-amber-300">
                    {pendingCreatives.length} Pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingCreatives.length > 0 ? (
                pendingCreatives.map((creative: any) => (
                  <div key={creative.id} className="border border-border/50 rounded-none p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">{creative.channel}</span>
                      </div>
                      <Badge variant="outline" className="rounded-none bg-amber-50 text-amber-700 border-amber-300">
                        Pending
                      </Badge>
                    </div>
                    {creative.context_instructions && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {creative.context_instructions}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Requested {format(new Date(creative.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                  <p>All creative requests complete</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
