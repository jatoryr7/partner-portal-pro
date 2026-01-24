import { useState } from 'react';
import TrackingBar from '@/components/admin/dashboard/TrackingBar';
import UnifiedSubmissions from '@/components/admin/dashboard/UnifiedSubmissions';
import SalesPipelineSheet from '@/components/admin/dashboard/SalesPipelineSheet';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Unified view of all campaigns and submissions across all channels
          </p>
        </div>
        <Button
          onClick={() => setIsPipelineOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          View Pipeline
        </Button>
      </div>

      <TrackingBar />
      <UnifiedSubmissions />

      <SalesPipelineSheet
        open={isPipelineOpen}
        onOpenChange={setIsPipelineOpen}
      />
    </div>
  );
}
