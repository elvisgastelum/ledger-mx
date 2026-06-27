import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReportsPage } from "./reports";

// Mock data matching contract schemas
const mockSpendableData = {
  accountBalance: 500000,
  envelopeAllocations: 150000,
  upcomingObligations: 0,
  spendableBalance: 350000,
  asOfDate: "2024-01-31T23:59:59.999Z",
};

const mockExpensesData = [
  {
    categoryGroupId: "cg-1",
    categoryGroupName: "Food & Dining",
    totalExpenses: 50000,
    percentageOfTotal: 45.5,
  },
  {
    categoryGroupId: "cg-2",
    categoryGroupName: "Transportation",
    totalExpenses: 30000,
    percentageOfTotal: 27.3,
  },
];

const mockDebtData = {
  totalDebt: 100000,
  paidDebt: 0,
  remainingDebt: 100000,
  progressPercentage: 0,
  interest: 0,
  payoffDate: null,
  liabilityAccounts: [
    {
      accountId: "acc-1",
      accountName: "Credit Card",
      accountType: "credit" as const,
      currentBalance: -100000,
    },
  ],
};

// Mock router
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    navigate: vi.fn(),
  }),
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useLocation: () => ({ pathname: "/reports" }),
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

// Mock ts-rest client
vi.mock("../lib/ts-rest-client", () => {
  return {
    tsr: {
      reports: {
        getSpendableBalance: {
          useQuery: () => ({
            data: { status: 200, body: mockSpendableData },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          }),
        },
        getExpensesByCategory: {
          useQuery: () => ({
            data: { status: 200, body: mockExpensesData },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          }),
        },
        getDebtProgress: {
          useQuery: () => ({
            data: { status: 200, body: mockDebtData },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          }),
        },
      },
    },
    contractClient: {},
    extractFilename: vi.fn(
      (header: string | null) => header || "transactions.csv",
    ),
  };
});

describe("ReportsPage", () => {
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

  it("renders the reports page with correct heading", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /reports/i }),
    ).toBeDefined();
  });

  it("renders spendable balance data", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>,
    );

    // Check for spendable balance section
    expect(
      screen.getByRole("heading", { name: /spendable balance/i }),
    ).toBeDefined();
  });

  it("renders expenses by category data", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>,
    );

    // Check for category group names
    expect(screen.getByText(/Food & Dining/i)).toBeDefined();
    expect(screen.getByText(/Transportation/i)).toBeDefined();
  });

  it("renders debt progress data", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>,
    );

    // Check for debt progress section
    expect(screen.getByText(/debt progress/i)).toBeDefined();
    expect(screen.getByText(/Credit Card/i)).toBeDefined();
  });

  it("renders export buttons", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /export json/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /export csv/i })).toBeDefined();
  });

  it("renders date range filter form", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText(/start date/i)).toBeDefined();
    expect(screen.getByLabelText(/end date/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /apply filter/i })).toBeDefined();
  });
});
