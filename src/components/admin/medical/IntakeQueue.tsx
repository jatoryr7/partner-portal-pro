import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateMedicalReview } from '@/hooks/useMedicalReviews';
import { useToast } from '@/hooks/use-toast';
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
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  FileText,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { Brand360Drawer } from '@/components/admin/Brand360Drawer';

type SubmissionSource = 'public' | 'application' | 'internal';

interface UnifiedSubmission {
  id: string;
  brandName: string;
  source: SubmissionSource;
  submittedAt: string;
  status: string;
  hasMatch: boolean;
  matchedBrandId?: string;
  matchedBrandName?: string;
  contactEmail?: string;
  contactName?: string;
  trackerId?: string;
  url?: string;
}

export function IntakeQueue() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const createReview = useCreateMedicalReview();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch public review requests
  const { data: publicRequests = [] } = useQuery({
    queryKey: ['public-review-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_review_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch brand applications
  const { data: brandApplications = [] } = useQuery({
    queryKey: ['brand-applications-intake'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing partners/brands for matching
  const { data: existingBrands = [] } = useQuery({
    queryKey: ['partners-for-matching'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data;
    },
  });

  // Create unified submissions with match detection
  const unifiedSubmissions: UnifiedSubmission[] = [
    ...publicRequests.map((req: any) => {
      // Check for match
      const match = existingBrands.find(
        (brand: any) => brand.company_name.toLowerCase() === req.brand_name.toLowerCase()
      );
      
      return {
        id: req.id,
        brandName: req.brand_name,
        source: 'public' as SubmissionSource,
        submittedAt: req.created_at,
        status: 'pending',
        hasMatch: !!match,
        matchedBrandId: match?.id,
        matchedBrandName: match?.company_name,
        contactEmail: req.requester_email,
        contactName: req.requester_name,
        url: req.brand_url,
      };
    }),
    ...brandApplications.map((app: any) => {
      // Check for match
      const match = existingBrands.find(
        (brand: any) => brand.company_name.toLowerCase() === app.brand_name.toLowerCase()
      );
      
      return {
        id: app.id,
        brandName: app.brand_name,
        source: 'application' as SubmissionSource,
        submittedAt: app.created_at,
        status: app.status,
        hasMatch: !!match,
        matchedBrandId: match?.id,
        matchedBrandName: match?.company_name,
        contactEmail: app.contact_email,
        contactName: app.contact_name,
        trackerId: app.tracker_id,
        url: app.brand_url,
      };
    }),
  ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const getSourceBadge = (source: SubmissionSource) => {
    const configs = {
      public: { label: 'Public Tip', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      application: { label: 'Brand Application', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      internal: { label: 'Internal', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    const config = configs[source];
    return (
      <Badge className={`rounded-none ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const handleBrandClick = (brandId: string | undefined) => {
    if (brandId) {
      setSelectedBrandId(brandId);
      setIsDrawerOpen(true);
    }
  };

  const handleCreateReview = async (submission: UnifiedSubmission) => {
    if (!submission.matchedBrandId) return;
    
    try {
      await createReview.mutateAsync({ partner_id: submission.matchedBrandId });
      toast({
        title: 'Review created',
        description: `Medical review initiated for ${submission.brandName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['public-review-requests'] });
      queryClient.invalidateQueries({ queryKey: ['brand-applications-intake'] });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create medical review',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="rounded-none border-border/50">
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Unified Intake Queue</h3>
              <p className="text-sm text-muted-foreground">
                Triage submissions from all sources - Public Directory, Brand Applications, and Internal
              </p>
            </div>
            <Badge variant="outline" className="rounded-none">
              {unifiedSubmissions.length} Total
            </Badge>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
              <TableHead className="font-semibold">Brand Name</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold">Match</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Submitted</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unifiedSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No submissions in queue
                </TableCell>
              </TableRow>
            ) : (
              unifiedSubmissions.map((submission, index) => (
                <TableRow 
                  key={submission.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span 
                          className="font-medium cursor-pointer hover:text-[#1ABC9C]"
                          onClick={() => submission.matchedBrandId && handleBrandClick(submission.matchedBrandId)}
                        >
                          {submission.brandName}
                        </span>
                        {submission.url && (
                          <a 
                            href={submission.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-muted-foreground hover:text-[#1ABC9C]"
                          >
                            <ExternalLink className="h-3 w-3 inline" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getSourceBadge(submission.source)}
                  </TableCell>
                  <TableCell>
                    {submission.hasMatch ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm text-emerald-600 font-medium">
                          {submission.matchedBrandName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">No match</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.contactName ? (
                      <div className="text-sm">
                        <div className="font-medium">{submission.contactName}</div>
                        {submission.contactEmail && (
                          <div className="text-muted-foreground text-xs">{submission.contactEmail}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none">
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {submission.trackerId && (
                        <Badge variant="outline" className="rounded-none text-xs">
                          {submission.trackerId}
                        </Badge>
                      )}
                      {submission.hasMatch && (
                        <Button
                          size="sm"
                          onClick={() => handleCreateReview(submission)}
                          disabled={createReview.isPending}
                          className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create Review
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => submission.matchedBrandId && handleBrandClick(submission.matchedBrandId)}
                        disabled={!submission.matchedBrandId}
                        className="rounded-none"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
