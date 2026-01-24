import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { NetworkApiStatus } from '@/hooks/useBillables';

interface NetworkStatusSidebarProps {
  apiStatuses: NetworkApiStatus[];
  isLoading: boolean;
}

const networkLabels: Record<string, string> = {
  impact: 'Impact',
  cj: 'Commission Junction',
  shareasale: 'ShareASale',
};

const networkColors: Record<string, string> = {
  impact: 'bg-purple-500',
  cj: 'bg-blue-500',
  shareasale: 'bg-green-500',
};

export function NetworkStatusSidebar({ apiStatuses, isLoading }: NetworkStatusSidebarProps) {
  if (isLoading) {
    return (
      <Card className="p-4 rounded-none border border-border bg-surface">
        <h3 className="text-sm font-semibold mb-4 tracking-scientific">API Health</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-none" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 rounded-none border border-border bg-surface">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-scientific">API Health</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {apiStatuses.map(status => (
          <div
            key={status.id}
            className="p-3 border border-border bg-background rounded-none"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${networkColors[status.network]}`} />
                <span className="text-sm font-medium">
                  {networkLabels[status.network] || status.network}
                </span>
              </div>
              {status.is_connected ? (
                <Badge variant="outline" className="rounded-none text-xs bg-healthcare-teal/10 text-healthcare-teal border-healthcare-teal/30">
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-none text-xs bg-destructive/10 text-destructive border-destructive/30">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {status.last_sync_at 
                ? `Last sync: ${formatDistanceToNow(new Date(status.last_sync_at), { addSuffix: true })}`
                : 'Never synced'
              }
            </p>
            
            {status.last_error && (
              <p className="text-xs text-destructive mt-1 truncate" title={status.last_error}>
                {status.last_error}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
