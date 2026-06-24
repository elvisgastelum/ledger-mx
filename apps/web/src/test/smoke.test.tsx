import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OnboardingWizard from "../routes/onboarding";

// Mock router
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    navigate: vi.fn(),
  }),
  useNavigate: () => vi.fn(),
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
    onboarding: {
      applyLayout: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ status: 200, body: {} }),
        }),
      },
    },
  },
  contractClient: {},
  extractFilename: vi.fn(
    (header: string | null) => header || "transactions.csv",
  ),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Onboarding Wizard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the onboarding wizard with welcome step", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OnboardingWizard />
      </QueryClientProvider>,
    );

    // Use getAllByRole and take first match to handle potential duplicates
    const headings = screen.getAllByRole("heading", {
      name: /welcome to ledgermx/i,
    });
    expect(headings.length).toBeGreaterThan(0);
    expect(screen.getByText(/offline-first/i)).toBeInTheDocument();
  });

  it("navigates to layout selection step when clicking Get Started", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OnboardingWizard />
      </QueryClientProvider>,
    );

    // Find and click the "Get Started" button
    const buttons = screen.getAllByRole("button", {
      name: /start onboarding/i,
    });
    fireEvent.click(buttons[0]);

    // Verify we're on the layout selection step
    const layoutHeadings = screen.getAllByRole("heading", {
      name: /choose your budget layout/i,
    });
    expect(layoutHeadings.length).toBeGreaterThan(0);
  });

  it("shows layout options on step 2", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OnboardingWizard />
      </QueryClientProvider>,
    );

    // Navigate to step 2
    const buttons = screen.getAllByRole("button", {
      name: /start onboarding/i,
    });
    fireEvent.click(buttons[0]);

    // Check layout options are visible
    expect(screen.getByText("Blank Layout")).toBeInTheDocument();
    expect(screen.getByText("50/30/20 Layout")).toBeInTheDocument();
  });
});
