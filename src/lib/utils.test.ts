import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges conflicting Tailwind classes, keeping the last", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("keeps logical utilities intact", () => {
    expect(cn("ms-2", "me-3")).toBe("ms-2 me-3");
  });
});
