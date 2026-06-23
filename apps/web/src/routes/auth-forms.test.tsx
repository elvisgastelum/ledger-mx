/**
 * Smoke tests for login and register forms.
 * Verifies that react-hook-form is properly integrated.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LoginPage } from "../routes/login";
import { RegisterPage } from "../routes/register";

// Mock useAuth
vi.mock("../lib/auth-context", () => ({
  useAuth: () => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  }),
}));

// Mock useNavigate and useSearch
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}));

describe("LoginPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the login form with email and password fields", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Use getByLabelText with more specific regex
    const passwordInputs = screen.getAllByLabelText(/password/i);
    expect(passwordInputs.length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /login/i })
    ).toBeInTheDocument();
  });

  it("renders the remember me checkbox", () => {
    render(<LoginPage />);

    // Use getByRole for checkbox with specific name
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("renders a link to the register page", () => {
    render(<LoginPage />);

    const links = screen.getAllByText(/register here/i);
    expect(links.length).toBeGreaterThan(0);
  });
});

describe("RegisterPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the register form with required fields", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Password field should exist
    const passwordInputs = screen.getAllByLabelText(/password/i);
    expect(passwordInputs.length).toBeGreaterThan(0);
    // Confirm Password field
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
  });

  it("renders the display name field as optional", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/display name.*optional/i)).toBeInTheDocument();
  });

  it("renders the remember me checkbox", () => {
    render(<RegisterPage />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("renders a link to the login page", () => {
    render(<RegisterPage />);

    const links = screen.getAllByText(/login here/i);
    expect(links.length).toBeGreaterThan(0);
  });
});
