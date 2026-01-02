import { useOutletContext } from 'react-router-dom';
import ChannelView from '@/components/admin/ChannelView';
import { CreativeAssetsDesk } from '@/components/admin/CreativeAssetsDesk';
import { ChannelOverviewStrip } from '@/components/admin/ChannelOverviewStrip';
import type { ViewRole } from '@/components/admin/SmartSelector';

interface OutletContext {
  activeViewRole: ViewRole | null;
}

export default function ContentMarketingView() {
  const { activeViewRole } = useOutletContext<OutletContext>() || {};
  const showAssetsDesk = !activeViewRole || activeViewRole === 'executive' || activeViewRole === 'analyst';
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Marketing Assets</h1>
        <p className="text-muted-foreground">Review content marketing assets and context instructions</p>
      </div>
      
      {showAssetsDesk && <CreativeAssetsDesk channelFilter="content_marketing" compact />}
      
      <ChannelView channel="content_marketing" channelLabel="Content Marketing" />
      
      <div className="pt-6 border-t border-border">
        <ChannelOverviewStrip activeChannel="content_marketing" />
      </div>
    </div>
  );
}
