import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Megaphone,
  Target,
  Tv,
  Mail,
  PenTool,
  Plus,
  FileText,
  Calendar,
  Upload,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const CHANNEL_CONFIG = {
  native: { label: 'Native', icon: Megaphone },
  paid_social_search: { label: 'Paid Social', icon: Target },
  media: { label: 'Media', icon: Tv },
  newsletter: { label: 'Newsletter', icon: Mail },
  content_marketing: { label: 'Content', icon: PenTool },
};

interface CreativeAssetRequest {
  partner_id: string;
  deal_id?: string;
  channel: string;
  asset_type: 'banner' | 'video';
  specs?: string;
  due_date?: string;
  context_instructions?: string;
}

interface CreativeAssetHubProps {
  partnerId?: string;
  dealId?: string;
  channelFilter?: string;
}

export function CreativeAssetHub({ partnerId, dealId, channelFilter }: CreativeAssetHubProps) {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [requestData, setRequestData] = useState<CreativeAssetRequest>({
    partner_id: partnerId || '',
    deal_id: dealId,
    channel: channelFilter || '',
    asset_type: 'banner',
    specs: '',
    due_date: '',
    context_instructions: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-creative-requests', partnerId, dealId, channelFilter],
    queryFn: async () => {
      let query = supabase
        .from('creative_assets')
        .select(`
          *,
          partners (id, company_name),
          campaign_deals (id, deal_name)
        `)
        .eq('is_complete', false)
        .order('created_at', { ascending: false });

      if (partnerId) query = query.eq('partner_id', partnerId);
      if (dealId) query = query.eq('deal_id', dealId);
      if (channelFilter) query = query.eq('channel', channelFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch partners for selection
  const { data: partners = [] } = useQuery({
    queryKey: ['partners-for-creative'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data;
    },
    enabled: !partnerId,
  });

  // Create request mutation
  const createRequest = useMutation({
    mutationFn: async (data: CreativeAssetRequest) => {
      const { data: result, error } = await supabase
        .from('creative_assets')
        .insert({
          partner_id: data.partner_id,
          deal_id: data.deal_id || null,
          channel: data.channel,
          context_instructions: data.context_instructions || null,
          is_complete: false,
          is_draft: true,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-creative-requests'] });
      toast({
        title: 'Request Created',
        description: 'Creative asset request has been submitted.',
      });
      setShowRequestDialog(false);
      setRequestData({
        partner_id: partnerId || '',
        deal_id: dealId,
        channel: channelFilter || '',
        asset_type: 'banner',
        specs: '',
        due_date: '',
        context_instructions: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create request',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!requestData.partner_id || !requestData.channel) {
      toast({
        title: 'Validation Error',
        description: 'Please select a partner and channel',
        variant: 'destructive',
      });
      return;
    }
    createRequest.mutate(requestData);
  };

  return (
    <Card className="rounded-none border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1ABC9C]" />
            Creative Asset Hub
          </CardTitle>
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Assets
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none max-w-2xl">
              <DialogHeader>
                <DialogTitle>Request Creative Assets</DialogTitle>
                <DialogDescription>
                  Submit a structured request for creative assets with specifications and due dates
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!partnerId && (
                  <div className="space-y-2">
                    <Label>Brand/Partner</Label>
                    <Select
                      value={requestData.partner_id}
                      onValueChange={(value) => setRequestData({ ...requestData, partner_id: value })}
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue placeholder="Select a brand..." />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner: any) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select
                    value={requestData.channel}
                    onValueChange={(value) => setRequestData({ ...requestData, channel: value })}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Select channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANNEL_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select
                    value={requestData.asset_type}
                    onValueChange={(value: 'banner' | 'video') => setRequestData({ ...requestData, asset_type: value })}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Specifications (Auto-filled from Inventory)</Label>
                  <Textarea
                    value={requestData.specs}
                    onChange={(e) => setRequestData({ ...requestData, specs: e.target.value })}
                    placeholder="Dimensions, file size, format requirements..."
                    className="rounded-none min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={requestData.due_date}
                    onChange={(e) => setRequestData({ ...requestData, due_date: e.target.value })}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Context/Placement Instructions</Label>
                  <Textarea
                    value={requestData.context_instructions}
                    onChange={(e) => setRequestData({ ...requestData, context_instructions: e.target.value })}
                    placeholder="Describe where these assets should be used..."
                    className="rounded-none min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRequestDialog(false)}
                  className="rounded-none"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createRequest.isPending}
                  className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {pendingRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingRequests.map((request: any) => {
              const channelConfig = CHANNEL_CONFIG[request.channel as keyof typeof CHANNEL_CONFIG];
              const Icon = channelConfig?.icon || FileText;
              
              return (
                <div key={request.id} className="border border-border/50 rounded-none p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[#1ABC9C]" />
                      <span className="font-medium">
                        {channelConfig?.label || request.channel}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        • {request.partners?.company_name}
                      </span>
                    </div>
                    <Badge variant="outline" className="rounded-none bg-amber-50 text-amber-700 border-amber-300">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  {request.context_instructions && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.context_instructions}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Requested {format(new Date(request.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
            <p>No pending creative requests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
