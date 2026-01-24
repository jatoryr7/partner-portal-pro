import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, RefreshCw, AlertTriangle } from 'lucide-react';

export function SessionMonitor() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!session?.expires_at) return;

    const checkSession = () => {
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      
      setTimeRemaining(remaining);
      
      // Show warning when less than 5 minutes remaining
      if (remaining < 5 * 60 * 1000 && remaining > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [session?.expires_at]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      toast({
        title: 'Session extended',
        description: 'Your session has been refreshed successfully.',
      });
      setShowWarning(false);
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Unable to refresh session. Please sign in again.',
        variant: 'destructive',
      });
    }
    setIsRefreshing(false);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (!showWarning || timeRemaining === null) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 p-4 border border-amber-500/50 bg-amber-50 dark:bg-amber-950/50 shadow-lg max-w-sm"
      style={{ borderRadius: '0px' }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
              Session Expiring Soon
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {formatTime(timeRemaining)} remaining
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleRefreshSession}
            disabled={isRefreshing}
            className="w-full"
            style={{ borderRadius: '0px', backgroundColor: '#1ABC9C' }}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Extend Session
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
