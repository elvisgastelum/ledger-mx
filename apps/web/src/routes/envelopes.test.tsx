import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EnvelopesPage } from "./envelopes";
import type { Envelope } from "@ledger-mx/contracts";

// Mock envelope data
const mockEnvelopes: Envelope[] = [
  {
    id: "env-1",
    name: "Groceries",
    targetAmountCents: 50000,
    balanceCents: 25000,
    isProtected: true,
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// Mock account data
const mockAccounts = [
  {
    id: "acc-1",
    name: "Checking",
    type: "debit" as const,
    balanceCents: 500000,
    currency: "USD",
    status: "active" as const,
    ownership: "user" as const,
    systemRole: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// Mock create mutation
const mockCreateMutateAsync = vi.fn().mockResolvedValue({ status: 201, body: {} });

// Mock router
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    navigate: vi.fn(),
  }),
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock useAuth
vi.mock("../lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-id", email: "test@example.com" },
    accessToken: "test-token",
    isAuthenticated: true,
    isLoading: false,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  }),
}));

// Mock ts-rest client with factory function
vi.mock("../lib/ts-rest-client", () => {
  return {
    tsr: {
      envelopes: {
        list: {
          useQuery: () => ({
            data: { body: { envelopes: [] } },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          }),
        },
        create: {
          useMutation: () => ({
            mutateAsync: mockCreateMutateAsync,
          }),
        },
        fund: {
          useMutation: () => ({
            mutateAsync: vi.fn().mockResolvedValue({ status: 200, body: {} }),
          }),
        },
      },
      accounts: {
        list: {
          useQuery: () => ({
            data: { body: { accounts: mockAccounts } },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          }),
        },
      },
    },
    contractClient: {},
    extractFilename: vi.fn((header: string | null) => header || "transactions.csv"),
  };
});

describe("EnvelopesPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the envelopes page with correct heading", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EnvelopesPage />
      </QueryClientProvider>,
    );

    // Use level 1 to match h1 "Envelopes" specifically
    expect(screen.getByRole("heading", { level: 1, name: /envelopes/i })).toBeDefined();
  });

  it("shows empty state when no envelopes exist", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EnvelopesPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/no envelopes found/i)).toBeDefined();
    expect(screen.getByText(/create an envelope to start budgeting/i)).toBeDefined();
  });

  it("shows create envelope form when button is clicked", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EnvelopesPage />
      </QueryClientProvider>,
    );

    // Click "Create Envelope" button in empty state
    const createButtons = screen.getAllByRole("button", { name: /create envelope/i });
    expect(createButtons.length).toBeGreaterThan(0);
    fireEvent.click(createButtons[0]);

    // Form should now be visible
    expect(screen.getByLabelText(/name/i)).toBeDefined();
    expect(screen.getByLabelText(/target amount/i)).toBeDefined();
  });
});

describe("EnvelopesPage - Form Validation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows name validation error when submitting empty form", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EnvelopesPage />
      </QueryClientProvider>,
    );

    // Open create form
    const createButtons = screen.getAllByRole("button", { name: /create envelope/i });
    fireEvent.click(createButtons[0]);

    // Submit the form without filling in the name
    const submitButton = screen.getByRole("button", { name: /create/i });
    fireEvent.click(submitButton);

    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeDefined();
    });

    // The API should NOT have been called
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });
});



