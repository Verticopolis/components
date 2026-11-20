import { vi } from "vitest";
import type { EnginePort } from "@verticopolis/engine/port/enginePort";
import { mockPort as engineMockPort } from "@verticopolis/engine/testing/mockPort";

/** The engine's `testing/mockPort`, with Vitest's spies filled in. Goes when
 *  the tests move to render-model fakes (components 1.0). */
export * from "@verticopolis/engine/testing/mockPort";
export const mockPort = (answers?: Parameters<typeof engineMockPort>[1]): EnginePort => engineMockPort(vi, answers);
