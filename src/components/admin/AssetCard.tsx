import { useState } from 'react';
import { format } from 'date-fns';
import { Check, X, Copy, Download, MessageSquare, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FeedbackStatus } from '@/types/campaign';

interface AssetCardProps {
  id: string;
  partnerName: string;
  channel: string;
  affiliateLink?: string;
  affiliatePlatform?: string;
  driverTypes?: string[];
  promoCopy?: string;
  contextInstructions?: string;
  mediaPlatform?: string;
  fileUrls: string[];
  feedbackStatus: FeedbackStatus;
  feedbackComments?: string;
  createdAt: Date;
  onFeedbackChange: (assetId: string, status: FeedbackStatus, comments?: string) => void;
}

export default function AssetCard({
  id,
  partnerName,
  channel,
  affiliateLink,
  affiliatePlatform,
  driverTypes,
  promoCopy,
  contextInstructions,
  mediaPlatform,
  fileUrls,
  feedbackStatus,
  feedbackComments,
  createdAt,
  onFeedbackChange,
}: AssetCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(feedbackComments || '');
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const handleApprove = () => {
    onFeedbackChange(id, 'approved');
    setShowComments(false);
  };

  const handleNeedsRevision = () => {
    if (!showComments) {
      setShowComments(true);
    } else if (comments.trim()) {
      onFeedbackChange(id, 'needs_revision', comments);
      setShowComments(false);
    }
  };

  const statusColors = {
    pending: 'bg-muted text-muted-foreground',
    approved: 'bg-success/10 text-success border-success/30',
    needs_revision: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">{partnerName}</CardTitle>
          </div>
          <Badge variant="outline" className={statusColors[feedbackStatus]}>
            {feedbackStatus === 'needs_revision' ? 'Needs Revision' : 
             feedbackStatus.charAt(0).toUpperCase() + feedbackStatus.slice(1)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Submitted {format(createdAt, 'MMM d, yyyy')}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Platform Info */}
        <div className="flex flex-wrap gap-2">
          {affiliatePlatform && (
            <Badge variant="secondary">{affiliatePlatform}</Badge>
          )}
          {mediaPlatform && (
            <Badge variant="secondary">{mediaPlatform}</Badge>
          )}
          {driverTypes?.map((type) => (
            <Badge key={type} variant="outline" className="text-xs">{type}</Badge>
          ))}
        </div>

        {/* Affiliate Link */}
        {affiliateLink && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <code className="text-xs flex-1 truncate">{affiliateLink}</code>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => copyToClipboard(affiliateLink, 'Affiliate link')}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Promo Copy */}
        {promoCopy && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Promo Copy</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2"
                onClick={() => copyToClipboard(promoCopy, 'Promo copy')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-sm text-foreground bg-muted/30 p-2 rounded-md line-clamp-3">
              {promoCopy}
            </p>
          </div>
        )}

        {/* Context Instructions */}
        {contextInstructions && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Context/Instructions</span>
            <p className="text-sm text-foreground bg-muted/30 p-2 rounded-md line-clamp-2">
              {contextInstructions}
            </p>
          </div>
        )}

        {/* File Thumbnails */}
        {fileUrls.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Assets ({fileUrls.length})
            </span>
            <div className="grid grid-cols-5 gap-2">
              {fileUrls.slice(0, 5).map((url, i) => (
                <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted">
                  <img 
                    src={url} 
                    alt={`Asset ${i + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {fileUrls.length > 5 && (
                <div className="aspect-square rounded-md bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{fileUrls.length - 5}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments Input */}
        {showComments && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Revision Comments</span>
            </div>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Describe what changes are needed..."
              className="min-h-[80px] text-sm"
            />
          </div>
        )}

        {/* Existing Feedback Comments */}
        {feedbackStatus === 'needs_revision' && feedbackComments && !showComments && (
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">Revision Required</span>
            </div>
            <p className="text-sm text-foreground">{feedbackComments}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant={feedbackStatus === 'approved' ? 'default' : 'outline'}
            className="flex-1"
            onClick={handleApprove}
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant={feedbackStatus === 'needs_revision' ? 'destructive' : 'outline'}
            className="flex-1"
            onClick={handleNeedsRevision}
          >
            <X className="w-4 h-4 mr-1" />
            {showComments ? 'Submit Revision' : 'Needs Revision'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
