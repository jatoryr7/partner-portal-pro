import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Briefcase,
  BrainCircuit,
  ShieldCheck,
  DollarSign,
  Globe,
  type LucideIcon,
} from "lucide-react";

const PILLARS: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}[] = [
  {
    title: "Growth & Sales",
    description: "Manage pipelines and deals.",
    icon: TrendingUp,
    href: "/admin/deals",
  },
  {
    title: "Operations",
    description: "Campaign queue, inventory, and day-to-day ops.",
    icon: Briefcase,
    href: "/admin/queue",
  },
  {
    title: "Intelligence",
    description: "Analytics, reporting, and insights.",
    icon: BrainCircuit,
    href: "/admin/analytics",
  },
  {
    title: "Medical Integrity",
    description: "Medical review, standards, and compliance.",
    icon: ShieldCheck,
    href: "/admin/medical-review",
  },
  {
    title: "Financials",
    description: "Billing, contracts, and financial oversight.",
    icon: DollarSign,
    href: "/admin/finance",
  },
  {
    title: "External Gateways",
    description: "Third-party access and API integrations.",
    icon: Globe,
    href: "/admin/gateways",
  },
];

function PillarCard({
  title,
  description,
  icon: Icon,
  href,
}: (typeof PILLARS)[number]) {
  return (
    <Link to={href} className="block group">
      <Card className="h-full rounded-none border-border bg-card transition-colors hover:border-[#1ABC9C] hover:bg-[#1ABC9C]/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-muted text-muted-foreground group-hover:bg-[#1ABC9C]/20 group-hover:text-[#1ABC9C]">
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Admin";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, {displayName}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((pillar) => (
          <PillarCard key={pillar.href} {...pillar} />
        ))}
      </div>
    </div>
  );
}
