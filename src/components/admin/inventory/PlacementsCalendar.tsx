import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { cn } from '@/lib/utils';

type PlacementStatus = 'available' | 'pitched' | 'booked' | 'upcoming';

interface Placement {
  id: string;
  name: string;
  placement_type: string;
  property: string;
  status: PlacementStatus;
  scheduled_date: string | null;
  end_date: string | null;
  campaign_deals?: {
    deal_name: string;
    partners?: {
      company_name: string;
    };
  };
}

const STATUS_COLORS: Record<PlacementStatus, string> = {
  available: 'bg-success/20 border-success/40 text-success',
  pitched: 'bg-amber-500/20 border-amber-500/40 text-amber-600',
  booked: 'bg-blue-500/20 border-blue-500/40 text-blue-600',
  upcoming: 'bg-purple-500/20 border-purple-500/40 text-purple-600',
};

export function PlacementsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: placements = [] } = useQuery({
    queryKey: ['content-placements-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_placements')
        .select('*, campaign_deals(deal_name, partners(company_name))')
        .not('scheduled_date', 'is', null)
        .order('scheduled_date');
      if (error) throw error;
      return data as Placement[];
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPlacementsForDay = (day: Date) => {
    return placements.filter((p) => {
      if (!p.scheduled_date) return false;
      const startDate = parseISO(p.scheduled_date);
      const endDate = p.end_date ? parseISO(p.end_date) : startDate;
      
      return isWithinInterval(day, { start: startDate, end: endDate }) ||
             isSameDay(day, startDate) ||
             isSameDay(day, endDate);
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Stats for the month
  const monthPlacements = useMemo(() => {
    return placements.filter((p) => {
      if (!p.scheduled_date) return false;
      const date = parseISO(p.scheduled_date);
      return isSameMonth(date, currentMonth);
    });
  }, [placements, currentMonth]);

  const monthStats = {
    total: monthPlacements.length,
    available: monthPlacements.filter(p => p.status === 'available').length,
    booked: monthPlacements.filter(p => p.status === 'booked').length,
    pitched: monthPlacements.filter(p => p.status === 'pitched').length,
  };

  return (
    <div className="space-y-6">
      {/* Month Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold">{monthStats.total} placements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-success">{monthStats.available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Booked</p>
            <p className="text-2xl font-bold text-blue-500">{monthStats.booked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pitched</p>
            <p className="text-2xl font-bold text-amber-500">{monthStats.pitched}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayPlacements = getPlacementsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] p-2 border rounded-lg",
                    !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                    isToday && "border-primary bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayPlacements.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded border truncate",
                          STATUS_COLORS[p.status]
                        )}
                        title={`${p.name} - ${p.campaign_deals?.partners?.company_name || 'No partner'}`}
                      >
                        {p.name}
                      </div>
                    ))}
                    {dayPlacements.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayPlacements.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-success/40" />
              <span className="text-xs">Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500/40" />
              <span className="text-xs">Pitched</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500/40" />
              <span className="text-xs">Booked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-500/40" />
              <span className="text-xs">Upcoming</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
