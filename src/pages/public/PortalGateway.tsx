import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Briefcase, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Static gateway — no auth, no database, no async. Renders instantly.
 */
const PortalGateway = React.forwardRef<HTMLDivElement>(function PortalGateway(_props, _ref) {
  const handleHardReset = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <Helmet>
        <title>Partner Portal Access | Healthcare</title>
        <meta name="description" content="Admin login, partner login, or view the public brand directory." />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <Card className="rounded-none border-border border shadow-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                Partner Portal Access
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose how you'd like to continue
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button
                asChild
                className="w-full rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white h-11 font-medium"
              >
                <Link to="/admin/login" className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Login
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-none border-border h-11 font-medium"
              >
                <Link to="/partner/login" className="flex items-center justify-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Partner Login
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="w-full rounded-none text-muted-foreground hover:text-foreground h-11 font-medium"
              >
                <Link to="/directory" className="flex items-center justify-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  View Public Directory
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <button
        onClick={handleHardReset}
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 9999,
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '0.5rem 1rem',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        ⚠️ Hard Reset App
      </button>
    </>
  );
});

export default PortalGateway;
