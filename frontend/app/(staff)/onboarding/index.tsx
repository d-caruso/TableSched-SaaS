import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { RequireOrgAdmin } from '@core/components/auth/RequireOrgAdmin';
import { WizardShell } from '@core/components/onboarding/WizardShell';
import { IdentityStep } from '@core/components/onboarding/steps/IdentityStep';
import { OpeningHoursStep } from '@core/components/onboarding/steps/OpeningHoursStep';
import { RoomsStep } from '@core/components/onboarding/steps/RoomsStep';
import { DepositStep } from '@core/components/onboarding/steps/DepositStep';
import { BillingAccountStep } from '@core/components/onboarding/steps/BillingAccountStep';
import { FirstManagerStep } from '@core/components/onboarding/steps/FirstManagerStep';
import { ReviewStep } from '@core/components/onboarding/steps/ReviewStep';
import { useOnboardingWizard } from '@core/lib/onboarding/useOnboardingWizard';
import type { WizardStep } from '@core/lib/onboarding/useOnboardingWizard';
import { PlanPickStep } from '@saas/components/signup/PlanPickStep';
import type { OnboardingPayload } from '@core/lib/api/types';

// SaaS onboarding: step 0 is the plan-pick (SaaS-only).
// Core wizard steps 1-7 follow after the plan is chosen.
const ON_PLAN_STEP = true;

export default function OnboardingScreen() {
  const router = useRouter();
  const wizard = useOnboardingWizard();
  const [onPlanStep, setOnPlanStep] = useState(ON_PLAN_STEP);

  function handleCancel() {
    router.replace('/select-tenant');
  }

  if (onPlanStep) {
    return (
      <RequireOrgAdmin>
        <PlanPickStep onSelect={() => setOnPlanStep(false)} />
      </RequireOrgAdmin>
    );
  }

  function renderStep() {
    switch (wizard.step as WizardStep) {
      case 1:
        return (
          <IdentityStep
            value={wizard.payload.identity ?? {}}
            errors={wizard.errors}
            onChange={partial =>
              wizard.update({ identity: { ...(wizard.payload.identity ?? {} as OnboardingPayload['identity']), ...partial } })
            }
          />
        );
      case 2:
        return (
          <OpeningHoursStep
            value={wizard.payload.opening_hours ?? []}
            errors={wizard.errors}
            onChange={hours => wizard.update({ opening_hours: hours })}
          />
        );
      case 3:
        return (
          <RoomsStep
            value={wizard.payload.rooms ?? []}
            errors={wizard.errors}
            onChange={rooms => wizard.update({ rooms })}
          />
        );
      case 4:
        return (
          <DepositStep
            value={wizard.payload.deposit ?? {}}
            errors={wizard.errors}
            onChange={partial =>
              wizard.update({ deposit: { ...(wizard.payload.deposit ?? {} as OnboardingPayload['deposit']), ...partial } })
            }
          />
        );
      case 5:
        return (
          <BillingAccountStep
            organizationId={wizard.payload.identity?.organization_id}
            value={wizard.payload.billing_account_id}
            errors={wizard.errors}
            onChange={id => wizard.update({ billing_account_id: id })}
          />
        );
      case 6:
        return (
          <FirstManagerStep
            value={wizard.payload.first_manager ?? {}}
            errors={wizard.errors}
            onChange={partial =>
              wizard.update({ first_manager: { ...(wizard.payload.first_manager ?? {} as OnboardingPayload['first_manager']), ...partial } })
            }
          />
        );
      case 7:
        return <ReviewStep payload={wizard.payload} />;
      default:
        return null;
    }
  }

  return (
    <RequireOrgAdmin>
      <WizardShell
        step={wizard.step}
        isFirstStep={wizard.isFirstStep}
        isLastStep={wizard.isLastStep}
        onNext={wizard.next}
        onBack={wizard.isFirstStep ? () => setOnPlanStep(true) : wizard.back}
        onCancel={handleCancel}
      >
        {renderStep()}
      </WizardShell>
    </RequireOrgAdmin>
  );
}
