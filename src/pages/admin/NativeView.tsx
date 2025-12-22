import ChannelView from '@/components/admin/ChannelView';
import { AFFILIATE_PLATFORMS } from '@/types/partner';

export default function NativeView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Native Assets</h1>
        <p className="text-muted-foreground">Review affiliate platform assets and promo content</p>
      </div>
      <ChannelView
        channel="native"
        channelLabel="Native"
        filterField="affiliate_platform"
        filterOptions={[...AFFILIATE_PLATFORMS]}
      />
    </div>
  );
}
