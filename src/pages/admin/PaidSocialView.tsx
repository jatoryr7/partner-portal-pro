import { useOutletContext } from 'react-router-dom';
import ChannelView from '@/components/admin/ChannelView';
import { CreativeAssetsDesk } from '@/components/admin/CreativeAssetsDesk';
import { ChannelOverviewStrip } from '@/components/admin/ChannelOverviewStrip';
import { MEDIA_PLATFORMS } from '@/types/partner';
import type { ViewRole } from '@/components/admin/SmartSelector';

interface OutletContext {
  activeViewRole: ViewRole | null;
}

export default function PaidSocialView() {
  const { activeViewRole } = useOutletContext<OutletContext>() || {};
  const showAssetsDesk = !activeViewRole || activeViewRole === 'executive' || activeViewRole === 'analyst';
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paid Social/Search Assets</h1>
        <p className="text-muted-foreground">Review media platform campaigns and tracking links</p>
      </div>
      
      {showAssetsDesk && <CreativeAssetsDesk channelFilter="paid_social_search" compact />}
      
      <ChannelView
        channel="paid_social_search"
        channelLabel="Paid Social/Search"
        filterField="media_platform"
        filterOptions={[...MEDIA_PLATFORMS]}
      />
      
      <div className="pt-6 border-t border-border">
        <ChannelOverviewStrip activeChannel="paid_social_search" />
      </div>
    </div>
  );
}
