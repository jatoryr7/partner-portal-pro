import ChannelView from '@/components/admin/ChannelView';

export default function MediaView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Media Assets</h1>
        <p className="text-muted-foreground">Review media placement assets and context instructions</p>
      </div>
      <ChannelView
        channel="media"
        channelLabel="Media"
      />
    </div>
  );
}
