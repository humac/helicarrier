import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and ignores falsy values", () => {
    expect(cn("p-2", false && "hidden", "text-sm", undefined, null)).toBe("p-2 text-sm");
  });

  it("resolves tailwind conflicts with last value winning", () => {
    expect(cn("px-2", "px-4", "text-red-500", "text-green-500")).toBe("px-4 text-green-500");
  });

  it("supports object and array inputs via clsx", () => {
    expect(cn(["rounded", { "font-bold": true, italic: false }], "rounded-lg")).toBe(
      "font-bold rounded-lg",
    );
  });
});
