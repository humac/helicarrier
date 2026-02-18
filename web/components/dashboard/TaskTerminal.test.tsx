import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaskTerminal from "@/components/dashboard/TaskTerminal";

describe("TaskTerminal", () => {
  it("clears input on successful submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskTerminal onSubmit={onSubmit} />);

    const input = screen.getByLabelText("Task command") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "spawn @peter" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("spawn @peter");
      expect(input.value).toBe("");
      expect(screen.getByText("Command Sent")).toBeTruthy();
    });
  });

  it("does not submit empty command", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskTerminal onSubmit={onSubmit} />);

    const input = screen.getByLabelText("Task command");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
