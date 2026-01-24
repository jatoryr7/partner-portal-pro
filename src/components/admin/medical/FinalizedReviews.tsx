import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  FileDown,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { 
  useMedicalReviews, 
  useMarkReportGenerated,
  MedicalReview,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/hooks/useMedicalReviews';
import { useToast } from '@/hooks/use-toast';

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  
  const gradeStyles: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-800',
    B: 'bg-blue-100 text-blue-800',
    C: 'bg-amber-100 text-amber-800',
    D: 'bg-orange-100 text-orange-800',
    F: 'bg-red-100 text-red-800',
  };

  const isTopGrade = grade === 'A' || grade === 'B';

  return (
    <div className="flex items-center gap-1">
      <Badge className={`rounded-none font-bold ${gradeStyles[grade] || ''}`}>
        {grade}
      </Badge>
      {isTopGrade && (
        <Award className="h-4 w-4 text-amber-500" />
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'approved') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-600" />;
  if (status === 'requires_revision') return <RotateCcw className="h-4 w-4 text-orange-600" />;
  return null;
}

export function FinalizedReviews() {
  const { data: allReviews, isLoading } = useMedicalReviews();
  const markReportGenerated = useMarkReportGenerated();
  const { toast } = useToast();
  
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<MedicalReview | null>(null);

  // Filter to only show finalized reviews
  const reviews = allReviews?.filter(r => 
    r.status === 'approved' || r.status === 'rejected' || r.status === 'requires_revision'
  );

  const generatePDFReport = (review: MedicalReview) => {
    // Create report content
    const reportContent = `
MEDICAL STANDARDS REPORT CARD
=============================

Brand: ${review.partners?.company_name || 'Unknown'}
${review.campaign_deals ? `Deal: ${review.campaign_deals.deal_name}` : ''}
Review Date: ${format(new Date(review.medical_reviewed_at || review.updated_at), 'MMMM d, yyyy')}
Final Decision: ${STATUS_LABELS[review.status]}

SCORES
------
Clinical Evidence: ${review.clinical_evidence_score}/10
Safety Profile: ${review.safety_score}/10
Transparency: ${review.transparency_score}/10

OVERALL GRADE: ${review.overall_grade || 'N/A'}

REVENUE OPPORTUNITY
-------------------
Estimated Value: $${review.estimated_revenue?.toLocaleString() || '0'}

BD NOTES
--------
${review.bd_notes || 'No notes provided'}

MEDICAL REVIEW NOTES
--------------------
${review.medical_notes || 'No notes provided'}

CLINICAL CLAIMS
---------------
${review.clinical_claims?.length ? review.clinical_claims.map(c => `• ${c}`).join('\n') : 'None documented'}

SAFETY CONCERNS
---------------
${review.safety_concerns?.length ? review.safety_concerns.map(c => `• ${c}`).join('\n') : 'None documented'}

REQUIRED DISCLAIMERS
--------------------
${review.required_disclaimers?.length ? review.required_disclaimers.map(d => `• ${d}`).join('\n') : 'None required'}

FINAL DECISION NOTES
--------------------
${review.final_decision_notes || 'No notes provided'}

---
Report generated on ${format(new Date(), 'MMMM d, yyyy HH:mm')}
Medical Standards Review System
    `.trim();

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-report-${review.partners?.company_name?.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mark report as generated
    markReportGenerated.mutate(review.id);
    
    toast({
      title: 'Report Generated',
      description: 'Medical Standards Report Card has been downloaded.',
    });
  };

  const openDetailDialog = (review: MedicalReview) => {
    setSelectedReview(review);
    setShowDetailDialog(true);
  };

  return (
    <Card className="rounded-none border-border/50">
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <h3 className="font-semibold text-foreground">Finalized Reviews</h3>
        <p className="text-sm text-muted-foreground">Completed medical reviews and report generation</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
            <TableHead className="font-semibold">Brand</TableHead>
            <TableHead className="font-semibold">Revenue</TableHead>
            <TableHead className="font-semibold">Grade</TableHead>
            <TableHead className="font-semibold">Decision</TableHead>
            <TableHead className="font-semibold">Reviewed</TableHead>
            <TableHead className="font-semibold">Report</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Loading reviews...
              </TableCell>
            </TableRow>
          ) : reviews?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No finalized reviews yet
              </TableCell>
            </TableRow>
          ) : (
            reviews?.map((review, index) => (
              <TableRow 
                key={review.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{review.partners?.company_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {review.estimated_revenue ? (
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <DollarSign className="h-4 w-4" />
                      {review.estimated_revenue.toLocaleString()}
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <GradeBadge grade={review.overall_grade} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={review.status} />
                    <Badge className={`rounded-none ${STATUS_COLORS[review.status]}`}>
                      {STATUS_LABELS[review.status]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {review.final_decision_at 
                    ? format(new Date(review.final_decision_at), 'MMM d, yyyy')
                    : '—'}
                </TableCell>
                <TableCell>
                  {review.report_generated_at ? (
                    <span className="text-sm text-emerald-600">Generated</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Pending</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetailDialog(review)}
                      className="rounded-none"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => generatePDFReport(review)}
                      className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedReview?.partners?.company_name} - Review Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-6 py-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 border border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Grade</p>
                  <GradeBadge grade={selectedReview.overall_grade} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Opportunity</p>
                  <p className="text-lg font-bold text-emerald-600">
                    ${selectedReview.estimated_revenue?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Final Decision</p>
                  <Badge className={`rounded-none ${STATUS_COLORS[selectedReview.status]}`}>
                    {STATUS_LABELS[selectedReview.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Decision Date</p>
                  <p className="font-medium">
                    {selectedReview.final_decision_at 
                      ? format(new Date(selectedReview.final_decision_at), 'MMM d, yyyy')
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Scores */}
              <div className="space-y-2">
                <h4 className="font-semibold">Medical Scores</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">Clinical Evidence</p>
                    <p className="text-2xl font-bold text-blue-800">{selectedReview.clinical_evidence_score}/10</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium">Safety Profile</p>
                    <p className="text-2xl font-bold text-emerald-800">{selectedReview.safety_score}/10</p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium">Transparency</p>
                    <p className="text-2xl font-bold text-purple-800">{selectedReview.transparency_score}/10</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedReview.medical_notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Medical Review Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 border border-border/50">
                    {selectedReview.medical_notes}
                  </p>
                </div>
              )}

              {/* Clinical Claims */}
              {selectedReview.clinical_claims && selectedReview.clinical_claims.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Clinical Claims</h4>
                  <ul className="space-y-1">
                    {selectedReview.clinical_claims.map((claim, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-600">•</span>
                        {claim}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Concerns */}
              {selectedReview.safety_concerns && selectedReview.safety_concerns.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-600">Safety Concerns</h4>
                  <ul className="space-y-1">
                    {selectedReview.safety_concerns.map((concern, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-600">⚠</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Disclaimers */}
              {selectedReview.required_disclaimers && selectedReview.required_disclaimers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Required Disclaimers</h4>
                  <ul className="space-y-1">
                    {selectedReview.required_disclaimers.map((disclaimer, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {disclaimer}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Final Decision Notes */}
              {selectedReview.final_decision_notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Final Decision Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 border border-border/50">
                    {selectedReview.final_decision_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
