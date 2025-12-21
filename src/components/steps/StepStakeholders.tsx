import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerData, Stakeholder } from "@/types/partner";
import { useToast } from "@/hooks/use-toast";

interface StepStakeholdersProps {
  data: PartnerData;
  onUpdate: (updates: Partial<PartnerData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const createEmptyStakeholder = (): Stakeholder => ({
  id: crypto.randomUUID(),
  name: "",
  role: "",
  email: "",
  phone: "",
});

export function StepStakeholders({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepStakeholdersProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(
    data.stakeholders.length > 0 ? data.stakeholders : [createEmptyStakeholder()]
  );
  const { toast } = useToast();

  const addStakeholder = () => {
    setStakeholders([...stakeholders, createEmptyStakeholder()]);
  };

  const removeStakeholder = (id: string) => {
    if (stakeholders.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one stakeholder is required.",
        variant: "destructive",
      });
      return;
    }
    setStakeholders(stakeholders.filter((s) => s.id !== id));
  };

  const updateStakeholder = (id: string, field: keyof Stakeholder, value: string) => {
    setStakeholders(
      stakeholders.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = () => {
    // Validate stakeholders
    for (const stakeholder of stakeholders) {
      if (!stakeholder.name.trim()) {
        toast({
          title: "Name required",
          description: "Please enter a name for all stakeholders.",
          variant: "destructive",
        });
        return;
      }

      if (!stakeholder.email.trim()) {
        toast({
          title: "Email required",
          description: `Please enter an email for ${stakeholder.name || "the stakeholder"}.`,
          variant: "destructive",
        });
        return;
      }

      if (!validateEmail(stakeholder.email)) {
        toast({
          title: "Invalid email",
          description: `Please enter a valid email for ${stakeholder.name}.`,
          variant: "destructive",
        });
        return;
      }
    }

    onUpdate({ stakeholders });
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg border border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success-light flex items-center justify-center">
              <Users className="h-6 w-6 text-success" />
            </div>
            <div>
              <CardTitle className="text-2xl">Stakeholder Information</CardTitle>
              <CardDescription className="text-base mt-1">
                Add your team's point of contact details for post-deal communication.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {stakeholders.map((stakeholder, index) => (
            <div
              key={stakeholder.id}
              className="p-6 bg-secondary/30 rounded-xl space-y-4 relative border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">
                  Contact {index + 1}
                </h3>
                {stakeholders.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStakeholder(stakeholder.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${stakeholder.id}`}>
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`name-${stakeholder.id}`}
                    placeholder="John Smith"
                    value={stakeholder.name}
                    onChange={(e) =>
                      updateStakeholder(stakeholder.id, "name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`role-${stakeholder.id}`}>Role / Title</Label>
                  <Input
                    id={`role-${stakeholder.id}`}
                    placeholder="Marketing Director"
                    value={stakeholder.role}
                    onChange={(e) =>
                      updateStakeholder(stakeholder.id, "role", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`email-${stakeholder.id}`}>
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`email-${stakeholder.id}`}
                    type="email"
                    placeholder="john@company.com"
                    value={stakeholder.email}
                    onChange={(e) =>
                      updateStakeholder(stakeholder.id, "email", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${stakeholder.id}`}>Phone Number</Label>
                  <Input
                    id={`phone-${stakeholder.id}`}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={stakeholder.phone}
                    onChange={(e) =>
                      updateStakeholder(stakeholder.id, "phone", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addStakeholder}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Contact
          </Button>

          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="gradient" onClick={handleNext}>
              Review Submission
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
