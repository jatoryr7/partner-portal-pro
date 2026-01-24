import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPlaceholderPageProps {
  title: string;
  description?: string;
}

/**
 * Placeholder for admin routes not yet implemented (e.g. Analytics, Finance, Gateways).
 */
export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit -ml-2 rounded-none" asChild>
          <Link to="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Command Center
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">
          {description ?? "This section is coming soon."}
        </p>
      </div>
      <div className="rounded-none border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Content will be available here soon.</p>
      </div>
    </div>
  );
}

export function AdminAnalyticsPage() {
  return (
    <AdminPlaceholderPage
      title="Intelligence"
      description="Analytics, reporting, and insights. This section is coming soon."
    />
  );
}

export function AdminFinancePage() {
  return (
    <AdminPlaceholderPage
      title="Financials"
      description="Billing, contracts, and financial oversight. This section is coming soon."
    />
  );
}

export function AdminGatewaysPage() {
  return (
    <AdminPlaceholderPage
      title="External Gateways"
      description="Third-party access and API integrations. This section is coming soon."
    />
  );
}
