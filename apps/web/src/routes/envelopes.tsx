import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { Envelope, CreateEnvelopeRequest, FundEnvelopeRequest } from "@ledger-mx/contracts";
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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/ui/page-header";
import { EmptyState } from "../components/ui/empty-state";
import { LoadingState } from "../components/ui/loading-state";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface EnvelopeFormValues {
  name: string;
  targetAmountCents: string;
  isProtected: boolean;
}

interface FundFormValues {
  accountId: string;
  amountCents: string;
}

export function EnvelopesPage() {
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fundingEnvelope, setFundingEnvelope] = useState<Envelope | null>(null);

  // Use ts-rest query for loading envelopes
  const {
    data: envelopesData,
    isLoading,
    error: queryError,
    refetch,
  } = tsr.envelopes.list.useQuery({
    queryKey: ["envelopes"],
    queryData: { query: {} },
  });

  // Use ts-rest query for loading accounts (needed for funding)
  const { data: accountsData } = tsr.accounts.list.useQuery({
    queryKey: ["accounts"],
    queryData: { query: {} },
  });

  const envelopes = (envelopesData?.body?.envelopes ?? []) as Envelope[];
  const accounts = (accountsData?.body?.accounts ?? []) as Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }>;

  // Use ts-rest mutations
  const createMutation = tsr.envelopes.create.useMutation();
  const fundMutation = tsr.envelopes.fund.useMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<EnvelopeFormValues>({
    defaultValues: {
      name: "",
      targetAmountCents: "",
      isProtected: true,
    },
  });

  const {
    register: registerFund,
    handleSubmit: handleSubmitFund,
    control: fundControl,
    formState: { errors: fundErrors, isSubmitting: fundIsSubmitting },
    reset: resetFund,
    setValue: setFundValue,
  } = useForm<FundFormValues>({
    defaultValues: {
      accountId: "",
      amountCents: "",
    },
  });

  const onCreateSubmit = async (data: EnvelopeFormValues) => {
    try {
      const targetAmountCents = data.targetAmountCents
        ? parseInt(data.targetAmountCents, 10)
        : null;

      const result = await createMutation.mutateAsync({
        body: {
          name: data.name,
          targetAmountCents,
          isProtected: data.isProtected,
        } as CreateEnvelopeRequest,
      });

      if (result.status !== 201) {
        const body = result.body as { message?: string };
        throw new Error(
          body?.message || `Failed to create envelope: ${result.status}`,
        );
      }

      setShowCreateForm(false);
      reset();
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create envelope");
    }
  };

  const onFundSubmit = async (data: FundFormValues) => {
    if (!fundingEnvelope) return;

    try {
      const amountCents = parseInt(data.amountCents, 10);
      if (isNaN(amountCents) || amountCents <= 0) {
        throw new Error("Amount must be a positive integer");
      }

      const result = await fundMutation.mutateAsync({
        params: { id: fundingEnvelope.id },
        body: {
          accountId: data.accountId,
          amountCents,
        } as FundEnvelopeRequest,
      });

      if (result.status !== 200) {
        const body = result.body as { message?: string };
        throw new Error(
          body?.message || `Failed to fund envelope: ${result.status}`,
        );
      }

      setFundingEnvelope(null);
      resetFund();
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fund envelope");
    }
  };

  const formatBalance = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  if (isLoading) {
    return <LoadingState text="Loading envelopes..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Envelopes"
        description="Manage your budget envelopes"
        action={
          !showCreateForm && !fundingEnvelope
            ? {
                label: "Create Envelope",
                onClick: () => {
                  setShowCreateForm(true);
                  setFundingEnvelope(null);
                  reset();
                },
              }
            : undefined
        }
      />

      {(error || queryError) && (
        <div
          className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
          role="alert"
        >
          {error || (queryError as Error)?.message || "An error occurred"}
        </div>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Envelope</CardTitle>
            <CardDescription>
              Create a new budget envelope to organize your funds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onCreateSubmit)}
              className="space-y-4"
              aria-label="Create Envelope"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  disabled={isSubmitting}
                  error={!!errors.name}
                  {...register("name", { required: true, maxLength: 100 })}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    Name is required (max 100 chars)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAmountCents">
                  Target Amount (cents)
                </Label>
                <Input
                  id="targetAmountCents"
                  type="number"
                  disabled={isSubmitting}
                  placeholder="Optional: enter amount in cents"
                  {...register("targetAmountCents")}
                />
                <p className="text-xs text-muted-foreground">
                  Enter amount in cents (e.g., 5000 = $50.00)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="isProtected"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isProtected"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isProtected" className="cursor-pointer">
                  Protected (prevents overspending)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {fundingEnvelope && (
        <Card>
          <CardHeader>
            <CardTitle>Fund Envelope: {fundingEnvelope.name}</CardTitle>
            <CardDescription>
              Current balance: ${formatBalance(fundingEnvelope.balanceCents)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmitFund(onFundSubmit)}
              className="space-y-4"
              aria-label="Fund Envelope"
            >
              <div className="space-y-2">
                <Label htmlFor="accountId">Source Account</Label>
                <Controller
                  name="accountId"
                  control={fundControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger
                        id="accountId"
                        aria-invalid={!!fundErrors.accountId}
                        className={fundErrors.accountId ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="Select account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts
                          .filter(
                            (acc) =>
                              acc.status === "active" &&
                              acc.type !== "loan",
                          )
                          .map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {fundErrors.accountId && (
                  <p className="text-sm text-destructive">
                    Account is required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountCents">Amount (cents)</Label>
                <Input
                  id="amountCents"
                  type="number"
                  disabled={fundIsSubmitting}
                  error={!!fundErrors.amountCents}
                  placeholder="Enter amount in cents"
                  {...registerFund("amountCents", {
                    required: true,
                    validate: (value) => {
                      const num = parseInt(value, 10);
                      return (
                        (!isNaN(num) && num > 0) ||
                        "Amount must be a positive integer"
                      );
                    },
                  })}
                />
                {fundErrors.amountCents && (
                  <p className="text-sm text-destructive">
                    {fundErrors.amountCents.message || "Amount is required"}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter amount in cents (e.g., 5000 = $50.00)
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={fundIsSubmitting}
                  className="flex-1"
                >
                  {fundIsSubmitting ? "Funding..." : "Fund Envelope"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFundingEnvelope(null);
                    resetFund();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {envelopes.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full"
                aria-label="Envelopes list"
                data-testid="envelopes-table"
              >
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Protected
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {envelopes.map((envelope: Envelope) => (
                    <tr key={envelope.id} className="border-b">
                      <td className="px-4 py-3 font-medium">
                        {envelope.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            envelope.balanceCents < 0
                              ? "text-destructive"
                              : "text-success",
                          )}
                        >
                          ${formatBalance(envelope.balanceCents)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {envelope.targetAmountCents
                          ? `$${formatBalance(envelope.targetAmountCents)}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {envelope.isProtected ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFundingEnvelope(envelope);
                            setShowCreateForm(false);
                            resetFund();
                          }}
                        >
                          Fund
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        !showCreateForm &&
        !fundingEnvelope && (
          <EmptyState
            title="No envelopes found"
            description="Create an envelope to start budgeting your funds."
            action={{
              label: "Create Envelope",
              onClick: () => {
                setShowCreateForm(true);
                reset();
              },
            }}
          />
        )
      )}
    </div>
  );
}

export default EnvelopesPage;
