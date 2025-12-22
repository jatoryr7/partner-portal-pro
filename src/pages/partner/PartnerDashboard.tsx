import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import CampaignStatusHeader from '@/components/CampaignStatusHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, FileText, AlertCircle } from 'lucide-react';
import { CampaignStage, CampaignPriority } from '@/types/campaign';

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

export default function PartnerDashboard() {
  const [submissions, setSubmissions] = useState<PartnerSubmission[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      // Get revision counts
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

  if (showWizard) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
          <h1 className="font-semibold text-foreground">New Submission</h1>
          <Button variant="ghost" onClick={() => setShowWizard(false)}>
            Cancel
          </Button>
        </header>
        <OnboardingWizard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
        <h1 className="font-semibold text-foreground">Partner Portal</h1>
        <Button variant="ghost" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      <main className="container max-w-5xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Submissions</h2>
            <p className="text-muted-foreground">Manage your creative asset submissions</p>
          </div>
          <Button onClick={handleStartNew}>
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
          <div className="space-y-4">
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
      </main>
    </div>
  );
}
