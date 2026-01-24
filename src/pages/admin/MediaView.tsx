import { useOutletContext } from 'react-router-dom';
import ChannelView from '@/components/admin/ChannelView';
import { CreativeAssetsDesk } from '@/components/admin/CreativeAssetsDesk';
import { ChannelOverviewStrip } from '@/components/admin/ChannelOverviewStrip';
import type { ViewRole } from '@/components/admin/SmartSelector';

interface OutletContext {
  activeViewRole: ViewRole | null;
}

export default function MediaView() {
  const { activeViewRole } = useOutletContext<OutletContext>() || {};
  const showAssetsDesk = !activeViewRole || activeViewRole === 'executive' || activeViewRole === 'analyst';
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Media Assets</h1>
        <p className="text-muted-foreground">Review media placement assets and context instructions</p>
      </div>
      
      {showAssetsDesk && <CreativeAssetsDesk channelFilter="media" compact />}
      
      <ChannelView channel="media" channelLabel="Media" />
      
      <div className="pt-6 border-t border-border">
        <ChannelOverviewStrip activeChannel="media" />
      </div>
    </div>
  );
}
