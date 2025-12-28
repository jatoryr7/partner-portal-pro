import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import CampaignStatusHeader from '@/components/CampaignStatusHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  LogOut, 
  Plus, 
  FileText, 
  AlertCircle, 
  ArrowLeft, 
  Eye, 
  ArrowLeftRight,
  Briefcase,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Target,
  Download,
  BookOpen,
  Newspaper,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  FileDown
} from 'lucide-react';
import { CampaignStage, CampaignPriority } from '@/types/campaign';
import { format, differenceInDays } from 'date-fns';

type ContractStatus = 'draft' | 'signed' | 'expired';

interface PartnerSubmission {
  id: string;
  company_name: string;
  submission_date: string;
  target_launch_date: string | null;
  campaign_status?: {
    priority: CampaignPriority;
    stage: CampaignStage;
    next_meeting_date: string | null;
    campaign_conclusion_date: string | null;
  };
  revision_count: number;
}

interface Deal {
  id: string;
  deal_name: string;
  deal_value: number | null;
  contract_status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export default function PartnerDashboard() {
  const [submissions, setSubmissions] = useState<PartnerSubmission[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, role, roles, setActiveRole, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true' && role === 'admin';

  // Fetch partner's deals
  const { data: deals = [] } = useQuery({
    queryKey: ['partner-deals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get the partner IDs for this user
      const { data: partners } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id);

      if (!partners?.length) return [];

      const partnerIds = partners.map(p => p.id);
      
      const { data, error } = await supabase
        .from('campaign_deals')
        .select('*')
        .in('partner_id', partnerIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!user,
  });

  // Fetch partner's assets count
  const { data: assetStats } = useQuery({
    queryKey: ['partner-asset-stats', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, approved: 0, pending: 0 };
      
      const { data: partners } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id);

      if (!partners?.length) return { total: 0, approved: 0, pending: 0 };

      const partnerIds = partners.map(p => p.id);
      
      const { data: assets } = await supabase
        .from('creative_assets')
        .select('id, is_complete')
        .in('partner_id', partnerIds);

      const total = assets?.length || 0;
      const approved = assets?.filter(a => a.is_complete).length || 0;
      
      return { total, approved, pending: total - approved };
    },
    enabled: !!user,
  });

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;

    const { data: partners, error } = await supabase
      .from('partners')
      .select(`
        id,
        company_name,
        submission_date,
        target_launch_date,
        campaign_status (
          priority,
          stage,
          next_meeting_date,
          campaign_conclusion_date
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading submissions',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      const submissionsWithRevisions = await Promise.all(
        (partners || []).map(async (partner) => {
          const { count } = await supabase
            .from('creative_assets')
            .select('asset_feedback!inner(status)', { count: 'exact', head: true })
            .eq('partner_id', partner.id)
            .eq('asset_feedback.status', 'needs_revision');

          return {
            ...partner,
            campaign_status: Array.isArray(partner.campaign_status) 
              ? partner.campaign_status[0] 
              : partner.campaign_status,
            revision_count: count || 0,
          };
        })
      );
      setSubmissions(submissionsWithRevisions);
    }
    setLoading(false);
  };

  const handleStartNew = () => {
    setShowWizard(true);
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    fetchSubmissions();
    toast({
      title: 'Submission saved!',
      description: 'Your creative assets have been submitted for review.',
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'signed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const activeDeals = deals.filter(d => d.contract_status === 'signed');
  const totalDealValue = deals.reduce((acc, d) => acc + (d.deal_value || 0), 0);

  if (showWizard) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
          <h1 className="font-semibold text-foreground">New Submission</h1>
          <Button variant="ghost" onClick={() => setShowWizard(false)}>
            Cancel
          </Button>
        </header>
        <OnboardingWizard onComplete={handleWizardComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Preview Banner */}
      {isPreviewMode && (
        <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Preview Mode - Viewing as Partner</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>
      )}
      
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-semibold text-foreground">Partner Command Center</h1>
        </div>
        {!isPreviewMode && (
          <div className="flex items-center gap-2">
            {roles.includes('admin') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveRole('admin');
                  navigate('/admin');
                }}
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Switch to Admin
              </Button>
            )}
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </header>

      <main className="container max-w-6xl py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back!</h2>
            <p className="text-muted-foreground">Here's an overview of your partnership activity</p>
          </div>
          <Button onClick={handleStartNew} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Submission
          </Button>
        </div>

        {/* Performance Snapshot */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Performance Snapshot
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4" />
                  Clicks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">—</div>
                <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">—</div>
                <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-500">—</div>
                <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Asset Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{assetStats?.approved || 0}/{assetStats?.total || 0}</div>
                <Progress 
                  value={assetStats?.total ? (assetStats.approved / assetStats.total) * 100 : 0} 
                  className="mt-2 h-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">Assets approved</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Deals Section */}
          <section className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Active Deals
            </h3>
            {deals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium">No active deals yet</p>
                  <p className="text-sm">Your campaign deals will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {deals.slice(0, 4).map((deal) => {
                  const daysRemaining = deal.end_date 
                    ? differenceInDays(new Date(deal.end_date), new Date())
                    : null;

                  return (
                    <Card key={deal.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{deal.deal_name}</h4>
                              <Badge variant="outline" className={getStatusColor(deal.contract_status)}>
                                {deal.contract_status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                {formatCurrency(deal.deal_value)}
                              </span>
                              {deal.start_date && deal.end_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {format(new Date(deal.start_date), 'MMM d')} - {format(new Date(deal.end_date), 'MMM d, yyyy')}
                                </span>
                              )}
                              {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30 && (
                                <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {daysRemaining} days left
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {deals.length > 4 && (
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    View all {deals.length} deals
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* Resource Center */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Resource Center
            </h3>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Downloads</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-3" disabled>
                      <FileDown className="w-4 h-4 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Brand Guidelines</p>
                        <p className="text-xs text-muted-foreground">PDF • Coming soon</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3" disabled>
                      <FileDown className="w-4 h-4 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Logo Package</p>
                        <p className="text-xs text-muted-foreground">ZIP • Coming soon</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3" disabled>
                      <FileDown className="w-4 h-4 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Media Kit</p>
                        <p className="text-xs text-muted-foreground">PDF • Coming soon</p>
                      </div>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Latest News</h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start gap-2">
                        <Newspaper className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Q1 2025 Campaign Guidelines</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Updated submission requirements for the new quarter</p>
                          <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start gap-2">
                        <Newspaper className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">New Asset Upload Features</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Drag-and-drop and bulk upload now available</p>
                          <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Submissions Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Your Submissions
            </h3>
            <Button variant="outline" size="sm" onClick={handleStartNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Submission
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first creative asset submission
                </p>
                <Button onClick={handleStartNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Submission
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{submission.company_name}</CardTitle>
                      {submission.revision_count > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {submission.revision_count} revision{submission.revision_count > 1 ? 's' : ''} needed
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submission.campaign_status && (
                      <CampaignStatusHeader
                        priority={submission.campaign_status.priority}
                        stage={submission.campaign_status.stage}
                        launchDate={submission.target_launch_date ? new Date(submission.target_launch_date) : null}
                        nextMeetingDate={submission.campaign_status.next_meeting_date ? new Date(submission.campaign_status.next_meeting_date) : null}
                        conclusionDate={submission.campaign_status.campaign_conclusion_date ? new Date(submission.campaign_status.campaign_conclusion_date) : null}
                      />
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {submission.revision_count > 0 && (
                        <Button size="sm" variant="destructive">
                          Address Revisions
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
