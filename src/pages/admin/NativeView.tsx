import { useOutletContext } from 'react-router-dom';
import ChannelView from '@/components/admin/ChannelView';
import { CreativeAssetsDesk } from '@/components/admin/CreativeAssetsDesk';
import { ChannelOverviewStrip } from '@/components/admin/ChannelOverviewStrip';
import { AFFILIATE_PLATFORMS } from '@/types/partner';
import type { ViewRole } from '@/components/admin/SmartSelector';

interface OutletContext {
  activeViewRole: ViewRole | null;
}

export default function NativeView() {
  const { activeViewRole } = useOutletContext<OutletContext>() || {};
  
  // Show compact assets desk for all roles except when deeply filtered
  const showAssetsDesk = !activeViewRole || activeViewRole === 'executive' || activeViewRole === 'analyst';
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Native Assets</h1>
        <p className="text-muted-foreground">Review affiliate platform assets and promo content</p>
      </div>
      
      {/* Creative Assets Desk - Resurfaced at top */}
      {showAssetsDesk && (
        <CreativeAssetsDesk channelFilter="native" compact />
      )}
      
      <ChannelView
        channel="native"
        channelLabel="Native"
        filterField="affiliate_platform"
        filterOptions={[...AFFILIATE_PLATFORMS]}
      />
      
      {/* Channel Overview Strip - Resurfaced at bottom */}
      <div className="pt-6 border-t border-border">
        <ChannelOverviewStrip activeChannel="native" />
      </div>
    </div>
  );
}
