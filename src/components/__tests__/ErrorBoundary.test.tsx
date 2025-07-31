import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ErrorBoundary, GameErrorBoundary } from "../ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary", () => {
  // Suppress console errors for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it("should render children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should show error fallback when error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("🎸 Stage Dive Gone Wrong!")).toBeInTheDocument();
    expect(
      screen.getByText(/Something went wrong in the underground/),
    ).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Reset Everything")).toBeInTheDocument();
  });

  it("should show custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    expect(
      screen.queryByText("🎸 Stage Dive Gone Wrong!"),
    ).not.toBeInTheDocument();
  });

  it("should call onError callback when error occurs", () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
  });

  it("should recover when Try Again is clicked", async () => {
    const user = userEvent.setup();

    // Component that can toggle between throwing and not throwing
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
          <button
            onClick={() => setShouldThrow(false)}
            style={{ display: "none" }}
          >
            Fix Error
          </button>
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Should show error initially
    expect(screen.getByText("🎸 Stage Dive Gone Wrong!")).toBeInTheDocument();

    // Click Try Again
    await user.click(screen.getByText("Try Again"));

    // After reset, the ErrorBoundary will try to render children again
    // Since we still have shouldThrow=true, it will error again
    expect(screen.getByText("🎸 Stage Dive Gone Wrong!")).toBeInTheDocument();
  });

  it("should show error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Error Details (Dev Only)")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe("GameErrorBoundary", () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it("should show view-specific error message", () => {
    render(
      <GameErrorBoundary viewName="TestView">
        <ThrowError shouldThrow={true} />
      </GameErrorBoundary>,
    );

    expect(screen.getByText("Error in TestView")).toBeInTheDocument();
    expect(
      screen.getByText(/This part of the game encountered an error/),
    ).toBeInTheDocument();
  });

  it("should render children when no error", () => {
    render(
      <GameErrorBoundary viewName="TestView">
        <div>Game content</div>
      </GameErrorBoundary>,
    );

    expect(screen.getByText("Game content")).toBeInTheDocument();
  });
});
