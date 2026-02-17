import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AgentCard from "@/components/dashboard/AgentCard";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

describe("AgentCard", () => {
  it("renders agent identity and stat labels", () => {
    render(<AgentCard agent="@peter" role="developer" status="idle" load="22%" />);

    expect(screen.getByText("@peter")).toBeTruthy();
    expect(screen.getByText("developer")).toBeTruthy();
    expect(screen.getByText("CPU Load")).toBeTruthy();
    expect(screen.getByText("Tasks")).toBeTruthy();
    expect(screen.getByText("22%")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("applies active styling and status dot color", () => {
    const { container } = render(
      <AgentCard agent="@tony" role="architect" status="active" load="61%" />,
    );

    const statusBadge = screen.getByText("active").closest("div");
    expect(statusBadge?.className).toContain("border-green-500/30");
    expect(statusBadge?.className).toContain("text-green-400");

    const statusDot = container.querySelector(".bg-green-500");
    expect(statusDot).toBeTruthy();
  });

  it("applies error status dot color", () => {
    const { container } = render(<AgentCard agent="@heimdall" role="qa" status="error" load="12%" />);

    const statusDot = container.querySelector(".bg-red-500");
    expect(statusDot).toBeTruthy();
    expect(screen.getByText("error")).toBeTruthy();
  });
});
