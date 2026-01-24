import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, startOfQuarter, endOfQuarter, addQuarters } from 'date-fns';
import { 
  Search, 
  ChevronRight, 
  Circle, 
  CalendarIcon,
  FileText,
  Tv,
  Mail,
  Video,
  Layout,
  Send,
  ExternalLink,
  Package,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type InventoryAvailability = Database['public']['Enums']['inventory_availability'];

interface Vertical {
  id: string;
  name: string;
  description: string | null;
}

interface SubVertical {
  id: string;
  vertical_id: string;
  name: string;
}

interface Category {
  id: string;
  sub_vertical_id: string;
  name: string;
}

interface K1Cluster {
  id: string;
  category_id: string;
  name: string;
  k1_code: string | null;
}

interface Article {
  id: string;
  k1_cluster_id: string;
  title: string;
  url: string | null;
  status: InventoryAvailability;
  monthly_pageviews: number | null;
}

interface AdUnit {
  id: string;
  article_id: string;
  unit_type: string;
  status: InventoryAvailability;
  rate: number | null;
  deal_id: string | null;
  pitched_at: string | null;
  booked_at: string | null;
  booked_start_date: string | null;
  booked_end_date: string | null;
  notes: string | null;
}

const statusConfig: Record<InventoryAvailability, { color: string; label: string; bgClass: string }> = {
  available: { color: 'text-emerald-500', label: 'Available', bgClass: 'bg-emerald-500/10 border-emerald-500/20' },
  pitched: { color: 'text-amber-500', label: 'Pitched', bgClass: 'bg-amber-500/10 border-amber-500/20' },
  booked: { color: 'text-rose-500', label: 'Booked', bgClass: 'bg-rose-500/10 border-rose-500/20' },
};

const adUnitConfig: Record<string, { icon: React.ElementType; label: string }> = {
  leaderboard: { icon: Layout, label: 'Leaderboard' },
  native: { icon: FileText, label: 'Native' },
  video: { icon: Video, label: 'Video' },
  newsletter: { icon: Mail, label: 'Newsletter' },
};

export function ContentInventoryExplorer() {
  const queryClient = useQueryClient();
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [selectedSubVertical, setSelectedSubVertical] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedK1, setSelectedK1] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'leaderboards' | 'newsletters'>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfQuarter(new Date()),
    to: endOfQuarter(new Date()),
  });

  // Fetch verticals
  const { data: verticals = [] } = useQuery({
    queryKey: ['content-verticals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_verticals')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Vertical[];
    },
  });

  // Fetch sub-verticals based on selected vertical
  const { data: subVerticals = [] } = useQuery({
    queryKey: ['content-sub-verticals', selectedVertical],
    queryFn: async () => {
      if (!selectedVertical) return [];
      const { data, error } = await supabase
        .from('content_sub_verticals')
        .select('*')
        .eq('vertical_id', selectedVertical)
        .order('name');
      if (error) throw error;
      return data as SubVertical[];
    },
    enabled: !!selectedVertical,
  });

  // Fetch categories based on selected sub-vertical
  const { data: categories = [] } = useQuery({
    queryKey: ['content-categories', selectedSubVertical],
    queryFn: async () => {
      if (!selectedSubVertical) return [];
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .eq('sub_vertical_id', selectedSubVertical)
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!selectedSubVertical,
  });

  // Fetch K1 clusters based on selected category
  const { data: k1Clusters = [] } = useQuery({
    queryKey: ['content-k1-clusters', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const { data, error } = await supabase
        .from('content_k1_clusters')
        .select('*')
        .eq('category_id', selectedCategory)
        .order('name');
      if (error) throw error;
      return data as K1Cluster[];
    },
    enabled: !!selectedCategory,
  });

  // Fetch articles based on selected K1
  const { data: articles = [] } = useQuery({
    queryKey: ['content-articles', selectedK1],
    queryFn: async () => {
      if (!selectedK1) return [];
      const { data, error } = await supabase
        .from('content_articles')
        .select('*')
        .eq('k1_cluster_id', selectedK1)
        .order('title');
      if (error) throw error;
      return data as Article[];
    },
    enabled: !!selectedK1,
  });

  // Fetch ad units for selected article
  const { data: adUnits = [] } = useQuery({
    queryKey: ['content-ad-units', selectedArticle?.id],
    queryFn: async () => {
      if (!selectedArticle) return [];
      const { data, error } = await supabase
        .from('content_ad_units')
        .select('*')
        .eq('article_id', selectedArticle.id);
      if (error) throw error;
      return data as AdUnit[];
    },
    enabled: !!selectedArticle,
  });

  // Fetch all ad units with article information for table view
  const { data: allAdUnits = [] } = useQuery({
    queryKey: ['content-all-ad-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_ad_units')
        .select(`
          *,
          article:content_articles (
            id,
            title,
            url
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AdUnit[];
    },
  });

  // Search K1 clusters by name or code
  const { data: searchResults = [] } = useQuery({
    queryKey: ['k1-search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const { data, error } = await supabase
        .from('content_k1_clusters')
        .select(`
          *,
          content_categories (
            id,
            name,
            content_sub_verticals (
              id,
              name,
              content_verticals (id, name)
            )
          )
        `)
        .or(`name.ilike.%${searchQuery}%,k1_code.ilike.%${searchQuery}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.length >= 2,
  });

  // Pitch mutation - creates a prospect in the BD workspace
  const pitchMutation = useMutation({
    mutationFn: async ({ adUnitId, articleTitle }: { adUnitId: string; articleTitle: string }) => {
      // Update ad unit status to pitched
      const { error: adUnitError } = await supabase
        .from('content_ad_units')
        .update({ 
          status: 'pitched' as InventoryAvailability, 
          pitched_at: new Date().toISOString() 
        })
        .eq('id', adUnitId);
      
      if (adUnitError) throw adUnitError;

      // Create a prospect in the BD workspace
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: prospectError } = await supabase
        .from('prospects')
        .insert({
          company_name: `Content Pitch: ${articleTitle}`,
          contact_name: 'TBD',
          contact_email: 'tbd@example.com',
          source: 'Content Inventory',
          notes: `Pitched from Content Inventory Explorer - Article: ${articleTitle}`,
          stage: 'prospecting',
          created_by: user.id,
        });
      
      if (prospectError) throw prospectError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ad-units'] });
      toast.success('Pitch created and added to Business Development pipeline');
    },
    onError: (error) => {
      toast.error(`Failed to create pitch: ${error.message}`);
    },
  });

  const handleQuarterSelect = (quarter: number) => {
    const year = new Date().getFullYear();
    const quarterStart = startOfQuarter(new Date(year, (quarter - 1) * 3, 1));
    const quarterEnd = endOfQuarter(quarterStart);
    setDateRange({ from: quarterStart, to: quarterEnd });
  };

  const handleSearchResultClick = (result: any) => {
    const vertical = result.content_categories?.content_sub_verticals?.content_verticals;
    const subVertical = result.content_categories?.content_sub_verticals;
    const category = result.content_categories;
    
    if (vertical) setSelectedVertical(vertical.id);
    if (subVertical) setSelectedSubVertical(subVertical.id);
    if (category) setSelectedCategory(category.id);
    setSelectedK1(result.id);
    setSearchQuery('');
  };

  // Filter ad units based on view mode
  const filteredAdUnits = useMemo(() => {
    if (viewMode === 'all') return allAdUnits;
    if (viewMode === 'leaderboards') {
      return allAdUnits.filter(unit => unit.unit_type === 'leaderboard');
    }
    if (viewMode === 'newsletters') {
      return allAdUnits.filter(unit => unit.unit_type === 'newsletter');
    }
    return allAdUnits;
  }, [allAdUnits, viewMode]);

  // Calculate stats for filtered ad units
  const stats = useMemo(() => {
    const available = filteredAdUnits.filter(u => u.status === 'available').length;
    const pitched = filteredAdUnits.filter(u => u.status === 'pitched').length;
    const booked = filteredAdUnits.filter(u => u.status === 'booked').length;
    const totalStock = filteredAdUnits.length;
    const inventoryValue = filteredAdUnits
      .filter(u => u.status === 'available' && u.rate)
      .reduce((sum, u) => sum + (u.rate || 0), 0);
    const lowStock = totalStock > 0 && available < totalStock * 0.2;

    return {
      available,
      pitched,
      booked,
      totalStock,
      inventoryValue,
      lowStock,
    };
  }, [filteredAdUnits]);

  const renderStatusIndicator = (status: InventoryAvailability) => {
    const config = statusConfig[status];
    return (
      <div className="flex items-center gap-1.5">
        <Circle className={cn('h-2.5 w-2.5 fill-current', config.color)} />
        <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
      </div>
    );
  };

  const renderColumn = <T extends { id: string; name: string }>(
    title: string,
    items: T[],
    selectedId: string | null,
    onSelect: (id: string) => void,
    getStatus?: (item: T) => InventoryAvailability
  ) => (
    <div className="flex-1 min-w-[200px] border-r last:border-r-0">
      <div className="p-3 border-b bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-2 space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                'hover:bg-accent flex items-center justify-between group',
                selectedId === item.id && 'bg-accent'
              )}
            >
              <span className="truncate">{item.name}</span>
              <div className="flex items-center gap-2">
                {getStatus && renderStatusIndicator(getStatus(item))}
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </div>
            </button>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">Select from previous column</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with search and date filter */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Content Inventory Explorer</h3>
          <p className="text-sm text-muted-foreground">
            Navigate through verticals, categories, and K1 clusters to explore content availability
          </p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'leaderboards' | 'newsletters')}>
        <TabsList className="rounded-none">
          <TabsTrigger value="all" className="rounded-none">All Ad Units</TabsTrigger>
          <TabsTrigger value="leaderboards" className="rounded-none">Leaderboards</TabsTrigger>
          <TabsTrigger value="newsletters" className="rounded-none">Newsletters</TabsTrigger>
        </TabsList>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <p className="text-2xl font-semibold">{stats.available}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.pitched} Pitched • {stats.booked} Booked
                  </p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Levels</p>
                  <p className="text-2xl font-semibold">{stats.totalStock}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Units</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
                  <p className="text-2xl font-semibold">${stats.inventoryValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Available Units</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className={cn("rounded-none", stats.lowStock && "border-amber-500/50 bg-amber-500/5")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {stats.lowStock ? (
                    <>
                      <p className="text-lg font-semibold text-amber-600">Low Stock</p>
                      <p className="text-xs text-muted-foreground mt-1">Alert</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-emerald-600">Healthy</p>
                      <p className="text-xs text-muted-foreground mt-1">Stock Level</p>
                    </>
                  )}
                </div>
                {stats.lowStock ? (
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ad Units Table */}
        <TabsContent value={viewMode} className="mt-6">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>
                {viewMode === 'all' && 'All Ad Units'}
                {viewMode === 'leaderboards' && 'Leaderboard Ad Units'}
                {viewMode === 'newsletters' && 'Newsletter Ad Units'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="rounded-none">
                    <TableHead className="rounded-none bg-white">Article</TableHead>
                    <TableHead className="rounded-none bg-white">Type</TableHead>
                    <TableHead className="rounded-none bg-white">Status</TableHead>
                    <TableHead className="rounded-none bg-white">Rate</TableHead>
                    <TableHead className="rounded-none bg-white">Dates</TableHead>
                    <TableHead className="rounded-none bg-white">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No ad units found for this view
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdUnits.map((unit) => {
                      const config = adUnitConfig[unit.unit_type] || { icon: FileText, label: unit.unit_type };
                      const UnitIcon = config.icon;
                      const unitStatus = statusConfig[unit.status];

                      return (
                        <TableRow key={unit.id} className="rounded-none">
                          <TableCell className="font-medium">
                            {unit.article?.title || 'Unknown Article'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UnitIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn("rounded-none", unitStatus.bgClass, unitStatus.color)}
                            >
                              {unitStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {unit.rate ? `$${unit.rate.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {unit.booked_start_date && unit.booked_end_date ? (
                              `${format(new Date(unit.booked_start_date), 'MMM d')} - ${format(new Date(unit.booked_end_date), 'MMM d')}`
                            ) : unit.pitched_at ? (
                              `Pitched ${format(new Date(unit.pitched_at), 'MMM d')}`
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {unit.notes || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filter Bar */}
      <Card className="rounded-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search K1 by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchResults.length > 0 && searchQuery.length >= 2 && (
                <Card className="absolute top-full mt-1 w-full z-50 shadow-lg">
                  <ScrollArea className="max-h-[200px]">
                    {searchResults.map((result: any) => (
                      <button
                        key={result.id}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
                      >
                        <div className="font-medium">{result.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.k1_code} • {result.content_categories?.name}
                        </div>
                      </button>
                    ))}
                  </ScrollArea>
                </Card>
              )}
            </div>

            {/* Quarter Buttons */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuarterSelect(q)}
                  className={cn(
                    dateRange.from &&
                      startOfQuarter(dateRange.from).getMonth() === (q - 1) * 3 &&
                      'bg-primary text-primary-foreground'
                  )}
                >
                  Q{q}
                </Button>
              ))}
            </div>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'MMM d') : 'Start'} -{' '}
                  {dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : 'End'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Multi-column Navigator */}
      <Card>
        <CardContent className="p-0">
          <div className="flex overflow-x-auto">
            {renderColumn('Vertical', verticals, selectedVertical, (id) => {
              setSelectedVertical(id);
              setSelectedSubVertical(null);
              setSelectedCategory(null);
              setSelectedK1(null);
            })}
            {renderColumn('Sub-Vertical', subVerticals, selectedSubVertical, (id) => {
              setSelectedSubVertical(id);
              setSelectedCategory(null);
              setSelectedK1(null);
            })}
            {renderColumn('Category', categories, selectedCategory, (id) => {
              setSelectedCategory(id);
              setSelectedK1(null);
            })}
            {renderColumn(
              'K1 Cluster',
              k1Clusters.map((k) => ({ ...k, name: `${k.name}${k.k1_code ? ` (${k.k1_code})` : ''}` })),
              selectedK1,
              setSelectedK1
            )}
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      {selectedK1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Articles in {k1Clusters.find((k) => k.id === selectedK1)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {articles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all hover:shadow-md',
                    statusConfig[article.status].bgClass,
                    selectedArticle?.id === article.id && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{article.title}</h4>
                      {article.url && (
                        <p className="text-xs text-muted-foreground truncate">{article.url}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {article.monthly_pageviews && (
                        <span className="text-sm text-muted-foreground">
                          {(article.monthly_pageviews / 1000).toFixed(0)}k views/mo
                        </span>
                      )}
                      {renderStatusIndicator(article.status)}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              ))}
              {articles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No articles found in this K1 cluster
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Article Detail Side Panel */}
      <Sheet open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{selectedArticle?.title}</SheetTitle>
            <SheetDescription>
              <div className="flex items-center gap-2 mt-2">
                {selectedArticle && renderStatusIndicator(selectedArticle.status)}
                {selectedArticle?.url && (
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View Article <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-sm">Available Ad Units</h4>
            {adUnits.map((unit) => {
              const config = adUnitConfig[unit.unit_type] || { icon: FileText, label: unit.unit_type };
              const UnitIcon = config.icon;
              const unitStatus = statusConfig[unit.status];

              return (
                <Card key={unit.id} className={cn('border rounded-none', unitStatus.bgClass)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', unitStatus.bgClass)}>
                          <UnitIcon className={cn('h-5 w-5', unitStatus.color)} />
                        </div>
                        <div>
                          <h5 className="font-medium">{config.label}</h5>
                          {unit.rate && (
                            <p className="text-sm text-muted-foreground">
                              ${unit.rate.toLocaleString()} {unit.booked_start_date && `• ${format(new Date(unit.booked_start_date), 'MMM d')} - ${unit.booked_end_date ? format(new Date(unit.booked_end_date), 'MMM d') : 'TBD'}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStatusIndicator(unit.status)}
                        {unit.status === 'available' && selectedArticle && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              pitchMutation.mutate({
                                adUnitId: unit.id,
                                articleTitle: selectedArticle.title,
                              })
                            }
                            disabled={pitchMutation.isPending}
                            className="gap-1"
                          >
                            <Send className="h-3 w-3" />
                            Pitch
                          </Button>
                        )}
                      </div>
                    </div>
                    {unit.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">{unit.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {adUnits.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No ad units configured for this article
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
