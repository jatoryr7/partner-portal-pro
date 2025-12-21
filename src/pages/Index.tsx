import { OnboardingWizard } from "@/components/OnboardingWizard";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Partner Onboarding Portal | Healthcare Creative</title>
        <meta 
          name="description" 
          content="Submit your creative assets, affiliate links, and stakeholder information for our healthcare marketing partnership program."
        />
      </Helmet>
      <OnboardingWizard />
    </>
  );
};

export default Index;
