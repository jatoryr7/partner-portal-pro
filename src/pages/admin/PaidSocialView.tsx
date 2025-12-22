import ChannelView from '@/components/admin/ChannelView';
import { MEDIA_PLATFORMS } from '@/types/partner';

export default function PaidSocialView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paid Social/Search Assets</h1>
        <p className="text-muted-foreground">Review media platform campaigns and tracking links</p>
      </div>
      <ChannelView
        channel="paid_social_search"
        channelLabel="Paid Social/Search"
        filterField="media_platform"
        filterOptions={[...MEDIA_PLATFORMS]}
      />
    </div>
  );
}
