import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Plus, CheckCircle, Building2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { 
  useMedicalReviews, 
  useCreateMedicalReview,
  useApproveBD,
  MedicalReview,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/hooks/useMedicalReviews';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function SubmissionQueue() {
  const { data: reviews, isLoading } = useMedicalReviews('pending_bd_approval');
  const createReview = useCreateMedicalReview();
  const approveBD = useApproveBD();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<MedicalReview | null>(null);
  
  const [newReview, setNewReview] = useState({
    partner_id: '',
    deal_id: '',
    estimated_revenue: '',
  });
  
  const [approvalData, setApprovalData] = useState({
    notes: '',
    estimated_revenue: '',
  });

  // Fetch partners for the add dialog
  const { data: partners } = useQuery({
    queryKey: ['partners-for-medical'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch deals for the selected partner
  const { data: deals } = useQuery({
    queryKey: ['deals-for-partner', newReview.partner_id],
    queryFn: async () => {
      if (!newReview.partner_id) return [];
      const { data, error } = await supabase
        .from('campaign_deals')
        .select('id, deal_name, deal_value')
        .eq('partner_id', newReview.partner_id)
        .order('deal_name');
      if (error) throw error;
      return data;
    },
    enabled: !!newReview.partner_id,
  });

  const handleAddSubmission = () => {
    createReview.mutate({
      partner_id: newReview.partner_id,
      deal_id: newReview.deal_id || undefined,
      estimated_revenue: newReview.estimated_revenue ? parseFloat(newReview.estimated_revenue) : undefined,
    }, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewReview({ partner_id: '', deal_id: '', estimated_revenue: '' });
      },
    });
  };

  const handleApproveBD = () => {
    if (!selectedReview) return;
    approveBD.mutate({
      id: selectedReview.id,
      notes: approvalData.notes || undefined,
      estimated_revenue: approvalData.estimated_revenue ? parseFloat(approvalData.estimated_revenue) : undefined,
    }, {
      onSuccess: () => {
        setShowApproveDialog(false);
        setSelectedReview(null);
        setApprovalData({ notes: '', estimated_revenue: '' });
      },
    });
  };

  const openApproveDialog = (review: MedicalReview) => {
    setSelectedReview(review);
    setApprovalData({
      notes: '',
      estimated_revenue: review.estimated_revenue?.toString() || '',
    });
    setShowApproveDialog(true);
  };

  return (
    <Card className="rounded-none border-border/50">
      <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
        <div>
          <h3 className="font-semibold text-foreground">Submission Queue</h3>
          <p className="text-sm text-muted-foreground">New brands awaiting BD approval</p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
            <TableHead className="font-semibold">Brand</TableHead>
            <TableHead className="font-semibold">Deal</TableHead>
            <TableHead className="font-semibold">Est. Revenue</TableHead>
            <TableHead className="font-semibold">Submitted</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Loading submissions...
              </TableCell>
            </TableRow>
          ) : reviews?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No pending submissions
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
                  {review.campaign_deals?.deal_name || '—'}
                </TableCell>
                <TableCell>
                  {review.estimated_revenue ? (
                    <span className="text-emerald-600 font-medium">
                      ${review.estimated_revenue.toLocaleString()}
                    </span>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge className={`rounded-none ${STATUS_COLORS[review.status]}`}>
                    {STATUS_LABELS[review.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => openApproveDialog(review)}
                    className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add Brand Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Add Brand to Review Queue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Brand</label>
              <Select
                value={newReview.partner_id}
                onValueChange={(value) => setNewReview({ ...newReview, partner_id: value, deal_id: '' })}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Choose a brand..." />
                </SelectTrigger>
                <SelectContent>
                  {partners?.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newReview.partner_id && deals && deals.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Associated Deal (Optional)</label>
                <Select
                  value={newReview.deal_id}
                  onValueChange={(value) => setNewReview({ ...newReview, deal_id: value })}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Select a deal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.deal_name} {deal.deal_value ? `($${deal.deal_value.toLocaleString()})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Revenue</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0"
                  value={newReview.estimated_revenue}
                  onChange={(e) => setNewReview({ ...newReview, estimated_revenue: e.target.value })}
                  className="rounded-none pl-9"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-none">
              Cancel
            </Button>
            <Button 
              onClick={handleAddSubmission}
              disabled={!newReview.partner_id || createReview.isPending}
              className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
            >
              Add to Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BD Approval Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>BD Approval - {selectedReview?.partners?.company_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Revenue</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0"
                  value={approvalData.estimated_revenue}
                  onChange={(e) => setApprovalData({ ...approvalData, estimated_revenue: e.target.value })}
                  className="rounded-none pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">BD Notes</label>
              <Textarea
                placeholder="Add any notes for the medical review team..."
                value={approvalData.notes}
                onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                className="rounded-none min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} className="rounded-none">
              Cancel
            </Button>
            <Button 
              onClick={handleApproveBD}
              disabled={approveBD.isPending}
              className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
            >
              Approve & Send to Medical
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
