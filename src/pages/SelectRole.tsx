import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleCard {
  id: string;
  title: string;
  description: string;
  icon: typeof Shield;
  path: string;
  color: string;
}

const ROLES: RoleCard[] = [
  {
    id: 'admin',
    title: 'Admin',
    description: 'Manage campaigns, review assets, and oversee all partner activities.',
    icon: Shield,
    path: '/admin',
    color: 'border-primary/50 hover:border-primary',
  },
  {
    id: 'partner',
    title: 'Partner',
    description: 'Submit creative assets, track campaign status, and manage your partnership.',
    icon: Users,
    path: '/partner',
    color: 'border-primary/50 hover:border-primary',
  },
  {
    id: 'stakeholder',
    title: 'Stakeholder',
    description: 'View campaign progress and provide feedback on creative assets.',
    icon: Eye,
    path: '/partner', // Stakeholders view partner dashboard
    color: 'border-primary/50 hover:border-primary',
  },
];

export default function SelectRole() {
  const navigate = useNavigate();

  const handleRoleSelect = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Welcome</h1>
          <p className="text-lg text-muted-foreground">
            Select your role to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                onClick={() => handleRoleSelect(role.path)}
                className={cn(
                  "cursor-pointer transition-all duration-300 ease-in-out",
                  "hover:scale-105 hover:shadow-xl hover:bg-accent/50",
                  "border-2 active:scale-100",
                  role.color
                )}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-primary/10 p-4 transition-all duration-300 hover:bg-primary/20 hover:scale-110">
                      <Icon className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{role.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base leading-relaxed min-h-[3rem]">
                    {role.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
