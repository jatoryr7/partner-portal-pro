import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Building2, Users, Palette, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepCompanyInfo } from "./steps/StepCompanyInfo";
import { StepCreativeAssets } from "./steps/StepCreativeAssets";
import { StepStakeholders } from "./steps/StepStakeholders";
import { StepSummary } from "./steps/StepSummary";
import { PartnerData, initialPartnerData } from "@/types/partner";

// Re-export types for backward compatibility
export { type PartnerData, type Stakeholder, type ChannelData } from "@/types/partner";

const steps = [
  { id: 1, title: "Company Info", icon: Building2 },
  { id: 2, title: "Creative Assets", icon: Palette },
  { id: 3, title: "Stakeholders", icon: Users },
  { id: 4, title: "Review & Book", icon: Calendar },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [partnerData, setPartnerData] = useState<PartnerData>(initialPartnerData);

  const calculateProgress = () => {
    let completed = 0;
    const total = 10; // Company name + 5 channels + contacts + dates + final review

    if (partnerData.companyName) completed++;
    if (partnerData.primaryContact.name && partnerData.primaryContact.email) completed++;
    if (partnerData.targetLaunchDate) completed++;
    if (partnerData.stakeholders.length > 0) completed++;
    
    Object.values(partnerData.channels).forEach((channel) => {
      if (channel.completed) completed++;
    });

    if (currentStep === 4) completed++;

    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const updatePartnerData = (updates: Partial<PartnerData>) => {
    setPartnerData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">HC</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Partner Portal</h1>
                <p className="text-sm text-muted-foreground">Healthcare Creative Onboarding</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{progress}% Complete</p>
                <div className="w-32 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                  <motion.div
                    className="h-full gradient-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Step Indicators */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2 sm:gap-4">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                      isActive && "bg-primary text-primary-foreground shadow-glow",
                      isCompleted && "bg-success/10 text-success",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
                        isActive && "bg-primary-foreground/20",
                        isCompleted && "bg-success/20"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="hidden sm:inline font-medium">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-8 sm:w-16 h-0.5 mx-2 transition-all duration-300",
                        currentStep > step.id ? "bg-success" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <StepCompanyInfo
                data={partnerData}
                onUpdate={updatePartnerData}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <StepCreativeAssets
                data={partnerData}
                onUpdate={updatePartnerData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <StepStakeholders
                data={partnerData}
                onUpdate={updatePartnerData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <StepSummary
                data={partnerData}
                onBack={handleBack}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
