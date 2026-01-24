import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Building2, 
  Package, 
  Palette, 
  Users, 
  Calendar,
  Check,
  X,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { REVIEW_STEPS, type ReviewStatus, type ReviewStepId } from '@/types/campaign';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AssetGallery } from '@/components/admin/AssetGallery';
import { CopyReviewPane } from '@/components/admin/CopyReviewPane';

interface PartnerSubmission {
  id: string;
  companyName: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  secondaryContactName: string | null;
  secondaryContactEmail: string | null;
  targetLaunchDate: string | null;
  submissionDate: string;
}

interface CreativeAsset {
  id: string;
  channel: string;
  fileUrls: string[];
  copyText: string | null;
  affiliateLink: string | null;
  isComplete: boolean;
}

interface Stakeholder {
  id: string;
  name: string;
  email: string;
  role: string | null;
  phone: string | null;
}

interface StepReview {
  id: string;
  stepName: string;
  status: ReviewStatus;
  internalComments: string | null;
  updatedAt: Date;
}

export default function SubmissionReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partner, setPartner] = useState<PartnerSubmission | null>(null);
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [reviews, setReviews] = useState<Map<string, StepReview>>(new Map());
  
  // Revision dialog state
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');
  const [revisionStepId, setRevisionStepId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSubmissionData();
    }
  }, [id]);

  const fetchSubmissionData = async () => {
    try {
      // Fetch campaign status to get partner_id
      const { data: statusData, error: statusError } = await supabase
        .from('campaign_status')
        .select('partner_id')
        .eq('id', id)
        .single();

      if (statusError) throw statusError;

      const partnerId = statusData.partner_id;

      // Fetch all data in parallel
      const [partnerRes, assetsRes, stakeholdersRes, reviewsRes] = await Promise.all([
        supabase.from('partners').select('*').eq('id', partnerId).single(),
        supabase.from('creative_assets').select('*').eq('partner_id', partnerId),
        supabase.from('stakeholders').select('*').eq('partner_id', partnerId),
        supabase.from('admin_reviews').select('*').eq('campaign_id', id),
      ]);

      if (partnerRes.error) throw partnerRes.error;

      setPartner({
        id: partnerRes.data.id,
        companyName: partnerRes.data.company_name,
        primaryContactName: partnerRes.data.primary_contact_name,
        primaryContactEmail: partnerRes.data.primary_contact_email,
        secondaryContactName: partnerRes.data.secondary_contact_name,
        secondaryContactEmail: partnerRes.data.secondary_contact_email,
        targetLaunchDate: partnerRes.data.target_launch_date,
        submissionDate: partnerRes.data.submission_date,
      });

      setAssets((assetsRes.data || []).map(a => ({
        id: a.id,
        channel: a.channel,
        fileUrls: a.file_urls || [],
        copyText: a.copy_text,
        affiliateLink: a.affiliate_link,
        isComplete: a.is_complete,
      })));

      setStakeholders((stakeholdersRes.data || []).map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        phone: s.phone,
      })));

      const reviewMap = new Map<string, StepReview>();
      (reviewsRes.data || []).forEach(r => {
        reviewMap.set(r.step_name, {
          id: r.id,
          stepName: r.step_name,
          status: r.status as ReviewStatus,
          internalComments: r.internal_comments,
          updatedAt: new Date(r.updated_at),
        });
      });
      setReviews(reviewMap);

    } catch (error) {
      console.error('Error fetching submission:', error);
      toast({
        title: 'Error loading submission',
        description: 'Failed to fetch submission data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (stepId: string) => {
    setSaving(true);
    try {
      const existingReview = reviews.get(stepId);
      
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('admin_reviews')
          .update({ 
            status: 'approved',
            internal_comments: null,
            reviewed_by: user?.id 
          })
          .eq('id', existingReview.id);
        
        if (error) throw error;
      } else {
        // Create new review
        const { error } = await supabase
          .from('admin_reviews')
          .insert({
            campaign_id: id,
            step_name: stepId,
            status: 'approved',
            reviewed_by: user?.id,
          });
        
        if (error) throw error;
      }

      // Update local state
      setReviews(prev => {
        const newMap = new Map(prev);
        newMap.set(stepId, {
          id: existingReview?.id || '',
          stepName: stepId,
          status: 'approved',
          internalComments: null,
          updatedAt: new Date(),
        });
        return newMap;
      });

      toast({ title: 'Step approved successfully' });
    } catch (error) {
      console.error('Error approving step:', error);
      toast({
        title: 'Error approving step',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openRevisionDialog = (stepId: string) => {
    setRevisionStepId(stepId);
    setRevisionComment('');
    setRevisionDialogOpen(true);
  };

  const handleRequestRevision = async () => {
    if (!revisionStepId || !revisionComment.trim()) return;
    
    setSaving(true);
    try {
      const existingReview = reviews.get(revisionStepId);
      
      if (existingReview) {
        const { error } = await supabase
          .from('admin_reviews')
          .update({ 
            status: 'revision_requested',
            internal_comments: revisionComment,
            reviewed_by: user?.id 
          })
          .eq('id', existingReview.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_reviews')
          .insert({
            campaign_id: id,
            step_name: revisionStepId,
            status: 'revision_requested',
            internal_comments: revisionComment,
            reviewed_by: user?.id,
          });
        
        if (error) throw error;
      }

      setReviews(prev => {
        const newMap = new Map(prev);
        newMap.set(revisionStepId, {
          id: existingReview?.id || '',
          stepName: revisionStepId,
          status: 'revision_requested',
          internalComments: revisionComment,
          updatedAt: new Date(),
        });
        return newMap;
      });

      toast({ 
        title: 'Revision requested', 
        description: 'Partner will be notified of required changes' 
      });
      setRevisionDialogOpen(false);
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast({
        title: 'Error requesting revision',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStepStatus = (stepId: string): ReviewStatus => {
    return reviews.get(stepId)?.status || 'pending';
  };

  const getStatusIcon = (status: ReviewStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'revision_requested':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/30">Approved</Badge>;
      case 'revision_requested':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Revision Requested</Badge>;
      default:
        return <Badge variant="outline">Pending Review</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Submission not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/queue')}>
          Back to Queue
        </Button>
      </div>
    );
  }

  const stepIcons = [Building2, Package, Palette, Users, Calendar];
  const currentStepData = REVIEW_STEPS[currentStep];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/queue')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{partner.companyName}</h1>
          <p className="text-muted-foreground">
            Submitted {format(new Date(partner.submissionDate), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {REVIEW_STEPS.map((step, idx) => {
            const status = getStepStatus(step.id);
            return (
              <div key={step.id} className="flex items-center">
                {getStatusIcon(status)}
                {idx < REVIEW_STEPS.length - 1 && (
                  <div className={cn(
                    "w-6 h-0.5 mx-1",
                    status === 'approved' ? 'bg-success' : 'bg-border'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Step Navigation */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Review Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {REVIEW_STEPS.map((step, index) => {
                const Icon = stepIcons[index];
                const status = getStepStatus(step.id);
                const isActive = currentStep === index;

                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium">{step.title}</span>
                    {!isActive && getStatusIcon(status)}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Step Content */}
        <div className="col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                      {(() => {
                        const Icon = stepIcons[currentStep];
                        return <Icon className="w-5 h-5 text-primary-foreground" />;
                      })()}
                    </div>
                    <div>
                      <CardTitle>{currentStepData.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">Review submission details</p>
                    </div>
                  </div>
                  {getStatusBadge(getStepStatus(currentStepData.id))}
                </CardHeader>
                
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {/* Step 1: Company Info */}
                    {currentStep === 0 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Company Name</p>
                            <p className="font-medium">{partner.companyName}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Target Launch Date</p>
                            <p className="font-medium">
                              {partner.targetLaunchDate 
                                ? format(new Date(partner.targetLaunchDate), 'MMM d, yyyy')
                                : 'Not specified'}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Primary Contact</p>
                            <p className="font-medium">{partner.primaryContactName || 'Not provided'}</p>
                            <p className="text-sm text-muted-foreground">{partner.primaryContactEmail}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Secondary Contact</p>
                            <p className="font-medium">{partner.secondaryContactName || 'Not provided'}</p>
                            <p className="text-sm text-muted-foreground">{partner.secondaryContactEmail || ''}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Channels */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Selected channels for this campaign:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[...new Set(assets.map(a => a.channel))].map(channel => (
                            <Badge key={channel} variant="secondary" className="text-sm">
                              {channel}
                            </Badge>
                          ))}
                          {assets.length === 0 && (
                            <p className="text-muted-foreground italic">No channels selected</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Creative Assets - Optimized for Content Teams */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <Tabs defaultValue="gallery" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="gallery" className="flex items-center gap-2">
                              <Palette className="w-4 h-4" />
                              Visual Gallery
                            </TabsTrigger>
                            <TabsTrigger value="copy" className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Copy Review
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="gallery" className="mt-0">
                            <AssetGallery assets={assets} />
                          </TabsContent>

                          <TabsContent value="copy" className="mt-0">
                            <CopyReviewPane 
                              assets={assets} 
                              campaignId={id || ''} 
                            />
                          </TabsContent>
                        </Tabs>

                        {/* Asset Summary */}
                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-foreground">{assets.length}</p>
                            <p className="text-xs text-muted-foreground">Total Assets</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-foreground">
                              {assets.filter(a => a.isComplete).length}
                            </p>
                            <p className="text-xs text-muted-foreground">Complete</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-foreground">
                              {[...new Set(assets.map(a => a.channel))].length}
                            </p>
                            <p className="text-xs text-muted-foreground">Channels</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Stakeholders */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        {stakeholders.length === 0 ? (
                          <p className="text-muted-foreground italic">No stakeholders added</p>
                        ) : (
                          stakeholders.map(stakeholder => (
                            <div key={stakeholder.id} className="p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{stakeholder.name}</p>
                                {stakeholder.role && (
                                  <Badge variant="outline">{stakeholder.role}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{stakeholder.email}</p>
                              {stakeholder.phone && (
                                <p className="text-sm text-muted-foreground">{stakeholder.phone}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Step 5: Summary */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Assets</p>
                            <p className="text-2xl font-bold">{assets.length}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Stakeholders</p>
                            <p className="text-2xl font-bold">{stakeholders.length}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Channels</p>
                            <p className="text-2xl font-bold">
                              {[...new Set(assets.map(a => a.channel))].length}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Completion Rate</p>
                            <p className="text-2xl font-bold">
                              {assets.length > 0 
                                ? Math.round((assets.filter(a => a.isComplete).length / assets.length) * 100)
                                : 0}%
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-medium mb-2">Review Progress</h4>
                          <div className="space-y-2">
                            {REVIEW_STEPS.map(step => {
                              const status = getStepStatus(step.id);
                              const review = reviews.get(step.id);
                              return (
                                <div key={step.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                  <span className="text-sm">{step.title}</span>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(status)}
                                    {review?.internalComments && (
                                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Revision Comments Display */}
                  {reviews.get(currentStepData.id)?.internalComments && (
                    <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Revision Notes</span>
                      </div>
                      <p className="text-sm">{reviews.get(currentStepData.id)?.internalComments}</p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep(prev => prev - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={currentStep === REVIEW_STEPS.length - 1}
                        onClick={() => setCurrentStep(prev => prev + 1)}
                      >
                        Next
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => openRevisionDialog(currentStepData.id)}
                        disabled={saving}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Request Revision
                      </Button>
                      <Button
                        className="bg-success hover:bg-success/90"
                        onClick={() => handleApprove(currentStepData.id)}
                        disabled={saving || getStepStatus(currentStepData.id) === 'approved'}
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        {getStepStatus(currentStepData.id) === 'approved' ? 'Approved' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Provide feedback for the partner. This will be visible on their dashboard.
            </p>
            <Textarea
              placeholder="Describe the changes needed..."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRequestRevision}
              disabled={!revisionComment.trim() || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}