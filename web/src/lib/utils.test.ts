import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn() utility", () => {
  it("resolves conflicting Tailwind padding classes (last wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("resolves conflicting Tailwind color classes (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("filters falsy values via clsx", () => {
    expect(cn("flex", false && "hidden", "gap-2")).toBe("flex gap-2");
  });

  it("handles undefined and null values", () => {
    expect(cn("p-4", undefined, null, "m-2")).toBe("p-4 m-2");
  });

  it("resolves conflicting bg classes while keeping non-conflicting ones", () => {
    const result = cn("bg-surface-container-high rounded-xl", "bg-red-500");
    expect(result).toContain("bg-red-500");
    expect(result).toContain("rounded-xl");
    expect(result).not.toContain("bg-surface-container-high");
  });

  it("returns empty string with no args", () => {
    expect(cn()).toBe("");
  });
});
