import { Link } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Placeholder for the Public Directory at /.
 * Part of the Public Zone in the Three-Door routing architecture.
 */
export default function PublicDirectoryPlaceholder() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Public Directory
          </h1>
          <p className="text-muted-foreground">
            The brand directory and public discovery experience will live here.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/partner">
              Partner Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/admin">Admin</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
