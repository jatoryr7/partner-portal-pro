import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Building2,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ActivityFeed } from '../ActivityFeed';

export function MarketingDashboard() {
  const { data: partners } = useQuery({
    queryKey: ['partners-marketing-view'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          campaign_status (
            stage,
            priority
          ),
          creative_assets (
            id,
            is_complete,
            channel
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const { data: reviewStats } = useQuery({
    queryKey: ['review-stats-marketing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_reviews')
        .select('status');

      if (error) throw error;

      const pending = data.filter((r) => r.status === 'pending').length;
      const approved = data.filter((r) => r.status === 'approved').length;
      const revisions = data.filter((r) => r.status === 'revision_requested').length;

      return { pending, approved, revisions, total: data.length };
    },
  });

  const getStageColor = (stage: string | undefined) => {
    switch (stage) {
      case 'intake':
        return 'bg-blue-500/10 text-blue-500';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-500';
      case 'review':
        return 'bg-purple-500/10 text-purple-500';
      case 'approved':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalAssets = partners?.reduce((acc, p) => acc + (p.creative_assets?.length || 0), 0) || 0;
  const completeAssets = partners?.reduce(
    (acc, p) => acc + (p.creative_assets?.filter((a: any) => a.is_complete).length || 0),
    0
  ) || 0;
  const completionRate = totalAssets > 0 ? Math.round((completeAssets / totalAssets) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Marketing / Affiliate View</h2>
        <p className="text-muted-foreground">Partner health and creative review dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewStats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewStats?.approved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Partner Health Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Partner Health Overview</CardTitle>
            <CardDescription>Recent partner activity and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {partners?.slice(0, 5).map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(partner.company_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{partner.company_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={getStageColor(partner.campaign_status?.stage)}>
                          {partner.campaign_status?.stage?.replace('_', ' ') || 'No status'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {partner.creative_assets?.length || 0} assets
                        </span>
                      </div>
                    </div>
                  </div>
                  <ActivityFeed partnerId={partner.id} compact />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets Needing Attention</CardTitle>
            <CardDescription>Incomplete or pending review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partners
                ?.flatMap((p) =>
                  (p.creative_assets || [])
                    .filter((a: any) => !a.is_complete)
                    .map((a: any) => ({ ...a, company_name: p.company_name }))
                )
                .slice(0, 6)
                .map((asset: any) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{asset.company_name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {asset.channel}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      In Progress
                    </Badge>
                  </div>
                ))}
              {partners?.every((p) => p.creative_assets?.every((a: any) => a.is_complete)) && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>All assets are complete!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
