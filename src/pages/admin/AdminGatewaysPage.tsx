import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Globe, Users, Plug, UserPlus, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const tabTriggerClass =
  "rounded-none gap-2 data-[state=active]:bg-[#1ABC9C]/10 data-[state=active]:text-[#1ABC9C] data-[state=active]:border-b-2 data-[state=active]:border-[#1ABC9C]";

export default function AdminGatewaysPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePartnerId, setInvitePartnerId] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ["partners-for-invite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, company_name")
        .order("company_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Get partner users by joining user_roles with profiles
  const { data: accessLog = [], isLoading: accessLogLoading, refetch: refetchAccessLog } = useQuery({
    queryKey: ["partner-access-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role,
          profiles!inner(email, full_name)
        `)
        .eq("role", "partner");
      
      if (error) throw error;
      
      // Transform data to expected format
      return (data ?? []).map((row: any) => ({
        user_id: row.user_id,
        email: row.profiles?.email ?? null,
        organization_name: row.profiles?.full_name ?? null,
        last_sign_in_at: null,
      }));
    },
  });

  const handleMaintenanceToggle = (checked: boolean) => {
    setMaintenanceMode(checked);
    toast({ 
      title: checked ? "Maintenance Mode On" : "Maintenance Mode Off", 
      description: "This is a UI toggle only. Full implementation coming soon." 
    });
  };

  const handleInvitePartner = async () => {
    if (!inviteEmail?.trim() || !invitePartnerId) {
      toast({ title: "Validation", description: "Enter email and select an organization.", variant: "destructive" });
      return;
    }
    setInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-partner", {
        body: { email: inviteEmail.trim(), partnerId: invitePartnerId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Invite sent", description: `${inviteEmail} has been invited.` });
      setInviteEmail("");
      setInvitePartnerId("");
      setInviteOpen(false);
      refetchAccessLog();
    } catch (e: any) {
      toast({ title: "Invite failed", description: e?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "partner");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-access-log"] });
      toast({ title: "Access revoked" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const formatLastSignIn = (iso: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>External Gateways | Command Center</title>
      </Helmet>

      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit -ml-2 rounded-none" asChild>
          <Link to="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Command Center
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">External Gateways</h1>
        <p className="text-muted-foreground">
          Control public directory, partner access, and API integrations.
        </p>
      </div>

      <Tabs defaultValue="public-directory" className="space-y-4">
        <TabsList className="w-full max-w-2xl justify-start h-auto flex-wrap gap-1 rounded-none border-border bg-muted/30 p-1">
          <TabsTrigger value="public-directory" className={tabTriggerClass}>
            <Globe className="h-4 w-4" />
            Public Directory (CMS)
          </TabsTrigger>
          <TabsTrigger value="partner-access" className={tabTriggerClass}>
            <Users className="h-4 w-4" />
            Partner Access
          </TabsTrigger>
          <TabsTrigger value="api-integrations" className={tabTriggerClass}>
            <Plug className="h-4 w-4" />
            API Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public-directory" className="space-y-6 mt-6">
          <Card className="rounded-none border-border">
            <CardHeader>
              <CardTitle className="text-lg">Emergency Controls</CardTitle>
              <p className="text-sm text-muted-foreground">Disable public access during maintenance.</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance-mode" className="cursor-pointer">
                  Maintenance Mode
                </Label>
                <Switch
                  id="maintenance-mode"
                  checked={maintenanceMode}
                  onCheckedChange={handleMaintenanceToggle}
                  className="data-[state=checked]:bg-[#1ABC9C]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Toggle saves immediately. When on, public site access can be disabled.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partner-access" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Partner Access</h3>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none sm:rounded-none border-border sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Partner</DialogTitle>
                  <DialogDescription>
                    Enter email and select organization. A user will be created and linked to that brand.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. marketing@oura.com"
                      className="rounded-none"
                      disabled={inviteLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <Select
                      value={invitePartnerId}
                      onValueChange={setInvitePartnerId}
                      disabled={partnersLoading || inviteLoading}
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="rounded-none">
                            {p.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)} className="rounded-none" disabled={inviteLoading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInvitePartner}
                    disabled={inviteLoading || !inviteEmail?.trim() || !invitePartnerId}
                    className="rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
                  >
                    {inviteLoading ? "Sending…" : "Send Invite"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="rounded-none border-border">
            <CardHeader>
              <CardTitle className="text-lg">Access Log</CardTitle>
              <p className="text-sm text-muted-foreground">Partner logins and organization. Revoke access to remove their role.</p>
            </CardHeader>
            <CardContent className="p-0">
              {accessLogLoading ? (
                <div className="py-12 text-center text-muted-foreground">Loading…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="rounded-none h-9 px-4 font-medium">Email</TableHead>
                      <TableHead className="rounded-none h-9 px-4 font-medium">Organization</TableHead>
                      <TableHead className="rounded-none h-9 px-4 font-medium">Last Sign-in</TableHead>
                      <TableHead className="rounded-none h-9 px-4 font-medium w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLog.length === 0 ? (
                      <TableRow className="border-border">
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          No partner users yet. Use &quot;Invite Partner&quot; to add one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      accessLog.map((row: any) => (
                        <TableRow key={row.user_id} className="border-border">
                          <TableCell className="py-2 px-4 text-sm">{row.email ?? "—"}</TableCell>
                          <TableCell className="py-2 px-4 text-sm">{row.organization_name ?? "—"}</TableCell>
                          <TableCell className="py-2 px-4 text-sm text-muted-foreground">
                            {formatLastSignIn(row.last_sign_in_at)}
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-none border-destructive/50 text-destructive hover:bg-destructive/10"
                              disabled={revokeMutation.isPending}
                              onClick={() => revokeMutation.mutate(row.user_id)}
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Revoke Access
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-integrations" className="space-y-6 mt-6">
          <Card className="rounded-none border-border">
            <CardHeader>
              <CardTitle className="text-lg">API Integrations</CardTitle>
              <p className="text-sm text-muted-foreground">Technical settings and API keys.</p>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Technical settings will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
