import TrackingBar from '@/components/admin/dashboard/TrackingBar';
import UnifiedSubmissions from '@/components/admin/dashboard/UnifiedSubmissions';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Command Center</h1>
        <p className="text-muted-foreground mt-1">
          Unified view of all campaigns and submissions across all channels
        </p>
      </div>

      <TrackingBar />
      <UnifiedSubmissions />
    </div>
  );
}
