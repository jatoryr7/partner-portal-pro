import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send, AtSign, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

interface Comment {
  id: string;
  partner_id: string;
  author_id: string;
  content: string;
  mentions: string[];
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ActivityFeedProps {
  partnerId: string;
  compact?: boolean;
}

export function ActivityFeed({ partnerId, compact = false }: ActivityFeedProps) {
  const [newComment, setNewComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch comments for this partner
  const { data: comments, isLoading } = useQuery({
    queryKey: ['brand-comments', partnerId],
    queryFn: async () => {
      const { data: commentsData, error } = await supabase
        .from('brand_comments')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for all authors
      const authorIds = [...new Set(commentsData.map((c) => c.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return commentsData.map((comment) => ({
        ...comment,
        profiles: profileMap.get(comment.author_id) || null,
      })) as Comment[];
    },
  });

  // Fetch admin users for mentions
  const { data: adminUsers } = useQuery({
    queryKey: ['admin-users-for-mentions'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const userIds = roles.map((r) => r.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      return profiles as AdminUser[];
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      // Extract mentions from content
      const mentionRegex = /@(\w+)/g;
      const mentions = [...content.matchAll(mentionRegex)].map((m) => m[1]);

      const { error } = await supabase.from('brand_comments').insert({
        partner_id: partnerId,
        author_id: user?.id,
        content,
        mentions,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-comments', partnerId] });
      setNewComment('');
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error('Failed to add comment: ' + error.message);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('brand_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-comments', partnerId] });
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete comment: ' + error.message);
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment);
  };

  const insertMention = (userName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = newComment.slice(0, cursorPos);
    const textAfter = newComment.slice(cursorPos);

    // Find the @ symbol before cursor
    const lastAtPos = textBefore.lastIndexOf('@');
    const newText = textBefore.slice(0, lastAtPos) + `@${userName} ` + textAfter;

    setNewComment(newText);
    setShowMentions(false);
    setMentionSearch('');
    
    setTimeout(() => {
      textarea.focus();
      const newPos = lastAtPos + userName.length + 2;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Check if we should show mentions dropdown
    const cursorPos = e.target.selectionStart;
    const textBefore = value.slice(0, cursorPos);
    const lastAtPos = textBefore.lastIndexOf('@');

    if (lastAtPos !== -1 && !textBefore.slice(lastAtPos).includes(' ')) {
      setShowMentions(true);
      setMentionSearch(textBefore.slice(lastAtPos + 1).toLowerCase());
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  const filteredUsers = adminUsers?.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(mentionSearch) ||
      u.email?.toLowerCase().includes(mentionSearch)
  );

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  // Sanitize and highlight mentions to prevent XSS attacks
  const highlightMentions = (content: string) => {
    // First escape HTML to prevent XSS
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Then safely highlight mentions
    return escaped.replace(
      /@(\w+)/g,
      '<span class="text-primary font-medium">@$1</span>'
    );
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            <MessageSquare className="h-4 w-4" />
            {comments?.length || 0}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">Activity Feed</h4>
          </div>
          <ScrollArea className="h-64">
            <div className="p-3 space-y-3">
              {comments?.slice(0, 5).map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.profiles?.full_name ?? null, comment.profiles?.email ?? null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {!comments?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium">Activity Feed</h4>
        <span className="text-sm text-muted-foreground">({comments?.length || 0})</span>
      </div>

      {/* New comment input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={newComment}
          onChange={handleInputChange}
          placeholder="Add a comment... Use @ to mention team members"
          className="resize-none pr-12"
          rows={2}
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 bottom-2"
          onClick={handleSubmit}
          disabled={!newComment.trim() || createCommentMutation.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>

        {/* Mentions dropdown */}
        {showMentions && filteredUsers && filteredUsers.length > 0 && (
          <div className="absolute left-0 right-0 bottom-full mb-1 bg-popover border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                onClick={() => insertMention(u.full_name?.split(' ')[0] || u.email?.split('@')[0] || 'user')}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(u.full_name, u.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{u.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comments list */}
      <ScrollArea className="h-64">
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment on this brand</p>
            </div>
          ) : (
            comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(comment.profiles?.full_name ?? null, comment.profiles?.email ?? null)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {comment.profiles?.full_name || comment.profiles?.email || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </span>
                      {comment.author_id === user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p
                    className="text-sm mt-1"
                    dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
