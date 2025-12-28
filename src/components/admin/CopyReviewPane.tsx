import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  User, 
  Clock,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BrandGuidelines } from './BrandGuidelines';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface InlineComment {
  id: string;
  text: string;
  selectedText?: string;
  createdAt: Date;
  author: string;
}

interface CopyReviewPaneProps {
  assets: Array<{
    id: string;
    channel: string;
    copyText: string | null;
    affiliateLink: string | null;
  }>;
  campaignId: string;
}

export function CopyReviewPane({ assets, campaignId }: CopyReviewPaneProps) {
  const [comments, setComments] = useState<InlineComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [guidelinesOpen, setGuidelinesOpen] = useState(true);

  // Combine all copy text from assets
  const allCopy = assets
    .filter(a => a.copyText)
    .map(a => ({ channel: a.channel, text: a.copyText!, affiliateLink: a.affiliateLink }));

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: InlineComment = {
      id: crypto.randomUUID(),
      text: newComment,
      selectedText: selectedText || undefined,
      createdAt: new Date(),
      author: 'Admin',
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    setSelectedText('');
  };

  const handleDeleteComment = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  if (allCopy.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-sm">No copy text submitted</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Split Pane View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane - Partner Copy */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-foreground">Partner Copy</h4>
            <Badge variant="outline" className="text-[10px]">
              Select text to comment
            </Badge>
          </div>

          <ScrollArea className="h-[300px] rounded-lg border border-border p-4 bg-muted/30">
            <div className="space-y-6" onMouseUp={handleTextSelection}>
              {allCopy.map((copy, idx) => (
                <div key={idx} className="space-y-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {copy.channel}
                  </Badge>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap selection:bg-primary/20 selection:text-foreground">
                    {copy.text}
                  </p>
                  {copy.affiliateLink && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">Affiliate:</span>
                      <a 
                        href={copy.affiliateLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate max-w-[200px]"
                      >
                        {copy.affiliateLink}
                      </a>
                    </div>
                  )}
                  {idx < allCopy.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Selected Text Indicator */}
          {selectedText && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-primary/10 border border-primary/20 rounded-lg"
            >
              <p className="text-xs text-muted-foreground mb-1">Selected for comment:</p>
              <p className="text-sm font-medium text-primary truncate">"{selectedText}"</p>
            </motion.div>
          )}
        </div>

        {/* Right Pane - Brand Guidelines */}
        <div className="space-y-4">
          <Collapsible open={guidelinesOpen} onOpenChange={setGuidelinesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Brand Guidelines</span>
                </div>
                {guidelinesOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-[300px] rounded-lg border border-border p-4 bg-card mt-4">
                <BrandGuidelines />
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      <Separator />

      {/* Bottom - Inline Comments Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-foreground">Copy Edit Comments</h4>
          <Badge variant="outline" className="text-[10px]">
            {comments.length} comments
          </Badge>
        </div>

        {/* Comment Input */}
        <div className="flex gap-3">
          <Textarea
            placeholder="Add a comment about the copy..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="self-end"
          >
            <Send className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Comments List */}
        {comments.length > 0 && (
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-3">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-muted/50 rounded-lg border border-border"
                >
                  {comment.selectedText && (
                    <div className="mb-2 p-2 bg-primary/5 rounded border-l-2 border-primary">
                      <p className="text-xs italic text-muted-foreground">
                        "{comment.selectedText}"
                      </p>
                    </div>
                  )}
                  <p className="text-sm">{comment.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {comment.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(comment.createdAt, 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}

        {comments.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No comments yet. Select text above and add your feedback.
          </p>
        )}
      </div>
    </div>
  );
}
