import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface AppConfiguration {
  id: string;
  category: string;
  key: string;
  label: string;
  value: string | null;
  description: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type ConfigurationCategory = 
  | 'industries'
  | 'lead_sources'
  | 'pipeline_stages'
  | 'priority_tags'
  | 'contract_statuses'
  | 'ad_unit_types'
  | 'inventory_statuses'
  | 'placement_statuses'
  | 'campaign_stages'
  | 'priority_levels'
  | 'marketing_channels'
  | 'driver_types'
  | 'affiliate_platforms'
  | 'stakeholder_roles'
  | 'publisher_properties'
  | 'time_periods'
  | 'review_statuses'
  | 'funnel_stages';

export const CATEGORY_LABELS: Record<ConfigurationCategory, string> = {
  industries: 'Industries',
  lead_sources: 'Lead Sources',
  pipeline_stages: 'Pipeline Stages',
  priority_tags: 'Priority Tags',
  contract_statuses: 'Contract Statuses',
  ad_unit_types: 'Ad Unit Types',
  inventory_statuses: 'Inventory Statuses',
  placement_statuses: 'Placement Statuses',
  campaign_stages: 'Campaign Stages',
  priority_levels: 'Priority Levels',
  marketing_channels: 'Marketing Channels',
  driver_types: 'Driver Types',
  affiliate_platforms: 'Affiliate Platforms',
  stakeholder_roles: 'Stakeholder Roles',
  publisher_properties: 'Publisher Properties',
  time_periods: 'Time Periods',
  review_statuses: 'Review Statuses',
  funnel_stages: 'Funnel Stages',
};

export const CATEGORY_GROUPS = {
  'Sales & CRM': ['industries', 'lead_sources', 'pipeline_stages', 'funnel_stages', 'contract_statuses'],
  'Operations & Briefings': ['priority_tags', 'priority_levels', 'campaign_stages', 'review_statuses', 'stakeholder_roles'],
  'Inventory & Content': ['ad_unit_types', 'inventory_statuses', 'placement_statuses', 'marketing_channels', 'driver_types', 'affiliate_platforms', 'publisher_properties', 'time_periods'],
} as const;

// Fetch all configurations
export function useAllConfigurations() {
  return useQuery({
    queryKey: ['app-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_configurations')
        .select('*')
        .order('category')
        .order('sort_order');
      
      if (error) throw error;
      return data as AppConfiguration[];
    },
  });
}

// Fetch configurations by category
export function useConfigurationsByCategory(category: ConfigurationCategory) {
  return useQuery({
    queryKey: ['app-configurations', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_configurations')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as AppConfiguration[];
    },
  });
}

// Create configuration
export function useCreateConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: {
      category: string;
      key: string;
      label: string;
      value?: string | null;
      description?: string | null;
      color?: string | null;
      sort_order: number;
      is_active: boolean;
      metadata?: Json;
      created_by?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('app_configurations')
        .insert(config)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-configurations'] });
      toast({ title: 'Configuration added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add configuration', description: error.message, variant: 'destructive' });
    },
  });
}

// Update configuration
export function useUpdateConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      key?: string;
      label?: string;
      value?: string | null;
      description?: string | null;
      color?: string | null;
      sort_order?: number;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('app_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-configurations'] });
      toast({ title: 'Configuration updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update configuration', description: error.message, variant: 'destructive' });
    },
  });
}

// Delete configuration
export function useDeleteConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('app_configurations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-configurations'] });
      toast({ title: 'Configuration deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete configuration', description: error.message, variant: 'destructive' });
    },
  });
}

// Bulk update sort order (for drag-and-drop)
export function useReorderConfigurations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const promises = updates.map(({ id, sort_order }) =>
        supabase
          .from('app_configurations')
          .update({ sort_order })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error('Failed to reorder some items');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-configurations'] });
      toast({ title: 'Order updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to reorder', description: error.message, variant: 'destructive' });
    },
  });
}

// Bulk import configurations
export function useBulkImportConfigurations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (configs: {
      category: string;
      key: string;
      label: string;
      value?: string | null;
      description?: string | null;
      color?: string | null;
      sort_order: number;
      is_active: boolean;
    }[]) => {
      const { data, error } = await supabase
        .from('app_configurations')
        .upsert(configs, { onConflict: 'category,key' })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['app-configurations'] });
      toast({ title: `Successfully imported ${data.length} configurations` });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to import configurations', description: error.message, variant: 'destructive' });
    },
  });
}

// Helper to get options for dropdowns (matches static file format)
export function useConfigurationOptions(category: ConfigurationCategory) {
  const { data, isLoading } = useConfigurationsByCategory(category);
  
  return {
    options: data?.map(c => c.label) ?? [],
    optionsWithValues: data?.map(c => ({ label: c.label, value: c.value ?? c.key })) ?? [],
    isLoading,
  };
}
