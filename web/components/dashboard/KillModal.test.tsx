import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import KillModal from "@/components/dashboard/KillModal";

describe("KillModal", () => {
  it("renders target session id", () => {
    render(
      <KillModal isOpen sessionId="session-99" onConfirm={() => {}} onCancel={() => {}} />,
    );

    expect(screen.getByText(/session-99/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Terminate" })).toBeTruthy();
  });

  it("calls onConfirm only on terminate click", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(<KillModal isOpen sessionId="session-99" onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Terminate" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
