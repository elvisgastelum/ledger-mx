import { useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { ApplyLayoutRequestSchema } from "@ledger-mx/contracts";
import { tsr } from "../lib/ts-rest-client";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PageHeader } from "../components/ui/page-header";

// Helper to load persisted onboarding state from localStorage
function loadPersistedState(): {
  wizardState: WizardState;
  selectedLayout: LayoutFormValues["selectedLayout"];
} {
  const saved = localStorage.getItem(WIZARD_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        wizardState: {
          currentStep: parsed.currentStep ?? 1,
          completed: parsed.completed ?? false,
        },
        selectedLayout: parsed.selectedLayout ?? undefined,
      };
    } catch {
      // Ignore parse errors
    }
  }
  return {
    wizardState: { currentStep: 1, completed: false },
    selectedLayout: undefined,
  };
}

// Wizard step types
type WizardStep = 1 | 2 | 3 | 4;

interface WizardState {
  currentStep: WizardStep;
  completed: boolean;
}

interface LayoutFormValues {
  selectedLayout: "blank" | "50-30-20" | undefined;
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

  // Load persisted state ONCE using useRef to avoid calling loadPersistedState on every render
  const initialPersistedState = useRef<{
    wizardState: WizardState;
    selectedLayout: LayoutFormValues["selectedLayout"];
  } | null>(null);
  if (initialPersistedState.current === null) {
    initialPersistedState.current = loadPersistedState();
  }

  const [wizardState, setWizardState] = useState<WizardState>(
    initialPersistedState.current.wizardState,
  );

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Track whether submission was successful to prevent localStorage re-write after removal
  const isSubmitSuccessful = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    watch,
  } = useForm<LayoutFormValues>({
    defaultValues: {
      selectedLayout: initialPersistedState.current.selectedLayout,
    },
  });

  const selectedLayout = watch("selectedLayout");

  // Use ts-rest mutation for applying layout
  const applyLayoutMutation = tsr.onboarding.applyLayout.useMutation();

  // Persist wizard state and selectedLayout to localStorage (skip if submit was successful)
  useEffect(() => {
    // Don't persist if submission was successful (localStorage already removed)
    if (isSubmitSuccessful.current) {
      return;
    }

    localStorage.setItem(
      WIZARD_STORAGE_KEY,
      JSON.stringify({
        currentStep: wizardState.currentStep,
        completed: wizardState.completed,
        selectedLayout,
      }),
    );
  }, [wizardState, selectedLayout]);

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

  const onSubmit = async (data: LayoutFormValues) => {
    setSubmitError(null);

    try {
      // Validate with Zod schema
      const validated = ApplyLayoutRequestSchema.parse({
        layout: data.selectedLayout,
      });

      // Call API using ts-rest mutation
      const result = await applyLayoutMutation.mutateAsync({
        body: validated,
      });

      if (result.status !== 200) {
        const body = result.body as { message?: string };
        throw new Error(
          body?.message || `Failed to apply layout: ${result.status}`,
        );
      }

      // Mark submission as successful BEFORE state updates to prevent localStorage re-write
      isSubmitSuccessful.current = true;

      // Clear localStorage
      localStorage.removeItem(WIZARD_STORAGE_KEY);

      // Mark wizard as completed
      setWizardState((prev) => ({ ...prev, completed: true }));

      // Redirect to dashboard
      router.navigate({ to: "/" });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setSubmitError(err.errors.map((e: z.ZodIssue) => e.message).join(", "));
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("An unexpected error occurred");
      }
    }
  };

  // If completed, show success message
  if (wizardState.completed) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Setup Complete!</CardTitle>
          <CardDescription>
            Your category groups have been created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.navigate({ to: "/" })}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="LedgerMx Setup"
        description="Configure your budget structure"
      />

      {/* Step Indicator */}
      <nav aria-label="Wizard steps" className="mb-8">
        <ol className="flex items-center justify-between">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className={cn(
                "flex flex-col items-center",
                wizardState.currentStep === step.number
                  ? "text-primary"
                  : wizardState.currentStep > step.number
                    ? "text-success"
                    : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  wizardState.currentStep === step.number
                    ? "border-primary bg-primary text-primary-foreground"
                    : wizardState.currentStep > step.number
                      ? "border-success bg-success text-success-foreground"
                      : "border-muted",
                )}
              >
                {step.number}
              </span>
              <span className="mt-2 text-xs">{step.title}</span>
            </li>
          ))}
        </ol>
      </nav>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        aria-label="Onboarding Wizard"
      >
        {wizardState.currentStep === 1 && <Step1Welcome onNext={goNext} />}
        {wizardState.currentStep === 2 && (
          <Step2LayoutSelection
            register={register}
            selectedLayout={selectedLayout}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {wizardState.currentStep === 3 && (
          <Step3IncomeGroup onNext={goNext} onBack={goBack} />
        )}
        {wizardState.currentStep === 4 && (
          <Step4Summary
            selectedLayout={selectedLayout}
            onBack={goBack}
            isSubmitting={isSubmitting}
            error={submitError}
          />
        )}
      </form>
    </div>
  );
}

// Step 1: Welcome
function Step1Welcome({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to LedgerMx!</CardTitle>
        <CardDescription>
          Let's set up your budget structure. This wizard will help you create
          category groups for organizing your expenses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>Offline-first: Your data stays on your device</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>Double-entry: Every transaction balances</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>Envelopes: Allocate money to specific goals</span>
          </li>
        </ul>
        <Button
          onClick={onNext}
          className="w-full"
          aria-label="Start onboarding"
        >
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}

// Step 2: Layout Selection
function Step2LayoutSelection({
  register,
  selectedLayout,
  onNext,
  onBack,
}: {
  register: UseFormRegister<LayoutFormValues>;
  selectedLayout: "blank" | "50-30-20" | undefined;
  onNext: () => void;
  onBack: () => void;
}) {
  const handleContinue = () => {
    if (selectedLayout) {
      onNext();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Budget Layout</CardTitle>
        <CardDescription>
          Select a layout that best fits your budgeting style.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <label
            className={cn(
              "flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent",
              selectedLayout === "blank" && "border-primary bg-accent",
            )}
          >
            <input
              type="radio"
              value="blank"
              className="mt-1 h-4 w-4"
              {...register("selectedLayout", { required: true })}
              aria-describedby="blank-description"
            />
            <div className="space-y-1">
              <strong className="block">Blank Layout</strong>
              <p
                id="blank-description"
                className="text-sm text-muted-foreground"
              >
                Start fresh with a single "General" group. Perfect for full
                customization.
              </p>
            </div>
          </label>

          <label
            className={cn(
              "flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent",
              selectedLayout === "50-30-20" && "border-primary bg-accent",
            )}
          >
            <input
              type="radio"
              value="50-30-20"
              className="mt-1 h-4 w-4"
              {...register("selectedLayout", { required: true })}
              aria-describedby="503020-description"
            />
            <div className="space-y-1">
              <strong className="block">50/30/20 Layout</strong>
              <p
                id="503020-description"
                className="text-sm text-muted-foreground"
              >
                Popular budgeting method: Need (50%), Want (30%), Savings (20%).
                Great for beginners.
              </p>
            </div>
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            disabled={!selectedLayout}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Income Categories</CardTitle>
        <CardDescription>
          Income categories are separate from expense categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You can create an "Income" group to track different income sources
          like:
        </p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Salary</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Freelance</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Investments</span>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          You can set this up later in Settings. For now, let's continue with
          the category groups.
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button type="button" onClick={onNext} className="flex-1">
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 4: Summary
function Step4Summary({
  selectedLayout,
  onBack,
  isSubmitting,
  error,
}: {
  selectedLayout: "blank" | "50-30-20" | undefined;
  onBack: () => void;
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
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>
          Review your selection before creating category groups.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            You selected:{" "}
            <strong className="text-foreground">{layoutInfo.name}</strong>
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Category Groups to be created:
          </h3>
          <ul className="space-y-2">
            {layoutInfo.groups.map((group) => (
              <li key={group.name} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <strong className="text-sm">{group.name}</strong>
                  <p className="text-xs text-muted-foreground">
                    {group.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div
            className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-label="Create category groups"
            className="flex-1"
          >
            {isSubmitting ? "Creating..." : "Create Groups"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default OnboardingWizard;
