import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OnboardingWizard from "../routes/onboarding";

// Mock router
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    navigate: vi.fn(),
  }),
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
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("renders the onboarding wizard with welcome step", () => {
    render(<OnboardingWizard />);

    expect(screen.getByText("Welcome to LedgerMx!")).toBeInTheDocument();
    expect(screen.getByText(/offline-first/i)).toBeInTheDocument();
  });

  it("navigates to layout selection step when clicking Get Started", () => {
    render(<OnboardingWizard />);

    // Start on welcome step
    expect(screen.getByText("Welcome to LedgerMx!")).toBeInTheDocument();

    // Click "Start onboarding" to go to step 2
    const startBtn = screen.getByRole("button", { name: /Start onboarding/i });
    fireEvent.click(startBtn);

    expect(screen.getByText("Choose Your Budget Layout")).toBeInTheDocument();
  });

  it("shows layout options on step 2", () => {
    render(<OnboardingWizard />);

    // Navigate to step 2
    const startBtn = screen.getByRole("button", { name: /Start onboarding/i });
    fireEvent.click(startBtn);

    // Check layout options are visible
    expect(screen.getByText("Blank Layout")).toBeInTheDocument();
    expect(screen.getByText("50/30/20 Layout")).toBeInTheDocument();
  });
});
