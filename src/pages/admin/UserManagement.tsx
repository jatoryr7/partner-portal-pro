import { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  UserCog, 
  Search, 
  Loader2,
  Check,
  X,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UserWithRoles {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: Date;
  roles: ('admin' | 'partner')[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingRoles, setPendingRoles] = useState<{ admin: boolean; partner: boolean }>({ admin: false, partner: false });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map roles to users
      const roleMap = new Map<string, ('admin' | 'partner')[]>();
      roles?.forEach(r => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role as 'admin' | 'partner');
        roleMap.set(r.user_id, existing);
      });

      const usersWithRoles: UserWithRoles[] = (profiles || []).map(p => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        createdAt: new Date(p.created_at),
        roles: roleMap.get(p.id) || [],
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error loading users',
        description: 'Failed to fetch user data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openRoleDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setPendingRoles({
      admin: user.roles.includes('admin'),
      partner: user.roles.includes('partner'),
    });
    setRoleDialogOpen(true);
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const currentRoles = selectedUser.roles;
      const newRoles: ('admin' | 'partner')[] = [];
      if (pendingRoles.admin) newRoles.push('admin');
      if (pendingRoles.partner) newRoles.push('partner');

      // Determine roles to add and remove
      const toAdd = newRoles.filter(r => !currentRoles.includes(r));
      const toRemove = currentRoles.filter(r => !newRoles.includes(r));

      // Remove roles
      for (const role of toRemove) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id)
          .eq('role', role);
        
        if (error) throw error;
      }

      // Add roles
      for (const role of toAdd) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.id, role });
        
        if (error) throw error;
      }

      toast({
        title: 'Roles updated',
        description: `Successfully updated roles for ${selectedUser.email || selectedUser.fullName}`,
      });

      setRoleDialogOpen(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: 'Error updating roles',
        description: 'Failed to save role changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.fullName?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles.includes('admin')).length,
    partners: users.filter(u => u.roles.includes('partner')).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">View and manage user roles and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <UserCog className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Partners</p>
                <p className="text-2xl font-bold">{stats.partners}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user roles and access</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No users match your search' : 'No users found'}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {(user.fullName || user.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName || 'No name'}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.roles.length === 0 ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              No roles
                            </Badge>
                          ) : (
                            user.roles.map(role => (
                              <Badge 
                                key={role} 
                                variant={role === 'admin' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {role}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(user.createdAt, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRoleDialog(user)}
                        >
                          <UserCog className="w-4 h-4 mr-1" />
                          Manage Roles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Configure roles for {selectedUser?.fullName || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Admin Role */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <Label htmlFor="admin-role" className="font-medium">Admin</Label>
                  <p className="text-sm text-muted-foreground">
                    Full access to admin dashboard and user management
                  </p>
                </div>
              </div>
              <Switch
                id="admin-role"
                checked={pendingRoles.admin}
                onCheckedChange={(checked) => setPendingRoles(prev => ({ ...prev, admin: checked }))}
              />
            </div>

            {/* Partner Role */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <Label htmlFor="partner-role" className="font-medium">Partner</Label>
                  <p className="text-sm text-muted-foreground">
                    Access to partner portal for submitting campaigns
                  </p>
                </div>
              </div>
              <Switch
                id="partner-role"
                checked={pendingRoles.partner}
                onCheckedChange={(checked) => setPendingRoles(prev => ({ ...prev, partner: checked }))}
              />
            </div>

            {!pendingRoles.admin && !pendingRoles.partner && (
              <p className="text-sm text-destructive text-center">
                Warning: User will have no access if all roles are removed
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoles} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
