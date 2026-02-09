import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Mock Data Types
interface PlacementSlot {
  id: string;
  name: string;
  status: 'available' | 'sold';
  price: number;
  assignedBrand?: string;
  cpm: number;
  value: number;
}

interface K1Keyword {
  id: string;
  name: string;
  placements: PlacementSlot[];
}

interface SubVertical {
  id: string;
  name: string;
  k1Keywords: K1Keyword[];
}

interface InventoryData {
  subVerticals: SubVertical[];
}

// Mock Data
const mockInventoryData: InventoryData = {
  subVerticals: [
    {
      id: 'sleep',
      name: 'Sleep',
      k1Keywords: [
        {
          id: 'best-magnesium',
          name: 'Best Magnesium',
          placements: [
            {
              id: 'hero-1',
              name: 'Hero Spot',
              status: 'sold',
              price: 5000,
              assignedBrand: 'SleepWell Plus',
              cpm: 25,
              value: 5000,
            },
            {
              id: 'rank-1',
              name: 'Rank #1',
              status: 'available',
              price: 3500,
              cpm: 20,
              value: 3500,
            },
            {
              id: 'rank-2',
              name: 'Rank #2',
              status: 'sold',
              price: 2500,
              assignedBrand: 'MagnesiumMax',
              cpm: 18,
              value: 2500,
            },
          ],
        },
        {
          id: 'melatonin-supplements',
          name: 'Melatonin Supplements',
          placements: [
            {
              id: 'hero-2',
              name: 'Hero Spot',
              status: 'available',
              price: 4500,
              cpm: 22,
              value: 4500,
            },
            {
              id: 'rank-1-2',
              name: 'Rank #1',
              status: 'available',
              price: 3000,
              cpm: 19,
              value: 3000,
            },
          ],
        },
      ],
    },
    {
      id: 'nutrition',
      name: 'Nutrition',
      k1Keywords: [
        {
          id: 'protein-powder',
          name: 'Protein Powder',
          placements: [
            {
              id: 'hero-3',
              name: 'Hero Spot',
              status: 'sold',
              price: 6000,
              assignedBrand: 'ProFit Nutrition',
              cpm: 30,
              value: 6000,
            },
            {
              id: 'rank-1-3',
              name: 'Rank #1',
              status: 'sold',
              price: 4000,
              assignedBrand: 'MuscleMax',
              cpm: 25,
              value: 4000,
            },
            {
              id: 'rank-2-2',
              name: 'Rank #2',
              status: 'available',
              price: 2800,
              cpm: 20,
              value: 2800,
            },
            {
              id: 'rank-3',
              name: 'Rank #3',
              status: 'available',
              price: 2000,
              cpm: 18,
              value: 2000,
            },
          ],
        },
        {
          id: 'vitamin-d',
          name: 'Vitamin D',
          placements: [
            {
              id: 'hero-4',
              name: 'Hero Spot',
              status: 'available',
              price: 4200,
              cpm: 21,
              value: 4200,
            },
          ],
        },
      ],
    },
  ],
};

type TimePeriod = 'this-month' | 'next-month' | 'q1' | 'q2' | 'q3' | 'q4';
type GroupBy = 'hierarchy' | 'brand' | 'article-placement';
type StatusFilter = 'all' | 'available' | 'sold';

export function InventoryMatrix() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this-month');
  const [groupBy, setGroupBy] = useState<GroupBy>('hierarchy');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedSubVerticals, setExpandedSubVerticals] = useState<Set<string>>(new Set(['sleep', 'nutrition']));
  const [expandedK1s, setExpandedK1s] = useState<Set<string>>(new Set());

  const toggleSubVertical = (id: string) => {
    setExpandedSubVerticals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleK1 = (id: string) => {
    setExpandedK1s(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter placements based on status
  const filteredData = useMemo(() => {
    const filterPlacements = (placements: PlacementSlot[]) => {
      if (statusFilter === 'all') return placements;
      return placements.filter(p => p.status === statusFilter);
    };

    return {
      subVerticals: mockInventoryData.subVerticals.map(sv => ({
        ...sv,
        k1Keywords: sv.k1Keywords.map(k1 => ({
          ...k1,
          placements: filterPlacements(k1.placements),
        })).filter(k1 => k1.placements.length > 0),
      })).filter(sv => sv.k1Keywords.length > 0),
    };
  }, [statusFilter]);

  // Group by Brand view
  const brandGroupedData = useMemo(() => {
    const brandMap = new Map<string, PlacementSlot[]>();

    mockInventoryData.subVerticals.forEach(sv => {
      sv.k1Keywords.forEach(k1 => {
        k1.placements.forEach(placement => {
          if (placement.status === 'sold' && placement.assignedBrand) {
            const existing = brandMap.get(placement.assignedBrand) || [];
            brandMap.set(placement.assignedBrand, [...existing, placement]);
          }
        });
      });
    });

    return Array.from(brandMap.entries()).map(([brand, placements]) => ({
      brand,
      placements: statusFilter === 'all' 
        ? placements 
        : placements.filter(p => p.status === statusFilter),
    })).filter(item => item.placements.length > 0);
  }, [statusFilter]);

  // Group by Article Placement view
  const articlePlacementGroupedData = useMemo(() => {
    const placementMap = new Map<string, Array<PlacementSlot & { subVertical: string; k1Keyword: string }>>();

    mockInventoryData.subVerticals.forEach(sv => {
      sv.k1Keywords.forEach(k1 => {
        k1.placements.forEach(placement => {
          const existing = placementMap.get(placement.name) || [];
          placementMap.set(placement.name, [
            ...existing,
            { ...placement, subVertical: sv.name, k1Keyword: k1.name },
          ]);
        });
      });
    });

    return Array.from(placementMap.entries()).map(([placementName, placements]) => ({
      placementName,
      placements: statusFilter === 'all' 
        ? placements 
        : placements.filter(p => p.status === statusFilter),
    })).filter(item => item.placements.length > 0);
  }, [statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ControlBar = () => (
    <Card className="rounded-none border border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-foreground">Time Period:</label>
            <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
              <SelectTrigger className="w-[140px] rounded-none border-border h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="next-month">Next Month</SelectItem>
                <SelectItem value="q1">Q1</SelectItem>
                <SelectItem value="q2">Q2</SelectItem>
                <SelectItem value="q3">Q3</SelectItem>
                <SelectItem value="q4">Q4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-foreground">Group By:</label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-[160px] rounded-none border-border h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="hierarchy">Hierarchy</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="article-placement">Article Placement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-foreground">Status:</label>
            <div className="flex gap-1 border border-border rounded-none">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-none h-9 px-3 text-xs",
                  statusFilter === 'all' && "bg-healthcare-teal text-white hover:bg-healthcare-teal/90"
                )}
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'available' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-none h-9 px-3 text-xs",
                  statusFilter === 'available' && "bg-healthcare-teal text-white hover:bg-healthcare-teal/90"
                )}
                onClick={() => setStatusFilter('available')}
              >
                Available Only
              </Button>
              <Button
                variant={statusFilter === 'sold' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "rounded-none h-9 px-3 text-xs",
                  statusFilter === 'sold' && "bg-healthcare-teal text-white hover:bg-healthcare-teal/90"
                )}
                onClick={() => setStatusFilter('sold')}
              >
                Sold Only
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (groupBy === 'brand') {
    return (
      <div className="space-y-6">
        <ControlBar />

        {/* Brand Grouped Table */}
        <Card className="rounded-none border border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="h-10 px-4 font-semibold">Brand</TableHead>
                  <TableHead className="h-10 px-4 font-semibold">Slot Name</TableHead>
                  <TableHead className="h-10 px-4 font-semibold">Status</TableHead>
                  <TableHead className="h-10 px-4 font-semibold text-right">Price</TableHead>
                  <TableHead className="h-10 px-4 font-semibold text-right">CPM</TableHead>
                  <TableHead className="h-10 px-4 font-semibold text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brandGroupedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inventory found
                    </TableCell>
                  </TableRow>
                ) : (
                  brandGroupedData.map(({ brand, placements }) => (
                    placements.map((placement, idx) => (
                      <TableRow key={`${brand}-${placement.id}`} className={cn("border-b border-border", idx === 0 && "border-t-2 border-t-healthcare-teal")}>
                        {idx === 0 && (
                          <TableCell rowSpan={placements.length} className="font-medium align-top py-4 px-4 border-r border-border">
                            {brand}
                          </TableCell>
                        )}
                        <TableCell className="py-2 px-4">{placement.name}</TableCell>
                        <TableCell className="py-2 px-4">
                          <Badge
                            variant={placement.status === 'available' ? 'outline' : 'default'}
                            className={cn(
                              "rounded-none text-xs",
                              placement.status === 'available'
                                ? "border-healthcare-teal text-healthcare-teal bg-transparent"
                                : "bg-healthcare-teal text-white border-healthcare-teal"
                            )}
                          >
                            {placement.status === 'available' ? 'Available' : 'Sold'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right font-mono text-sm">
                          {formatCurrency(placement.price)}
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right font-mono text-sm">
                          ${placement.cpm}
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right font-mono text-sm">
                          {formatCurrency(placement.value)}
                        </TableCell>
                      </TableRow>
                    ))
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (groupBy === 'article-placement') {
    return (
      <div className="space-y-6">
        <ControlBar />

        {/* Article Placement Grouped Table */}
        <Card className="rounded-none border border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="h-10 px-4 font-semibold">Placement</TableHead>
                  <TableHead className="h-10 px-4 font-semibold">Sub-Vertical</TableHead>
                  <TableHead className="h-10 px-4 font-semibold">K1 Keyword</TableHead>
                  <TableHead className="h-10 px-4 font-semibold">Status</TableHead>
                  <TableHead className="h-10 px-4 font-semibold text-right">Price</TableHead>
                  <TableHead className="h-10 px-4 font-semibold">Assigned Brand</TableHead>
                  <TableHead className="h-10 px-4 font-semibold text-right">CPM</TableHead>
                  <TableHead className="h-10 px-4 font-semibold text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articlePlacementGroupedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No inventory found
                    </TableCell>
                  </TableRow>
                ) : (
                  articlePlacementGroupedData.map(({ placementName, placements }) => (
                    placements.map((placement, idx) => (
                      <TableRow key={`${placementName}-${placement.id}`} className={cn("border-b border-border", idx === 0 && "border-t-2 border-t-healthcare-teal")}>
                        {idx === 0 && (
                          <TableCell rowSpan={placements.length} className="font-medium align-top py-4 px-4 border-r border-border">
                            {placementName}
                          </TableCell>
                        )}
                        <TableCell className="py-2 px-4 text-sm">{placement.subVertical}</TableCell>
                        <TableCell className="py-2 px-4 text-sm">{placement.k1Keyword}</TableCell>
                        <TableCell className="py-2 px-4">
                          <Badge
                            variant={placement.status === 'available' ? 'outline' : 'default'}
                            className={cn(
                              "rounded-none text-xs",
                              placement.status === 'available'
                                ? "border-healthcare-teal text-healthcare-teal bg-transparent"
                                : "bg-healthcare-teal text-white border-healthcare-teal"
                            )}
                          >
                            {placement.status === 'available' ? 'Available' : 'Sold'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right font-mono text-sm">
                          {formatCurrency(placement.price)}
                        </TableCell>
                        <TableCell className="py-2 px-4 text-sm">
                          {placement.assignedBrand || '-'}
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right font-mono text-sm">
                          ${placement.cpm}
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right font-mono text-sm">
                          {formatCurrency(placement.value)}
                        </TableCell>
                      </TableRow>
                    ))
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ControlBar />

      {/* Hierarchy Table */}
      <Card className="rounded-none border border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="h-10 px-4 font-semibold w-[300px]">Hierarchy</TableHead>
                <TableHead className="h-10 px-4 font-semibold">Slot Name</TableHead>
                <TableHead className="h-10 px-4 font-semibold">Status</TableHead>
                <TableHead className="h-10 px-4 font-semibold text-right">Price</TableHead>
                <TableHead className="h-10 px-4 font-semibold">Assigned Brand</TableHead>
                <TableHead className="h-10 px-4 font-semibold text-right">CPM</TableHead>
                <TableHead className="h-10 px-4 font-semibold text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.subVerticals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No inventory found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.subVerticals.map((subVertical) => (
                  <>
                    {/* Sub-Vertical Row */}
                    <Collapsible
                      key={subVertical.id}
                      open={expandedSubVerticals.has(subVertical.id)}
                      onOpenChange={() => toggleSubVertical(subVertical.id)}
                    >
                      <TableRow className="border-b border-border bg-muted/30">
                        <TableCell colSpan={7} className="p-0">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-10 px-4 rounded-none hover:bg-muted/50"
                            >
                              {expandedSubVerticals.has(subVertical.id) ? (
                                <ChevronDown className="h-4 w-4 mr-2" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-2" />
                              )}
                              <span className="font-semibold text-foreground">{subVertical.name}</span>
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                      </TableRow>

                      <CollapsibleContent>
                        {subVertical.k1Keywords.map((k1) => (
                          <>
                            {/* K1 Keyword Row */}
                            <Collapsible
                              key={k1.id}
                              open={expandedK1s.has(k1.id)}
                              onOpenChange={() => toggleK1(k1.id)}
                            >
                              <TableRow className="border-b border-border bg-muted/10">
                                <TableCell colSpan={7} className="p-0">
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start h-9 px-8 rounded-none hover:bg-muted/30"
                                    >
                                      {expandedK1s.has(k1.id) ? (
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 mr-2" />
                                      )}
                                      <span className="font-medium text-foreground">{k1.name}</span>
                                    </Button>
                                  </CollapsibleTrigger>
                                </TableCell>
                              </TableRow>

                              <CollapsibleContent>
                                {k1.placements.map((placement) => (
                                  <TableRow key={placement.id} className="border-b border-border">
                                    <TableCell className="px-12 py-2"></TableCell>
                                    <TableCell className="px-4 py-2">{placement.name}</TableCell>
                                    <TableCell className="px-4 py-2">
                                      <Badge
                                        variant={placement.status === 'available' ? 'outline' : 'default'}
                                        className={cn(
                                          "rounded-none text-xs",
                                          placement.status === 'available'
                                            ? "border-healthcare-teal text-healthcare-teal bg-transparent"
                                            : "bg-healthcare-teal text-white border-healthcare-teal"
                                        )}
                                      >
                                        {placement.status === 'available' ? 'Available' : 'Sold'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-right font-mono text-sm">
                                      {formatCurrency(placement.price)}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-sm">
                                      {placement.assignedBrand || '-'}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-right font-mono text-sm">
                                      ${placement.cpm}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-right font-mono text-sm">
                                      {formatCurrency(placement.value)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          </>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
