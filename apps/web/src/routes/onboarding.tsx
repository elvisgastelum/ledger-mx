import { useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { ApplyLayoutRequestSchema } from "@ledger-mx/contracts";

// Wizard step types
type WizardStep = 1 | 2 | 3 | 4;

interface WizardState {
  currentStep: WizardStep;
  selectedLayout: "blank" | "50-30-20" | null;
  completed: boolean;
}

const WIZARD_STORAGE_KEY = "ledger-mx-onboarding";

const STEPS: { number: WizardStep; title: string }[] = [
  { number: 1, title: "Welcome" },
  { number: 2, title: "Choose Layout" },
  { number: 3, title: "Income Groups" },
  { number: 4, title: "Summary" },
];

function OnboardingWizard() {
  const router = useRouter();
  const [wizardState, setWizardState] = useState<WizardState>(() => {
    // Load state from localStorage
    const saved = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as WizardState;
      } catch {
        // Ignore parse errors
      }
    }
    return {
      currentStep: 1,
      selectedLayout: null,
      completed: false,
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(wizardState));
  }, [wizardState]);

  const goToStep = (step: WizardStep) => {
    setWizardState((prev) => ({ ...prev, currentStep: step }));
  };

  const goNext = () => {
    setWizardState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 4) as WizardStep,
    }));
  };

  const goBack = () => {
    setWizardState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1) as WizardStep,
    }));
  };

  const selectLayout = (layout: "blank" | "50-30-20") => {
    setWizardState((prev) => ({ ...prev, selectedLayout: layout }));
  };

  const handleSubmit = async () => {
    if (!wizardState.selectedLayout) {
      setError("Please select a layout");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate with Zod schema
      const validated = ApplyLayoutRequestSchema.parse({
        layout: wizardState.selectedLayout,
      });

      // Call API
      const response = await fetch("/api/v1/onboarding/layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to apply layout: ${response.status}`
        );
      }

      const result = await response.json();

      // Mark wizard as completed
      setWizardState((prev) => ({ ...prev, completed: true }));

      // Clear localStorage
      localStorage.removeItem(WIZARD_STORAGE_KEY);

      // Redirect to dashboard
      router.navigate({ to: "/" });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setError(err.errors.map((e: z.ZodIssue) => e.message).join(", "));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If completed, show success message
  if (wizardState.completed) {
    return (
      <div className="onboarding-completed">
        <h1>Setup Complete!</h1>
        <p>Your category groups have been created.</p>
        <button onClick={() => router.navigate({ to: "/" })}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="onboarding-wizard" aria-label="Onboarding Wizard">
      <header>
        <h1>LedgerMx Setup</h1>
        <nav aria-label="Wizard steps">
          <ol className="step-indicator">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className={
                  wizardState.currentStep === step.number
                    ? "active"
                    : wizardState.currentStep > step.number
                      ? "completed"
                      : ""
                }
              >
                <span className="step-number">{step.number}</span>
                <span className="step-title">{step.title}</span>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <main>
        {wizardState.currentStep === 1 && (
          <Step1Welcome onNext={goNext} />
        )}
        {wizardState.currentStep === 2 && (
          <Step2LayoutSelection
            selectedLayout={wizardState.selectedLayout}
            onSelectLayout={selectLayout}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {wizardState.currentStep === 3 && (
          <Step3IncomeGroup onNext={goNext} onBack={goBack} />
        )}
        {wizardState.currentStep === 4 && (
          <Step4Summary
            selectedLayout={wizardState.selectedLayout}
            onBack={goBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}
      </main>
    </div>
  );
}

// Step 1: Welcome
function Step1Welcome({ onNext }: { onNext: () => void }) {
  return (
    <section aria-labelledby="welcome-heading">
      <h2 id="welcome-heading">Welcome to LedgerMx!</h2>
      <p>
        Let's set up your budget structure. This wizard will help you create
        category groups for organizing your expenses.
      </p>
      <ul>
        <li>Offline-first: Your data stays on your device</li>
        <li>Double-entry: Every transaction balances</li>
        <li>Envelopes: Allocate money to specific goals</li>
      </ul>
      <button onClick={onNext} aria-label="Start onboarding">
        Get Started
      </button>
    </section>
  );
}

// Step 2: Layout Selection
function Step2LayoutSelection({
  selectedLayout,
  onSelectLayout,
  onNext,
  onBack,
}: {
  selectedLayout: "blank" | "50-30-20" | null;
  onSelectLayout: (layout: "blank" | "50-30-20") => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const handleContinue = () => {
    if (selectedLayout) {
      onNext();
    }
  };

  return (
    <section aria-labelledby="layout-heading">
      <h2 id="layout-heading">Choose Your Budget Layout</h2>

      <div className="layout-options">
        <fieldset>
          <legend>Select a layout</legend>

          <label className="layout-option">
            <input
              type="radio"
              name="layout"
              value="blank"
              checked={selectedLayout === "blank"}
              onChange={() => onSelectLayout("blank")}
              aria-describedby="blank-description"
            />
            <div>
              <strong>Blank Layout</strong>
              <p id="blank-description">
                Start fresh with a single "General" group. Perfect for full
                customization.
              </p>
            </div>
          </label>

          <label className="layout-option">
            <input
              type="radio"
              name="layout"
              value="50-30-20"
              checked={selectedLayout === "50-30-20"}
              onChange={() => onSelectLayout("50-30-20")}
              aria-describedby="503020-description"
            />
            <div>
              <strong>50/30/20 Layout</strong>
              <p id="503020-description">
                Popular budgeting method: Need (50%), Want (30%), Savings (20%).
                Great for beginners.
              </p>
            </div>
          </label>
        </fieldset>
      </div>

      <div className="wizard-actions">
        <button onClick={onBack}>Back</button>
        <button onClick={handleContinue} disabled={!selectedLayout}>
          Next
        </button>
      </div>
    </section>
  );
}

// Step 3: Income Group
function Step3IncomeGroup({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <section aria-labelledby="income-heading">
      <h2 id="income-heading">Income Categories</h2>
      <p>
        Income categories are separate from expense categories. You can create an
        "Income" group to track different income sources like:
      </p>
      <ul>
        <li>Salary</li>
        <li>Freelance</li>
        <li>Investments</li>
      </ul>
      <p>
        You can set this up later in Settings. For now, let's continue with the
        category groups.
      </p>

      <div className="wizard-actions">
        <button onClick={onBack}>Back</button>
        <button onClick={onNext}>Next</button>
      </div>
    </section>
  );
}

// Step 4: Summary
function Step4Summary({
  selectedLayout,
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: {
  selectedLayout: "blank" | "50-30-20" | null;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}) {
  const layoutInfo =
    selectedLayout === "blank"
      ? {
          name: "Blank Layout",
          groups: [{ name: "General", description: "General expenses" }],
        }
      : {
          name: "50/30/20 Layout",
          groups: [
            { name: "Need", description: "Essentials (50%)" },
            { name: "Want", description: "Discretionary (30%)" },
            { name: "Savings", description: "Goals (20%)" },
          ],
        };

  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading">Summary</h2>

      <p>
        You selected: <strong>{layoutInfo.name}</strong>
      </p>

      <h3>Category Groups to be created:</h3>
      <ul>
        {layoutInfo.groups.map((group) => (
          <li key={group.name}>
            <strong>{group.name}</strong>: {group.description}
          </li>
        ))}
      </ul>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="wizard-actions">
        <button onClick={onBack} disabled={isSubmitting}>
          Back
        </button>
        <button onClick={onSubmit} disabled={isSubmitting} aria-label="Create category groups">
          {isSubmitting ? "Creating..." : "Create Groups"}
        </button>
      </div>
    </section>
  );
}

export default OnboardingWizard;
