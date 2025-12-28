import { motion } from 'framer-motion';
import { Shield, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AppRole = 'admin' | 'partner';

interface RoleSelectorProps {
  roles: AppRole[];
  onSelect: (role: AppRole) => void;
}

const ROLE_CONFIG: Record<AppRole, { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  gradient: string;
}> = {
  admin: {
    icon: Shield,
    title: 'Admin Dashboard',
    description: 'Manage campaigns, review submissions, and oversee partner activity.',
    gradient: 'from-primary to-accent',
  },
  partner: {
    icon: Users,
    title: 'Partner Portal',
    description: 'Submit creative assets, track campaign progress, and manage your submissions.',
    gradient: 'from-accent to-primary',
  },
};

export function RoleSelector({ roles, onSelect }: RoleSelectorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            You have access to multiple dashboards. Choose where you'd like to go.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;

            return (
              <motion.div
                key={role}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer group relative overflow-hidden transition-all duration-300",
                    "hover:shadow-lg hover:border-primary/50"
                  )}
                  onClick={() => onSelect(role)}
                >
                  {/* Gradient overlay on hover */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                    `bg-gradient-to-br ${config.gradient}`
                  )} />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        `bg-gradient-to-br ${config.gradient}`
                      )}>
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                      {config.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {config.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          You can switch between dashboards at any time from the navigation menu.
        </p>
      </motion.div>
    </div>
  );
}
