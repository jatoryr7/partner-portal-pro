import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Map, X, TrendingUp, BarChart3, DollarSign, Stethoscope,
  Users, Target, Building2, Package, FileText, AlertCircle,
  CreditCard, Activity, Shield, ClipboardList, ChevronRight,
  Zap, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PortalSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: {
    id: string;
    label: string;
    description: string;
    route: string;
    workspace?: string;
    tab?: string;
  }[];
}

const portalSections: PortalSection[] = [
  {
    id: 'sales',
    label: 'Sales Workspace',
    icon: TrendingUp,
    color: 'text-emerald-500',
    items: [
      { id: 'lead-capture', label: 'Lead Capture', description: 'New prospect intake forms', route: '/admin/deals', workspace: 'sales_bd' },
      { id: 'pipeline', label: 'Pipeline', description: 'Deal stages & funnel management', route: '/admin/deals', workspace: 'sales_bd' },
      { id: 'brand-submissions', label: 'Brand Submissions', description: 'Partner onboarding queue', route: '/admin/queue', workspace: 'sales_bd' },
    ]
  },
  {
    id: 'operations',
    label: 'Operations Workspace',
    icon: BarChart3,
    color: 'text-blue-500',
    items: [
      { id: 'k1-inventory', label: 'K1 Inventory', description: 'Content cluster management', route: '/admin?workspace=operations', tab: 'inventory' },
      { id: 'analyst-briefing', label: 'Analyst Briefing Desk', description: 'Market analysis & reports', route: '/admin?workspace=operations', tab: 'performance' },
      { id: 'managed-brands', label: 'Managed Brands', description: 'Active partner directory', route: '/admin/brands', workspace: 'operations' },
    ]
  },
  {
    id: 'financial',
    label: 'Financial Workspace',
    icon: DollarSign,
    color: 'text-amber-500',
    items: [
      { id: 'monthly-billables', label: 'Monthly Billables', description: 'Revenue reconciliation', route: '/admin?workspace=operations', tab: 'billables' },
      { id: 'api-health', label: 'API Health', description: 'Network connection status', route: '/admin?workspace=operations', tab: 'billables' },
      { id: 'payout-reconciliation', label: 'Payout Reconciliation', description: 'Delta analysis & disputes', route: '/admin?workspace=operations', tab: 'billables' },
    ]
  },
  {
    id: 'medical',
    label: 'Medical Workspace',
    icon: Stethoscope,
    color: 'text-teal-500',
    items: [
      { id: 'review-queue', label: 'Review Queue', description: 'Pending medical evaluations', route: '/admin?workspace=operations', tab: 'medical' },
      { id: 'iotp-status', label: 'IOTP Status', description: 'In-Order-To-Pass tracking', route: '/admin?workspace=operations', tab: 'medical' },
      { id: 'standards-database', label: 'Standards Database', description: 'Clinical guidelines & protocols', route: '/admin?workspace=operations', tab: 'medical' },
    ]
  },
];

const quickTasks = [
  { id: 'new-lead', label: 'Capture New Lead', icon: Users, route: '/admin/deals' },
  { id: 'review-submission', label: 'Review Submission', icon: ClipboardList, route: '/admin/queue' },
  { id: 'approve-billable', label: 'Approve Billables', icon: CreditCard, route: '/admin?workspace=operations' },
  { id: 'medical-review', label: 'Start Medical Review', icon: Shield, route: '/admin?workspace=operations' },
];

interface PortalMapMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortalMapMenu({ isOpen, onClose }: PortalMapMenuProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

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

  const handleNavigate = (route: string, workspace?: string, tab?: string) => {
    if (workspace) {
      setSearchParams({ workspace });
    }
    navigate(route);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          
          {/* Portal Map Panel */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-full max-w-4xl bg-card border-r border-border shadow-2xl z-[101] overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-none">
                    <Map className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-scientific text-foreground">Portal Map</h2>
                    <p className="text-sm text-muted-foreground">Navigate the Command Center</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-none hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Quick Tasks */}
              <div className="p-6 border-b border-border bg-secondary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">Quick Tasks</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickTasks.map((task) => {
                    const Icon = task.icon;
                    return (
                      <button
                        key={task.id}
                        onClick={() => handleNavigate(task.route)}
                        className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-none hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-foreground">{task.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workspace Sections */}
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portalSections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                      <div
                        key={section.id}
                        className={cn(
                          "border border-border rounded-none p-5 transition-all",
                          hoveredSection === section.id ? "border-primary bg-primary/5" : "bg-card"
                        )}
                        onMouseEnter={() => setHoveredSection(section.id)}
                        onMouseLeave={() => setHoveredSection(null)}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <SectionIcon className={cn("w-5 h-5", section.color)} />
                          <h3 className="font-semibold text-foreground">{section.label}</h3>
                        </div>
                        <div className="space-y-2">
                          {section.items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleNavigate(item.route, item.workspace, item.tab)}
                              className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/60 rounded-none transition-all group"
                            >
                              <div className="text-left">
                                <span className="text-sm font-medium text-foreground block">{item.label}</span>
                                <span className="text-xs text-muted-foreground">{item.description}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-secondary/20">
                <p className="text-xs text-muted-foreground text-center">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded-sm text-foreground font-mono">ESC</kbd> to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function PortalMapTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="gap-2 rounded-none border border-border hover:border-primary hover:bg-primary/5"
    >
      <Map className="w-4 h-4" />
      <span className="hidden sm:inline">Command Menu</span>
    </Button>
  );
}
