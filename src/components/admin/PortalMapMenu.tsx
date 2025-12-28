import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LayoutGrid, X, ChevronRight, BarChart3, DollarSign, 
  Microscope, Megaphone, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLink {
  name: string;
  path: string;
  workspace?: string;
}

interface NavSection {
  category: string;
  icon: React.ReactNode;
  links: NavLink[];
}

// Mapping based on site flow diagram
const navMap: NavSection[] = [
  {
    category: "Growth & Sales",
    icon: <BarChart3 className="w-5 h-5" />,
    links: [
      { name: "Sales Pipeline", path: "/admin/deals", workspace: "sales_bd" },
      { name: "Brand Submissions", path: "/admin/queue", workspace: "sales_bd" },
      { name: "Deals CRM", path: "/admin/deals", workspace: "sales_bd" }
    ]
  },
  {
    category: "Operations & Intelligence",
    icon: <Megaphone className="w-5 h-5" />,
    links: [
      { name: "Inventory Explorer (K1s)", path: "/admin/queue", workspace: "operations" },
      { name: "Analyst Briefing Desk", path: "/admin/queue", workspace: "operations" },
      { name: "Partner Success", path: "/admin/stakeholders", workspace: "partner_success" }
    ]
  },
  {
    category: "Medical Integrity",
    icon: <Microscope className="w-5 h-5" />,
    links: [
      { name: "Medical Review Desk", path: "/admin/queue", workspace: "operations" },
      { name: "IOTP Management", path: "/admin/queue", workspace: "operations" },
      { name: "Standards Database", path: "/admin/settings" }
    ]
  },
  {
    category: "Financials",
    icon: <DollarSign className="w-5 h-5" />,
    links: [
      { name: "Monthly Billables", path: "/admin/queue", workspace: "operations" },
      { name: "Network API Status", path: "/admin/queue", workspace: "operations" }
    ]
  }
];

interface PortalMapMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortalMapMenu({ isOpen, onClose }: PortalMapMenuProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleNavigate = (link: NavLink) => {
    if (link.workspace) {
      setSearchParams({ workspace: link.workspace });
    }
    navigate(link.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#F9FAFB] animate-in fade-in duration-200"
      style={{ borderRadius: '0px' }}
    >
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12 border-b border-border pb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Command Center Portal Map</h2>
            <p className="text-muted-foreground">Unified workspace for all team functions</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted text-muted-foreground transition-colors"
            style={{ borderRadius: '0px' }}
          >
            <X size={32} />
          </button>
        </header>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {navMap.map((section) => (
            <div key={section.category} className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 text-healthcare-teal font-bold uppercase tracking-wider text-xs">
                {section.icon}
                {section.category}
              </div>
              
              {/* Section Links */}
              <div className="flex flex-col border-l border-border">
                {section.links.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavigate(link)}
                    className={cn(
                      "group flex justify-between items-center py-3 px-4",
                      "hover:bg-muted border-b border-transparent hover:border-healthcare-teal",
                      "transition-all text-left"
                    )}
                    style={{ borderRadius: '0px' }}
                  >
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {link.name}
                    </span>
                    <ChevronRight 
                      size={14} 
                      className="text-muted-foreground/50 group-hover:text-healthcare-teal transition-colors" 
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with keyboard hint */}
        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 bg-muted text-foreground font-mono" style={{ borderRadius: '0px' }}>ESC</kbd> to close
            {' · '}
            <kbd className="px-1.5 py-0.5 bg-muted text-foreground font-mono" style={{ borderRadius: '0px' }}>⌘K</kbd> for quick search
          </p>
        </div>
      </div>
    </div>
  );
}

export function PortalMapTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2",
        "bg-card border border-border hover:bg-muted",
        "transition-colors text-foreground font-medium"
      )}
      style={{ borderRadius: '0px' }}
    >
      <LayoutGrid size={18} className="text-healthcare-teal" />
      <span className="hidden sm:inline">Portal Map</span>
    </button>
  );
}
