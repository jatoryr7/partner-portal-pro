import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types for the billables system
export interface MasterBrand {
  id: string;
  name: string;
  common_id: string;
  created_at: string;
  updated_at: string;
}

export interface NetworkBrandMapping {
  id: string;
  master_brand_id: string;
  network: string;
  network_brand_name: string;
  network_brand_id: string | null;
  created_at: string;
}

export interface MonthlyBillable {
  id: string;
  master_brand_id: string;
  billing_month: string;
  network: string;
  conversions: number;
  gross_revenue: number;
  network_reported_payout: number;
  internal_tracked_payout: number;
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  dispute_status: string | null;
  dispute_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetworkApiStatus {
  id: string;
  network: string;
  is_connected: boolean;
  last_sync_at: string | null;
  last_error: string | null;
  updated_at: string;
}

export interface AggregatedBillable {
  masterBrandId: string;
  masterBrandName: string;
  commonId: string;
  networks: string[];
  totalConversions: number;
  totalGrossRevenue: number;
  totalNetworkPayout: number;
  totalInternalPayout: number;
  delta: number;
  deltaPercent: number;
  hasDiscrepancy: boolean;
  isApproved: boolean;
  billableRecords: MonthlyBillable[];
}

// Fetch API status for all networks
export function useNetworkApiStatus() {
  return useQuery({
    queryKey: ['network-api-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_api_status')
        .select('*')
        .order('network');
      
      if (error) throw error;
      return data as NetworkApiStatus[];
    },
  });
}

// Fetch master brands with their mappings
export function useMasterBrands() {
  return useQuery({
    queryKey: ['master-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as MasterBrand[];
    },
  });
}

// Fetch aggregated billables for a specific month
export function useAggregatedBillables(billingMonth: string) {
  return useQuery({
    queryKey: ['aggregated-billables', billingMonth],
    queryFn: async () => {
      // Fetch all billables for the month
      const { data: billables, error: billablesError } = await supabase
        .from('monthly_billables')
        .select('*')
        .eq('billing_month', billingMonth);
      
      if (billablesError) throw billablesError;

      // Fetch all master brands
      const { data: brands, error: brandsError } = await supabase
        .from('master_brands')
        .select('*');
      
      if (brandsError) throw brandsError;

      // Aggregate by master brand
      const brandMap = new Map<string, AggregatedBillable>();

      for (const brand of (brands as MasterBrand[])) {
        const brandBillables = (billables as MonthlyBillable[]).filter(
          b => b.master_brand_id === brand.id
        );

        if (brandBillables.length === 0) continue;

        const totalConversions = brandBillables.reduce((sum, b) => sum + b.conversions, 0);
        const totalGrossRevenue = brandBillables.reduce((sum, b) => sum + Number(b.gross_revenue), 0);
        const totalNetworkPayout = brandBillables.reduce((sum, b) => sum + Number(b.network_reported_payout), 0);
        const totalInternalPayout = brandBillables.reduce((sum, b) => sum + Number(b.internal_tracked_payout), 0);
        const delta = totalNetworkPayout - totalInternalPayout;
        const deltaPercent = totalInternalPayout > 0 ? (delta / totalInternalPayout) * 100 : 0;
        const networks = [...new Set(brandBillables.map(b => b.network))];
        const isApproved = brandBillables.every(b => b.is_approved);

        brandMap.set(brand.id, {
          masterBrandId: brand.id,
          masterBrandName: brand.name,
          commonId: brand.common_id,
          networks,
          totalConversions,
          totalGrossRevenue,
          totalNetworkPayout,
          totalInternalPayout,
          delta,
          deltaPercent,
          hasDiscrepancy: Math.abs(deltaPercent) > 5,
          isApproved,
          billableRecords: brandBillables,
        });
      }

      return Array.from(brandMap.values()).sort((a, b) => 
        a.masterBrandName.localeCompare(b.masterBrandName)
      );
    },
  });
}

// Approve billables for a brand
export function useApproveBillables() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      masterBrandId, 
      billingMonth,
      approvedBy 
    }: { 
      masterBrandId: string; 
      billingMonth: string;
      approvedBy: string;
    }) => {
      const { error } = await supabase
        .from('monthly_billables')
        .update({
          is_approved: true,
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq('master_brand_id', masterBrandId)
        .eq('billing_month', billingMonth);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aggregated-billables'] });
      toast({ title: 'Billables approved for billing' });
    },
    onError: (error) => {
      toast({ title: 'Error approving billables', description: error.message, variant: 'destructive' });
    },
  });
}

// Initiate dispute
export function useInitiateDispute() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      masterBrandId, 
      billingMonth,
      notes 
    }: { 
      masterBrandId: string; 
      billingMonth: string;
      notes: string;
    }) => {
      const { error } = await supabase
        .from('monthly_billables')
        .update({
          dispute_status: 'initiated',
          dispute_notes: notes,
        })
        .eq('master_brand_id', masterBrandId)
        .eq('billing_month', billingMonth);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aggregated-billables'] });
      toast({ title: 'Dispute initiated', description: 'The accounting team has been notified.' });
    },
    onError: (error) => {
      toast({ title: 'Error initiating dispute', description: error.message, variant: 'destructive' });
    },
  });
}

// Create master brand with mappings
export function useCreateMasterBrand() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      name, 
      commonId,
      mappings 
    }: { 
      name: string; 
      commonId: string;
      mappings: { network: string; networkBrandName: string }[];
    }) => {
      // Create master brand
      const { data: brand, error: brandError } = await supabase
        .from('master_brands')
        .insert({ name, common_id: commonId })
        .select()
        .single();

      if (brandError) throw brandError;

      // Create mappings
      if (mappings.length > 0) {
        const { error: mappingsError } = await supabase
          .from('network_brand_mappings')
          .insert(
            mappings.map(m => ({
              master_brand_id: brand.id,
              network: m.network,
              network_brand_name: m.networkBrandName,
            }))
          );

        if (mappingsError) throw mappingsError;
      }

      return brand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-brands'] });
      toast({ title: 'Master brand created' });
    },
    onError: (error) => {
      toast({ title: 'Error creating brand', description: error.message, variant: 'destructive' });
    },
  });
}

// Calculate summary metrics
export function useBillablesSummary(billingMonth: string) {
  const { data: billables, isLoading } = useAggregatedBillables(billingMonth);

  const summary = {
    totalVerified: 0,
    totalPending: 0,
    highVarianceCount: 0,
    netProfit: 0,
  };

  if (billables) {
    for (const b of billables) {
      if (b.isApproved) {
        summary.totalVerified += b.totalNetworkPayout;
      } else {
        summary.totalPending += b.totalNetworkPayout;
      }
      if (b.hasDiscrepancy) {
        summary.highVarianceCount++;
      }
      summary.netProfit += b.totalGrossRevenue - b.totalNetworkPayout;
    }
  }

  return { summary, isLoading };
}
