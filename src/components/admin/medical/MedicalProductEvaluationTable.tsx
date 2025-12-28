import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
  TableRow,
} from '@/components/ui/table';
import {
  ExternalLink,
  ChevronDown,
  Award,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Save,
} from 'lucide-react';
import { useMedicalReviews, MedicalReview, useSubmitMedicalScores } from '@/hooks/useMedicalReviews';
import { useToast } from '@/hooks/use-toast';

// IOTP Fixes Options
const IOTP_FIXES = [
  { id: 'ingredient_transparency', label: 'Ingredient Transparency', description: 'Full disclosure of active/inactive ingredients' },
  { id: 'clinical_study_validation', label: 'Clinical Study Validation', description: 'Peer-reviewed study citations required' },
  { id: 'label_compliance', label: 'Label Compliance', description: 'FDA/FTC label regulation adherence' },
  { id: 'dosage_clarity', label: 'Dosage Clarity', description: 'Clear dosage instructions and warnings' },
  { id: 'contraindications', label: 'Contraindications Listed', description: 'Drug interactions and warnings documented' },
  { id: 'manufacturing_standards', label: 'Manufacturing Standards', description: 'GMP certification or equivalent' },
  { id: 'third_party_testing', label: 'Third-Party Testing', description: 'Independent lab verification' },
];

type ReviewStatus = 'pending' | 'in_review' | 'iotp_issued' | 'approved';

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground', icon: Clock },
  in_review: { label: 'In-Review', color: 'bg-[hsl(var(--pulse-blue-light))] text-[hsl(var(--pulse-blue))]', icon: FileText },
  iotp_issued: { label: 'IOTP-Issued', color: 'bg-[hsl(var(--amber-alert-light))] text-[hsl(var(--amber-alert))]', icon: AlertTriangle },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
};

interface IOTPState {
  selectedFixes: string[];
  customRationale: string;
}

export function MedicalProductEvaluationTable() {
  const { data: allReviews, isLoading } = useMedicalReviews();
  const submitScores = useSubmitMedicalScores();
  const { toast } = useToast();
  
  const [iotpState, setIotpState] = useState<Record<string, IOTPState>>({});
  const [showIOTPDialog, setShowIOTPDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<MedicalReview | null>(null);

  // Map database status to UI status
  const mapToUIStatus = (status: string): ReviewStatus => {
    switch (status) {
      case 'pending_bd_approval': return 'pending';
      case 'in_medical_review': return 'in_review';
      case 'requires_revision': return 'iotp_issued';
      case 'approved': return 'approved';
      default: return 'pending';
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'BR';
  };

  const openIOTPDialog = (review: MedicalReview) => {
    setSelectedReview(review);
    // Initialize state if not exists
    if (!iotpState[review.id]) {
      setIotpState(prev => ({
        ...prev,
        [review.id]: {
          selectedFixes: review.required_disclaimers || [],
          customRationale: review.medical_notes || '',
        },
      }));
    }
    setShowIOTPDialog(true);
  };

  const toggleFix = (reviewId: string, fixId: string) => {
    setIotpState(prev => {
      const current = prev[reviewId] || { selectedFixes: [], customRationale: '' };
      const selected = current.selectedFixes.includes(fixId)
        ? current.selectedFixes.filter(f => f !== fixId)
        : [...current.selectedFixes, fixId];
      return { ...prev, [reviewId]: { ...current, selectedFixes: selected } };
    });
  };

  const updateRationale = (reviewId: string, rationale: string) => {
    setIotpState(prev => {
      const current = prev[reviewId] || { selectedFixes: [], customRationale: '' };
      return { ...prev, [reviewId]: { ...current, customRationale: rationale } };
    });
  };

  const saveIOTPNotes = () => {
    if (!selectedReview) return;
    const state = iotpState[selectedReview.id];
    
    submitScores.mutate({
      id: selectedReview.id,
      clinical_evidence_score: selectedReview.clinical_evidence_score || 5,
      safety_score: selectedReview.safety_score || 5,
      transparency_score: selectedReview.transparency_score || 5,
      medical_notes: state?.customRationale,
      required_disclaimers: state?.selectedFixes || [],
      clinical_claims: selectedReview.clinical_claims || [],
      safety_concerns: selectedReview.safety_concerns || [],
    }, {
      onSuccess: () => {
        toast({ title: 'IOTP Notes Saved', description: 'Medical standards notes have been updated.' });
        setShowIOTPDialog(false);
      },
    });
  };

  const StatusBadge = ({ status }: { status: ReviewStatus }) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge className={`rounded-none gap-1.5 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const GradeBadge = ({ grade }: { grade: string | null }) => {
    if (!grade) return <span className="text-muted-foreground text-sm">—</span>;
    
    const isTopGrade = grade === 'A' || grade === 'B';
    const gradeColors: Record<string, string> = {
      A: 'bg-emerald-100 text-emerald-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-amber-100 text-amber-800',
      D: 'bg-orange-100 text-orange-800',
      F: 'bg-red-100 text-red-800',
    };

    return (
      <div className="flex items-center gap-2">
        <Badge className={`rounded-none font-bold ${gradeColors[grade] || ''}`}>
          {grade}
        </Badge>
        {isTopGrade && <Award className="h-4 w-4 text-amber-500" />}
      </div>
    );
  };

  return (
    <Card className="rounded-none border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[hsl(var(--medical-slate))] text-[hsl(var(--medical-slate-foreground))]">
        <h3 className="font-semibold">Product Evaluation</h3>
        <p className="text-sm opacity-75">Medical standards compliance review</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-[hsl(210,20%,98%)] hover:bg-[hsl(210,20%,98%)]">
            <TableHead className="font-semibold text-[hsl(var(--medical-slate))]">Brand</TableHead>
            <TableHead className="font-semibold text-[hsl(var(--medical-slate))]">Clinical Abstract</TableHead>
            <TableHead className="font-semibold text-[hsl(var(--medical-slate))]">Est. Revenue</TableHead>
            <TableHead className="font-semibold text-[hsl(var(--medical-slate))]">Grade</TableHead>
            <TableHead className="font-semibold text-[hsl(var(--medical-slate))]">Status</TableHead>
            <TableHead className="font-semibold text-[hsl(var(--medical-slate))] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Loading products...
              </TableCell>
            </TableRow>
          ) : allReviews?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No products under review
              </TableCell>
            </TableRow>
          ) : (
            allReviews?.map((review, index) => {
              const uiStatus = mapToUIStatus(review.status);
              const state = iotpState[review.id];
              
              return (
                <TableRow
                  key={review.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-[hsl(210,20%,98%)]'}
                >
                  {/* Brand Logo & Name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-none border border-border/50">
                        <AvatarImage src="" alt={review.partners?.company_name} />
                        <AvatarFallback className="rounded-none bg-primary/10 text-primary text-sm font-semibold">
                          {getInitials(review.partners?.company_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.partners?.company_name}</p>
                        {review.campaign_deals?.deal_name && (
                          <p className="text-xs text-muted-foreground">{review.campaign_deals.deal_name}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Clinical Abstract */}
                  <TableCell className="max-w-[250px]">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.bd_notes || review.medical_notes || 'No clinical abstract provided'}
                    </p>
                    {review.clinical_claims && review.clinical_claims.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {review.clinical_claims.slice(0, 2).map((claim, i) => (
                          <Badge key={i} variant="outline" className="rounded-none text-xs">
                            {claim.slice(0, 20)}...
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>

                  {/* Revenue */}
                  <TableCell>
                    {review.estimated_revenue ? (
                      <span className="font-medium text-emerald-600">
                        ${review.estimated_revenue.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Grade */}
                  <TableCell>
                    <GradeBadge grade={review.overall_grade} />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge status={uiStatus} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Medical Standards Notes Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-none gap-1.5"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Medical Notes
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 rounded-none bg-white z-50">
                          <DropdownMenuLabel className="text-[hsl(var(--medical-slate))]">
                            Medical Standards Notes
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {/* IOTP Requirements Section */}
                          <div className="p-3">
                            <p className="text-xs font-semibold text-[hsl(var(--amber-alert))] mb-2 flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              IOTP Requirements
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {IOTP_FIXES.slice(0, 4).map((fix) => (
                                <label key={fix.id} className="flex items-start gap-2 cursor-pointer group">
                                  <Checkbox
                                    checked={state?.selectedFixes?.includes(fix.id) || review.required_disclaimers?.includes(fix.id)}
                                    onCheckedChange={() => toggleFix(review.id, fix.id)}
                                    className="rounded-none mt-0.5"
                                  />
                                  <div>
                                    <span className="text-sm font-medium group-hover:text-primary">
                                      {fix.label}
                                    </span>
                                  </div>
                                </label>
                              ))}
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto mt-2 text-[hsl(var(--pulse-blue))]"
                              onClick={() => openIOTPDialog(review)}
                            >
                              View All Requirements →
                            </Button>
                          </div>

                          <DropdownMenuSeparator />
                          
                          {/* Quick Notes */}
                          <div className="p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              Quick Notes
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {state?.customRationale || review.medical_notes || 'No custom rationale added'}
                            </p>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* External Link */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none text-[hsl(var(--pulse-blue))]"
                        onClick={() => window.open('#', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* IOTP Full Dialog */}
      <Dialog open={showIOTPDialog} onOpenChange={setShowIOTPDialog}>
        <DialogContent className="rounded-none max-w-lg">
          <DialogHeader className="bg-[hsl(var(--medical-slate))] -m-6 mb-0 p-4 text-[hsl(var(--medical-slate-foreground))]">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--amber-alert))]" />
              IOTP Requirements - {selectedReview?.partners?.company_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Fixes Checklist */}
            <div>
              <p className="text-sm font-semibold mb-3">In-Order-To-Pass Fixes</p>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {IOTP_FIXES.map((fix) => (
                  <label key={fix.id} className="flex items-start gap-3 p-2 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={selectedReview ? iotpState[selectedReview.id]?.selectedFixes?.includes(fix.id) : false}
                      onCheckedChange={() => selectedReview && toggleFix(selectedReview.id, fix.id)}
                      className="rounded-none mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium">{fix.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{fix.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Rationale */}
            <div>
              <p className="text-sm font-semibold mb-2">Custom Medical Rationale</p>
              <Textarea
                placeholder="Provide specific feedback to the brand team..."
                value={selectedReview ? iotpState[selectedReview.id]?.customRationale || '' : ''}
                onChange={(e) => selectedReview && updateRationale(selectedReview.id, e.target.value)}
                className="rounded-none min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowIOTPDialog(false)} className="rounded-none">
              Cancel
            </Button>
            <Button
              onClick={saveIOTPNotes}
              disabled={submitScores.isPending}
              className="rounded-none bg-[hsl(185,65%,42%)] hover:bg-[hsl(175,60%,40%)] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
