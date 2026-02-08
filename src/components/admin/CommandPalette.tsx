import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Building2,
  Briefcase,
  Users,
  Calendar,
  LayoutDashboard,
  Kanban,
  Mail,
  Megaphone,
  Target,
  Tv,
  PenTool,
  UserCog,
  Search,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'brand' | 'deal' | 'contact' | 'inventory' | 'page';
  title: string;
  subtitle?: string;
  url: string;
}

const navigationPages: SearchResult[] = [
  { id: 'nav-dashboard', type: 'page', title: 'Dashboard', url: '/admin' },
  { id: 'nav-medical-review', type: 'page', title: 'Medical Review', url: '/admin/medical-review' },
  { id: 'nav-queue', type: 'page', title: 'Campaign Queue', url: '/admin/queue' },
  { id: 'nav-brands', type: 'page', title: 'Brand Directory', url: '/admin/brands' },
  { id: 'nav-deals', type: 'page', title: 'Deals CRM', url: '/admin/deals' },
  { id: 'nav-stakeholders', type: 'page', title: 'Stakeholders', url: '/admin/stakeholders' },
  { id: 'nav-users', type: 'page', title: 'User Management', url: '/admin/users' },
  { id: 'nav-native', type: 'page', title: 'Native Channel', url: '/admin/native' },
  { id: 'nav-paid-social', type: 'page', title: 'Paid Social/Search', url: '/admin/paid-social' },
  { id: 'nav-media', type: 'page', title: 'Media Channel', url: '/admin/media' },
  { id: 'nav-newsletter', type: 'page', title: 'Newsletter', url: '/admin/newsletter' },
  { id: 'nav-content-marketing', type: 'page', title: 'Content Marketing', url: '/admin/content-marketing' },
];

const getIconForType = (type: SearchResult['type']) => {
  switch (type) {
    case 'brand':
      return Building2;
    case 'deal':
      return Briefcase;
    case 'contact':
      return Users;
    case 'inventory':
      return Calendar;
    case 'page':
      return LayoutDashboard;
    default:
      return Search;
  }
};

const getPageIcon = (url: string) => {
  if (url.includes('queue')) return Kanban;
  if (url.includes('brands')) return Building2;
  if (url.includes('deals')) return Briefcase;
  if (url.includes('stakeholders')) return Users;
  if (url.includes('users')) return UserCog;
  if (url.includes('native')) return Megaphone;
  if (url.includes('paid-social')) return Target;
  if (url.includes('media')) return Tv;
  if (url.includes('newsletter')) return Mail;
  if (url.includes('content-marketing')) return PenTool;
  return LayoutDashboard;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch brands (partners)
  const { data: brands = [] } = useQuery({
    queryKey: ['command-palette-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data.map((p): SearchResult => ({
        id: p.id,
        type: 'brand',
        title: p.company_name,
        url: `/admin/brands?brand=${p.id}`,
      }));
    },
    enabled: open,
  });

  // Fetch deals
  const { data: deals = [] } = useQuery({
    queryKey: ['command-palette-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_deals')
        .select('id, deal_name, partner_id, partners(company_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((d): SearchResult => ({
        id: d.id,
        type: 'deal',
        title: d.deal_name,
        subtitle: (d.partners as any)?.company_name,
        url: `/admin/deals?deal=${d.id}`,
      }));
    },
    enabled: open,
  });

  // Fetch contacts (stakeholders)
  const { data: contacts = [] } = useQuery({
    queryKey: ['command-palette-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('id, name, email, role, partner_id, partners(company_name)')
        .order('name');
      if (error) throw error;
      return data.map((s): SearchResult => ({
        id: s.id,
        type: 'contact',
        title: s.name,
        subtitle: `${s.email}${(s.partners as any)?.company_name ? ` • ${(s.partners as any).company_name}` : ''}`,
        url: `/admin/stakeholders?contact=${s.id}`,
      }));
    },
    enabled: open,
  });

  // Fetch inventory (content_placements)
  const { data: inventory = [] } = useQuery({
    queryKey: ['command-palette-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_placements')
        .select('id, name, property, placement_type, status')
        .order('name');
      if (error) throw error;
      return data.map((i): SearchResult => ({
        id: i.id,
        type: 'inventory',
        title: i.name,
        subtitle: `${i.property} • ${i.placement_type} • ${i.status}`,
        url: `/admin?workspace=content_inventory&placement=${i.id}`,
      }));
    },
    enabled: open,
  });

  // Filter results based on search query
  const filterResults = useCallback((items: SearchResult[], query: string) => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.subtitle?.toLowerCase().includes(lowerQuery)
    );
  }, []);

  const filteredBrands = filterResults(brands, searchQuery);
  const filteredDeals = filterResults(deals, searchQuery);
  const filteredContacts = filterResults(contacts, searchQuery);
  const filteredInventory = filterResults(inventory, searchQuery);
  const filteredPages = filterResults(navigationPages, searchQuery);

  const hasResults =
    filteredBrands.length > 0 ||
    filteredDeals.length > 0 ||
    filteredContacts.length > 0 ||
    filteredInventory.length > 0 ||
    filteredPages.length > 0;

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setSearchQuery('');
    navigate(result.url);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search brands, deals, contacts, inventory, or pages..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No results found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Try a different keyword or browse the navigation
            </p>
          </div>
        </CommandEmpty>

        {filteredPages.length > 0 && (
          <CommandGroup heading="Pages">
            {filteredPages.map((page) => {
              const Icon = getPageIcon(page.url);
              return (
                <CommandItem
                  key={page.id}
                  value={page.title}
                  onSelect={() => handleSelect(page)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{page.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {filteredBrands.length > 0 && (
          <>
            {filteredPages.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Brands">
              {filteredBrands.slice(0, 5).map((brand) => (
                <CommandItem
                  key={brand.id}
                  value={brand.title}
                  onSelect={() => handleSelect(brand)}
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{brand.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredDeals.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Deals">
              {filteredDeals.slice(0, 5).map((deal) => (
                <CommandItem
                  key={deal.id}
                  value={`${deal.title} ${deal.subtitle}`}
                  onSelect={() => handleSelect(deal)}
                  className="cursor-pointer"
                >
                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{deal.title}</span>
                    {deal.subtitle && (
                      <span className="text-xs text-muted-foreground">{deal.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredContacts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contacts">
              {filteredContacts.slice(0, 5).map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`${contact.title} ${contact.subtitle}`}
                  onSelect={() => handleSelect(contact)}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{contact.title}</span>
                    {contact.subtitle && (
                      <span className="text-xs text-muted-foreground">{contact.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredInventory.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Inventory">
              {filteredInventory.slice(0, 5).map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function CommandPaletteTrigger() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  return (
    <button
      onClick={() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      }}
      className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 hover:bg-muted border border-border transition-colors"
      style={{ borderRadius: '0px' }}
    >
      <Search className="h-3 w-3" />
      <span className="hidden sm:inline">Search...</span>
      <kbd 
        className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
        style={{ borderRadius: '0px' }}
      >
        {isMac ? '⌘' : 'Ctrl'} K
      </kbd>
    </button>
  );
}
