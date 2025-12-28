import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Megaphone, 
  Target, 
  Tv, 
  Mail, 
  PenTool,
  LogOut,
  Users,
  Kanban,
  ArrowLeftRight,
  UserCog,
  Building2
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const channelItems = [
  { title: 'Native', url: '/admin/native', icon: Megaphone },
  { title: 'Paid Social/Search', url: '/admin/paid-social', icon: Target },
  { title: 'Media', url: '/admin/media', icon: Tv },
  { title: 'Newsletter', url: '/admin/newsletter', icon: Mail },
  { title: 'Content Marketing', url: '/admin/content-marketing', icon: PenTool },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, roles, setActiveRole } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleSwitchRole = () => {
    setActiveRole('partner');
    navigate('/partner');
  };

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold text-sidebar-foreground">Command Center</h1>
              <p className="text-xs text-muted-foreground">Internal Dashboard</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/admin/queue" 
                    className="hover:bg-sidebar-accent/50" 
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <Kanban className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Campaign Queue</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/admin/stakeholders" 
                    className="hover:bg-sidebar-accent/50" 
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Stakeholders</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/admin/users" 
                    className="hover:bg-sidebar-accent/50" 
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    {!collapsed && <span>User Management</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/admin/brands" 
                    className="hover:bg-sidebar-accent/50" 
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Brand Directory</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
