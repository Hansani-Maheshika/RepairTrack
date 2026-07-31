import { describe, expect, it } from "vitest";
import { canTransition } from "../../src/utils/statusTransitions.js";

describe("repair status transitions", () => {
  it("allows the normal repair workflow", () => {
    expect(canTransition("DEVICE_RECEIVED", "UNDER_INSPECTION")).toBe(true);
    expect(canTransition("REPAIR_APPROVED", "REPAIR_IN_PROGRESS")).toBe(true);
    expect(canTransition("REPAIR_IN_PROGRESS", "TESTING")).toBe(true);
    expect(canTransition("TESTING", "READY_FOR_COLLECTION")).toBe(true);
    expect(canTransition("COMPLETED", "COLLECTED")).toBe(true);
  });

  it("rejects skipped and backward workflow changes", () => {
    expect(canTransition("DEVICE_RECEIVED", "COLLECTED")).toBe(false);
    expect(canTransition("TESTING", "DEVICE_RECEIVED")).toBe(false);
  });

  it("treats collected and cancelled as terminal", () => {
    expect(canTransition("COLLECTED", "COMPLETED")).toBe(false);
    expect(canTransition("CANCELLED", "DEVICE_RECEIVED")).toBe(false);
  });

  it("supports valid alternative branches", () => {
    expect(canTransition("REPAIR_APPROVED", "WAITING_FOR_SPARE_PARTS")).toBe(true);
    expect(canTransition("WAITING_FOR_SPARE_PARTS", "REPAIR_IN_PROGRESS")).toBe(true);
    expect(canTransition("WAITING_FOR_CUSTOMER_APPROVAL", "REPAIR_REJECTED")).toBe(true);
  });
});
