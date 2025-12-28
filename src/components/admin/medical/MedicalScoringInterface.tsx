import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Microscope, 
  Shield, 
  Eye, 
  Building2, 
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useMedicalReviews, 
  useSubmitMedicalScores,
  useFinalDecision,
  MedicalReview,
  STATUS_LABELS,
  STATUS_COLORS,
  calculateGrade,
} from '@/hooks/useMedicalReviews';
import { JumpToPipeline, JumpToBrands } from '@/components/admin/JumpButton';

function ScoreSlider({ 
  label, 
  icon: Icon, 
  value, 
  onChange,
  color,
}: { 
  label: string; 
  icon: React.ElementType; 
  value: number; 
  onChange: (value: number) => void;
  color: string;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <span className={`text-2xl font-bold ${getScoreColor(value)}`}>{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Poor (1)</span>
        <span>Excellent (10)</span>
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  
  const gradeStyles: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    B: 'bg-blue-100 text-blue-800 border-blue-300',
    C: 'bg-amber-100 text-amber-800 border-amber-300',
    D: 'bg-orange-100 text-orange-800 border-orange-300',
    F: 'bg-red-100 text-red-800 border-red-300',
  };

  const isTopGrade = grade === 'A' || grade === 'B';

  return (
    <div className="flex items-center gap-2">
      <Badge className={`rounded-none text-lg font-bold px-3 py-1 ${gradeStyles[grade] || ''}`}>
        Grade {grade}
      </Badge>
      {isTopGrade && (
        <Award className="h-5 w-5 text-amber-500" />
      )}
    </div>
  );
}

export function MedicalScoringInterface() {
  const { data: reviews, isLoading } = useMedicalReviews('in_medical_review');
  const submitScores = useSubmitMedicalScores();
  const finalDecision = useFinalDecision();
  
  const [showScoringDialog, setShowScoringDialog] = useState(false);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<MedicalReview | null>(null);
  
  const [scores, setScores] = useState({
    clinical_evidence: 5,
    safety: 5,
    transparency: 5,
  });
  
  const [reviewDetails, setReviewDetails] = useState({
    medical_notes: '',
    clinical_claims: '',
    safety_concerns: '',
    required_disclaimers: '',
  });

  const [decisionNotes, setDecisionNotes] = useState('');

  const openScoringDialog = (review: MedicalReview) => {
    setSelectedReview(review);
    setScores({
      clinical_evidence: review.clinical_evidence_score || 5,
      safety: review.safety_score || 5,
      transparency: review.transparency_score || 5,
    });
    setReviewDetails({
      medical_notes: review.medical_notes || '',
      clinical_claims: review.clinical_claims?.join('\n') || '',
      safety_concerns: review.safety_concerns?.join('\n') || '',
      required_disclaimers: review.required_disclaimers?.join('\n') || '',
    });
    setShowScoringDialog(true);
  };

  const handleSaveScores = () => {
    if (!selectedReview) return;
    submitScores.mutate({
      id: selectedReview.id,
      clinical_evidence_score: scores.clinical_evidence,
      safety_score: scores.safety,
      transparency_score: scores.transparency,
      medical_notes: reviewDetails.medical_notes || undefined,
      clinical_claims: reviewDetails.clinical_claims.split('\n').filter(Boolean),
      safety_concerns: reviewDetails.safety_concerns.split('\n').filter(Boolean),
      required_disclaimers: reviewDetails.required_disclaimers.split('\n').filter(Boolean),
    }, {
      onSuccess: () => setShowScoringDialog(false),
    });
  };

  const openDecisionDialog = (review: MedicalReview) => {
    setSelectedReview(review);
    setDecisionNotes('');
    setShowDecisionDialog(true);
  };

  const handleDecision = (decision: 'approved' | 'rejected' | 'requires_revision') => {
    if (!selectedReview) return;
    finalDecision.mutate({
      id: selectedReview.id,
      decision,
      notes: decisionNotes || undefined,
    }, {
      onSuccess: () => setShowDecisionDialog(false),
    });
  };

  const currentGrade = calculateGrade({
    clinical: scores.clinical_evidence,
    safety: scores.safety,
    transparency: scores.transparency,
  });

  return (
    <Card className="rounded-none border-border/50">
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <Microscope className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-foreground">Medical Review Queue</h3>
            <p className="text-sm text-muted-foreground">Score and evaluate brands for medical compliance</p>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
            <TableHead className="font-semibold">Brand</TableHead>
            <TableHead className="font-semibold">Revenue Opportunity</TableHead>
            <TableHead className="font-semibold">BD Notes</TableHead>
            <TableHead className="font-semibold">Scores</TableHead>
            <TableHead className="font-semibold">Grade</TableHead>
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
                No brands in medical review
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
                    <div>
                      <span className="font-medium">{review.partners?.company_name}</span>
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
                  {review.estimated_revenue ? (
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <DollarSign className="h-4 w-4" />
                      {review.estimated_revenue.toLocaleString()}
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-sm text-muted-foreground truncate">
                    {review.bd_notes || 'No notes'}
                  </p>
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
                  <GradeBadge grade={review.overall_grade} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openScoringDialog(review)}
                      className="rounded-none"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Score
                    </Button>
                    {review.overall_grade && (
                      <Button
                        size="sm"
                        onClick={() => openDecisionDialog(review)}
                        className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
                      >
                        Decision
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Scoring Dialog */}
      <Dialog open={showScoringDialog} onOpenChange={setShowScoringDialog}>
        <DialogContent className="rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-blue-600" />
              Medical Review - {selectedReview?.partners?.company_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Score Preview */}
            <div className="flex items-center justify-between p-4 bg-muted/50 border border-border/50">
              <span className="text-sm font-medium">Current Assessment</span>
              <GradeBadge grade={currentGrade} />
            </div>

            {/* Scoring Sliders */}
            <div className="space-y-6">
              <ScoreSlider
                label="Clinical Evidence"
                icon={Microscope}
                value={scores.clinical_evidence}
                onChange={(v) => setScores({ ...scores, clinical_evidence: v })}
                color="text-blue-600"
              />
              <ScoreSlider
                label="Safety Profile"
                icon={Shield}
                value={scores.safety}
                onChange={(v) => setScores({ ...scores, safety: v })}
                color="text-emerald-600"
              />
              <ScoreSlider
                label="Transparency"
                icon={Eye}
                value={scores.transparency}
                onChange={(v) => setScores({ ...scores, transparency: v })}
                color="text-purple-600"
              />
            </div>

            {/* Review Details */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <label className="text-sm font-medium">Medical Review Notes</label>
                <Textarea
                  placeholder="General observations and recommendations..."
                  value={reviewDetails.medical_notes}
                  onChange={(e) => setReviewDetails({ ...reviewDetails, medical_notes: e.target.value })}
                  className="rounded-none min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Clinical Claims (one per line)</label>
                <Textarea
                  placeholder="List verified clinical claims..."
                  value={reviewDetails.clinical_claims}
                  onChange={(e) => setReviewDetails({ ...reviewDetails, clinical_claims: e.target.value })}
                  className="rounded-none min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Safety Concerns (one per line)
                </label>
                <Textarea
                  placeholder="List any safety concerns..."
                  value={reviewDetails.safety_concerns}
                  onChange={(e) => setReviewDetails({ ...reviewDetails, safety_concerns: e.target.value })}
                  className="rounded-none min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Required Disclaimers (one per line)</label>
                <Textarea
                  placeholder="List mandatory disclaimers..."
                  value={reviewDetails.required_disclaimers}
                  onChange={(e) => setReviewDetails({ ...reviewDetails, required_disclaimers: e.target.value })}
                  className="rounded-none min-h-[60px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScoringDialog(false)} className="rounded-none">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveScores}
              disabled={submitScores.isPending}
              className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
            >
              Save Scores
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Final Decision - {selectedReview?.partners?.company_name}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 border border-border/50">
              <div>
                <p className="text-sm text-muted-foreground">Final Grade</p>
                <GradeBadge grade={selectedReview?.overall_grade || null} />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Revenue Opportunity</p>
                <p className="text-lg font-bold text-emerald-600">
                  ${selectedReview?.estimated_revenue?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Decision Notes</label>
              <Textarea
                placeholder="Add final decision notes..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="rounded-none min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleDecision('requires_revision')}
              disabled={finalDecision.isPending}
              className="rounded-none w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Requires Revision
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleDecision('rejected')}
              disabled={finalDecision.isPending}
              className="rounded-none w-full sm:w-auto"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button 
              onClick={() => handleDecision('approved')}
              disabled={finalDecision.isPending}
              className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white w-full sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
