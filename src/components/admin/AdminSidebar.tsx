import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut,
  ArrowLeftRight,
  Building2,
  Briefcase,
  Package,
  Users,
  Compass,
  BarChart3,
  Megaphone,
  Target,
  Tv,
  Mail,
  PenTool,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

// Primary workspaces as requested
const primaryWorkspaces = [
  { title: 'Sales / BD', url: '/admin?workspace=business_dev', icon: Briefcase, color: 'text-emerald-500' },
  { title: 'Operations', url: '/admin?workspace=operations', icon: BarChart3, color: 'text-orange-500' },
  { title: 'Inventory', url: '/admin?workspace=content_explorer', icon: Compass, color: 'text-teal-500' },
  { title: 'Partner Success', url: '/admin?workspace=partner_mgmt', icon: Users, color: 'text-cyan-500' },
];

const quickLinks = [
  { title: 'Brand Directory', url: '/admin/brands', icon: Building2 },
  { title: 'Deals CRM', url: '/admin/deals', icon: Briefcase },
];

const channelItems = [
  { title: 'Native', url: '/admin/native', icon: Megaphone },
  { title: 'Paid Social', url: '/admin/paid-social', icon: Target },
  { title: 'Media', url: '/admin/media', icon: Tv },
  { title: 'Newsletter', url: '/admin/newsletter', icon: Mail },
  { title: 'Content', url: '/admin/content-marketing', icon: PenTool },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, roles, setActiveRole } = useAuth();
  const currentPath = location.pathname + location.search;

  const isActive = (path: string) => {
    if (path.includes('?workspace=')) {
      return currentPath.includes(path.split('?workspace=')[1]);
    }
    return location.pathname === path;
  };

  const handleSwitchRole = () => {
    setActiveRole('partner');
    navigate('/partner');
  };

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold text-sidebar-foreground">Command Center</h1>
              <p className="text-xs text-muted-foreground">Unified Workspace</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary Workspaces */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/admin" 
                    end 
                    className="hover:bg-sidebar-accent/50" 
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {primaryWorkspaces.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="hover:bg-sidebar-accent/50" 
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className={`mr-2 h-4 w-4 ${item.color}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <Separator className="my-2" />}

        {/* Quick Links */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="hover:bg-sidebar-accent/50" 
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <Separator className="my-2" />}

        {/* Channels */}
        <SidebarGroup>
          <SidebarGroupLabel>Channels</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {channelItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="hover:bg-sidebar-accent/50" 
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-1">
        {roles.includes('partner') && (
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleSwitchRole}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            {!collapsed && <span>Switch to Partner</span>}
          </Button>
        )}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
