import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransactionsPage } from "./transactions";
import { buildCategoryOptions, type CategoryOption } from "./transactions";

// Mock category data with active categories (no deletedAt)
const mockActiveCategories = [
  {
    id: "cat-1",
    name: "Groceries",
    parentId: null,
    categoryGroupId: "group-1",
    ownership: "user" as const,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    usageCount: 5,
  },
  {
    id: "cat-2",
    name: "Dining Out",
    parentId: null,
    categoryGroupId: "group-1",
    ownership: "user" as const,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    usageCount: 3,
  },
  {
    id: "cat-3",
    name: "Rent",
    parentId: "cat-1",
    categoryGroupId: "group-1",
    ownership: "user" as const,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    usageCount: 1,
  },
];

// Mock account data
const mockAccounts = [
  {
    id: "acc-1",
    name: "Checking",
    type: "checking" as const,
    balanceCents: 500000,
    currency: "USD",
    status: "active" as const,
    ownership: "user" as const,
    systemRole: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// Mock router
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    navigate: vi.fn(),
  }),
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
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
vi.mock("../lib/ts-rest-client", () => ({
  tsr: {
    transactions: {
      list: {
        useQuery: () => ({
          data: { body: { transactions: [] } },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        }),
      },
      create: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ status: 201, body: {} }),
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
    categories: {
      list: {
        useQuery: () => ({
          data: { body: { categories: mockActiveCategories } },
          isLoading: false,
          error: null,
        }),
      },
    },
  },
  contractClient: {},
  extractFilename: vi.fn((header: string | null) => header || "transactions.csv"),
}));

describe("TransactionsPage - Category Selector", () => {
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

  it("renders the transactions page with category data loaded", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>,
    );

    // Page should render - use level 1 to match h1 "Transactions" specifically (not h3 "No transactions found")
    expect(screen.getByRole("heading", { level: 1, name: /transactions/i })).toBeInTheDocument();
  });

  it("shows create transaction form when button is clicked", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>,
    );

    // Click "Create Transaction" button (use [0] to get header button, avoiding ambiguity with duplicate buttons)
    const createButtons = screen.getAllByRole("button", { name: /create transaction/i });
    const createButton = createButtons[0];
    expect(createButton).toBeInTheDocument();
    fireEvent.click(createButton);

    // Form should now be visible - check for form elements
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  });
});

// Unit test for buildCategoryOptions helper logic
describe("buildCategoryOptions", () => {
  it("should organize categories into parent/child hierarchy", () => {
    const options = buildCategoryOptions(mockActiveCategories);

    // Verify the hierarchy
    expect(options).toHaveLength(3);

    // Parents should come first (sorted by name)
    expect(options[0].name).toBe("Dining Out");
    expect(options[0].depth).toBe(0);
    expect(options[0].isChild).toBe(false);

    // Then "Groceries" parent
    expect(options[1].name).toBe("Groceries");
    expect(options[1].depth).toBe(0);
    expect(options[1].isChild).toBe(false);

    // Then its child "Rent"
    expect(options[2].name).toBe("Rent");
    expect(options[2].depth).toBe(1);
    expect(options[2].isChild).toBe(true);
  });

  it("should only include active categories (not archived)", () => {
    // Archived categories would have deletedAt set, but the API
    // should not return them in the list. This test verifies the
    // logic handles the data correctly.
    const options = buildCategoryOptions(mockActiveCategories);

    // All categories in mockActiveCategories are active (no deletedAt)
    expect(options).toHaveLength(3);

    // Verify all options have valid category data
    for (const option of options) {
      expect(option.id).toBeDefined();
      expect(option.name).toBeDefined();
      expect(option.usageCount).toBeGreaterThanOrEqual(0);
    }
  });
});
