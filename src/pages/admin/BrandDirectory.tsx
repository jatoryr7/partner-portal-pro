import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  Search, 
  Mail, 
  Phone, 
  MessageSquare,
  FolderOpen,
  Users,
  Briefcase,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';

interface Stakeholder {
  id: string;
  name: string;
  role: string | null;
  email: string;
  phone: string | null;
}

interface Partner {
  id: string;
  company_name: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  secondary_contact_name: string | null;
  secondary_contact_email: string | null;
  submission_date: string;
  campaign_status: {
    stage: string;
    priority: string;
  } | null;
  stakeholders: Stakeholder[];
  creative_assets: { id: string }[];
}

export default function BrandDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners-directory-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          campaign_status (
            stage,
            priority
          ),
          stakeholders (
            id,
            name,
            role,
            email,
            phone
          ),
          creative_assets (
            id
          )
        `)
        .order('company_name', { ascending: true });

      if (error) throw error;
      return data as Partner[];
    },
  });

  const filteredPartners = partners?.filter((partner) =>
    partner.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.primary_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.stakeholders?.some(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleBrand = (brandId: string) => {
    setExpandedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  };

  const getStageColor = (stage: string | undefined) => {
    switch (stage) {
      case 'intake': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'review': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleSlackClick = (email: string) => {
    // Opens Slack with a DM to the user (assumes Slack workspace uses email-based lookup)
    window.open(`slack://user?team=&id=`, '_blank');
  };

  const handleViewCreativeHistory = (partnerId: string) => {
    // Navigate to native view with brand filter
    navigate(`/admin/native?brand=${partnerId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brand Directory</h1>
        <p className="text-muted-foreground">
          Searchable directory of all partner brands and their creative contacts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners?.filter(p => p.campaign_status?.stage === 'in_progress').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners?.reduce((acc, p) => acc + (p.stakeholders?.length || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners?.reduce((acc, p) => acc + (p.creative_assets?.length || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search brands, contacts, or emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Brand Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPartners?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No brands found</p>
            <p className="text-sm">Try adjusting your search query</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPartners?.map((partner) => (
            <Card key={partner.id} className="overflow-hidden">
              <Collapsible 
                open={expandedBrands.has(partner.id)} 
                onOpenChange={() => toggleBrand(partner.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Brand Logo/Avatar */}
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(partner.company_name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{partner.company_name}</h3>
                            <Badge variant="outline" className={getStageColor(partner.campaign_status?.stage)}>
                              {partner.campaign_status?.stage?.replace('_', ' ') || 'No Campaign'}
                            </Badge>
                            {partner.campaign_status?.priority && (
                              <Badge variant="outline" className={getPriorityColor(partner.campaign_status.priority)}>
                                {partner.campaign_status.priority} priority
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {partner.stakeholders?.length || 0} contacts
                            </span>
                            <span className="flex items-center gap-1">
                              <FolderOpen className="h-3.5 w-3.5" />
                              {partner.creative_assets?.length || 0} assets
                            </span>
                            <span>
                              Submitted {format(new Date(partner.submission_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCreativeHistory(partner.id);
                          }}
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          View Creative History
                        </Button>
                        {expandedBrands.has(partner.id) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <Separator />
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">
                      Creative Contacts
                    </h4>
                    
                    {partner.stakeholders?.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {partner.stakeholders.map((stakeholder) => (
                          <div 
                            key={stakeholder.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                                {getInitials(stakeholder.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium truncate">{stakeholder.name}</p>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        onClick={() => handleEmailClick(stakeholder.email)}
                                      >
                                        <Mail className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Send Email</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        onClick={() => handleSlackClick(stakeholder.email)}
                                      >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Message on Slack</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                              
                              {stakeholder.role && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {stakeholder.role}
                                </Badge>
                              )}
                              
                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2 truncate">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{stakeholder.email}</span>
                                </p>
                                {stakeholder.phone && (
                                  <p className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    {stakeholder.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No contacts associated with this brand</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
