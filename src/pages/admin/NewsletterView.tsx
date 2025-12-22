import ChannelView from '@/components/admin/ChannelView';

export default function NewsletterView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Newsletter Assets</h1>
        <p className="text-muted-foreground">Review newsletter placement assets and context instructions</p>
      </div>
      <ChannelView
        channel="newsletter"
        channelLabel="Newsletter"
      />
    </div>
  );
}
