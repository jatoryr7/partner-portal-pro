import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Building2, 
  DollarSign,
  FileText,
  Award,
  Microscope,
  AlertTriangle
} from 'lucide-react';
import { 
  useMedicalReviews, 
  useSubmitMedicalScores,
  useFinalDecision,
  MedicalReview,
  calculateGrade,
} from '@/hooks/useMedicalReviews';
import { MedicalScoringInterface } from './MedicalScoringInterface';
import { JumpToPipeline, JumpToBrands } from '@/components/admin/JumpButton';
import { Brand360Drawer } from '@/components/admin/Brand360Drawer';

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  
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

function CommercialStatusBadge({ status }: { status: 'prospect' | 'partner' | 'rejected' | null }) {
  if (!status) return <span className="text-muted-foreground text-sm">—</span>;
  
  const statusConfig = {
    prospect: { label: 'Prospect', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    partner: { label: 'Partner', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-300' },
  };
  
  const config = statusConfig[status];
  return (
    <Badge className={`rounded-none ${config.color}`}>
      {config.label}
    </Badge>
  );
}

export function EvaluationLab() {
  const { data: reviews, isLoading } = useMedicalReviews('in_medical_review');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch commercial status from deals/partners
  const { data: commercialStatuses } = useQuery({
    queryKey: ['commercial-statuses'],
    queryFn: async () => {
      const { data: deals } = await supabase
        .from('campaign_deals')
        .select('id, partner_id, deal_stage');
      
      const { data: partners } = await supabase
        .from('partners')
        .select('id, status');
      
      const statusMap: Record<string, 'prospect' | 'partner' | 'rejected'> = {};
      
      // Map deal stages to commercial status
      deals?.forEach((deal: any) => {
        if (deal.deal_stage === 'closed_won' || deal.deal_stage === 'active') {
          statusMap[deal.partner_id] = 'partner';
        } else if (deal.deal_stage === 'closed_lost' || deal.deal_stage === 'rejected') {
          statusMap[deal.partner_id] = 'rejected';
        } else {
          statusMap[deal.partner_id] = statusMap[deal.partner_id] || 'prospect';
        }
      });
      
      // Map partner status
      partners?.forEach((partner: any) => {
        if (partner.status === 'active' || partner.status === 'partner') {
          statusMap[partner.id] = 'partner';
        } else if (partner.status === 'rejected' || partner.status === 'inactive') {
          statusMap[partner.id] = 'rejected';
        } else {
          statusMap[partner.id] = statusMap[partner.id] || 'prospect';
        }
      });
      
      return statusMap;
    },
  });

  const handleBrandClick = (brandId: string) => {
    setSelectedBrandId(brandId);
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="rounded-none border-border/50">
          <div className="p-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-[#1ABC9C]" />
              <div>
                <h3 className="font-semibold text-foreground">Evaluation Lab</h3>
                <p className="text-sm text-muted-foreground">
                  A-F scoring system with commercial status integration
                </p>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                <TableHead className="font-semibold">Brand</TableHead>
                <TableHead className="font-semibold">Medical Grade</TableHead>
                <TableHead className="font-semibold">Commercial Status</TableHead>
                <TableHead className="font-semibold">Scores</TableHead>
                <TableHead className="font-semibold">Revenue</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading reviews...
                  </TableCell>
                </TableRow>
              ) : reviews?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No brands in evaluation
                  </TableCell>
                </TableRow>
              ) : (
                reviews?.map((review, index) => {
                  const commercialStatus = commercialStatuses?.[review.partner_id] || null;
                  
                  return (
                    <TableRow 
                      key={review.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span 
                              className="font-medium cursor-pointer hover:text-[#1ABC9C]"
                              onClick={() => handleBrandClick(review.partner_id)}
                            >
                              {review.partners?.company_name}
                            </span>
                            {review.campaign_deals && (
                              <p className="text-xs text-muted-foreground">{review.campaign_deals.deal_name}</p>
                            )}
                            <div className="flex gap-2 mt-1">
                              <JumpToPipeline brandId={review.partner_id} dealId={review.deal_id || undefined} />
                              <JumpToBrands brandId={review.partner_id} />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GradeBadge grade={review.overall_grade} />
                          {/* Alert for High Grade but No Deal */}
                          {review.overall_grade && ['A', 'B'].includes(review.overall_grade) && commercialStatus === 'prospect' && (
                            <Badge variant="outline" className="rounded-none bg-amber-50 text-amber-700 border-amber-300 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              No Deal
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CommercialStatusBadge status={commercialStatus} />
                      </TableCell>
                      <TableCell>
                        {review.clinical_evidence_score ? (
                          <div className="flex gap-2 text-xs">
                            <span title="Clinical Evidence">CE: {review.clinical_evidence_score}</span>
                            <span title="Safety">S: {review.safety_score}</span>
                            <span title="Transparency">T: {review.transparency_score}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not scored</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {review.estimated_revenue ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-medium">
                            <DollarSign className="h-4 w-4" />
                            ${review.estimated_revenue.toLocaleString()}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBrandClick(review.partner_id)}
                          className="rounded-none"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Scoring Interface Section - Embedded from existing component */}
        <div className="mt-6">
          <MedicalScoringInterface />
        </div>
      </div>

      {selectedBrandId && (
        <Brand360Drawer
          brandId={selectedBrandId}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedBrandId(null);
          }}
        />
      )}
    </>
  );
}
