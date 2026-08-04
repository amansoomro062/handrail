import type { Page } from "playwright";
import type { ComponentSpec, RunContext } from "@handrail/spec";
import {
  RESULT_SCHEMA_VERSION,
  type AssertionResult,
  type RunResult,
} from "@handrail/report";
import { Cdp } from "./cdp.js";
import { createA11yTools, createHarness, createKeyboardTools, HarnessError } from "./driver.js";

export const RUNNER_VERSION = "0.1.0";

export interface RunOptions {
  page: Page;
  baseUrl: string;
  spec: ComponentSpec;
  targetId: string;
  /** Per-assertion timeout. Prevents one hung assertion stalling a whole run. */
  assertionTimeoutMs?: number;
}

function emptyResult(
  options: RunOptions,
  startedAt: string,
  environment: RunResult["environment"],
  harnessError: string,
): RunResult {
  return {
    schemaVersion: RESULT_SCHEMA_VERSION,
    target: { id: options.targetId, versions: {}, adapterVersion: "unknown" },
    component: options.spec.id,
    specVersion: options.spec.version,
    environment,
    startedAt,
    finishedAt: new Date().toISOString(),
    harnessError,
    assertions: [],
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function runSpec(options: RunOptions): Promise<RunResult> {
  const { page, baseUrl, spec, targetId, assertionTimeoutMs = 30_000 } = options;
  const startedAt = new Date().toISOString();

  const environment: RunResult["environment"] = {
    browser: page.context().browser()?.browserType().name() ?? "unknown",
    browserVersion: page.context().browser()?.version() ?? "unknown",
    platform: process.platform,
    runnerVersion: RUNNER_VERSION,
  };

  // Refuse rather than mislead. Role, name and hidden-ness come from the Chrome
  // DevTools Protocol (decision 002), which no other engine implements. Under
  // Firefox or WebKit the accessibility queries would fail or, worse, return
  // something plausible from a different computation, and the result would look
  // like a finding about the library.
  if (environment.browser !== "chromium") {
    return emptyResult(
      options,
      startedAt,
      environment,
      `This runner is Chromium-only and was given ${environment.browser}. The accessibility ` +
        `tree is read over the Chrome DevTools Protocol, which no other engine implements. ` +
        `Supporting Firefox or WebKit needs a second driver, not a flag. See docs/DECISIONS.md 002.`,
    );
  }

  const cdp = await Cdp.attach(page);

  try {
    let harness;
    try {
      harness = await createHarness(page, { baseUrl, component: spec.id });
    } catch (error) {
      if (error instanceof HarnessError) {
        return emptyResult(options, startedAt, environment, error.message);
      }
      throw error;
    }

    // The library does not ship this component. Every assertion is recorded as
    // not-applicable, which scores n/a rather than zero, see the note on
    // `supported` in the protocol. Not implementing a component is a scope
    // decision, not an accessibility failure.
    if (harness.meta.supported === false) {
      const reason =
        harness.meta.unsupportedReason ??
        `${targetId} does not provide a ${spec.id} component.`;
      return {
        schemaVersion: RESULT_SCHEMA_VERSION,
        target: {
          id: targetId,
          versions: harness.meta.libraryVersions ?? {},
          adapterVersion: harness.meta.adapterVersion,
          ...(harness.meta.notes ? { notes: harness.meta.notes } : {}),
        },
        component: spec.id,
        specVersion: spec.version,
        environment,
        startedAt,
        finishedAt: new Date().toISOString(),
        assertions: spec.assertions.map((assertion) => ({
          id: assertion.id,
          title: assertion.title,
          status: "not-applicable" as const,
          severity: assertion.severity,
          refs: assertion.refs,
          reason,
          durationMs: 0,
          logs: [],
        })),
      };
    }

    // A missing required element is an adapter bug, and it is loud on purpose.
    // A library must never be scored down because its adapter is incomplete.
    const missing: string[] = [];
    for (const element of spec.requiredElements) {
      if (!element.requiredAtLoad) continue;
      if (!(await harness.exists(element.testId))) missing.push(element.testId);
    }
    if (missing.length > 0) {
      return emptyResult(
        options,
        startedAt,
        environment,
        `Adapter is missing required element(s) at load: ${missing.join(", ")}. ` +
          `See docs/HARNESS-PROTOCOL.md §4.`,
      );
    }

    const a11y = createA11yTools(cdp, page);
    const keyboard = createKeyboardTools(page, cdp);
    const assertions: AssertionResult[] = [];

    for (const assertion of spec.assertions) {
      const logs: string[] = [];
      const ctx: RunContext = {
        page,
        harness,
        a11y,
        keyboard,
        log: (message) => logs.push(message),
      };

      // Reload before every assertion. Twelve reloads is cheap; a result
      // contaminated by the previous assertion's state is not.
      const began = Date.now();
      let outcome: AssertionResult;
      try {
        await harness.reset();
        const result = await withTimeout(
          assertion.run(ctx),
          assertionTimeoutMs,
          assertion.id,
        );
        outcome = {
          id: assertion.id,
          title: assertion.title,
          status: result.status,
          severity: assertion.severity,
          refs: assertion.refs,
          durationMs: Date.now() - began,
          logs,
          ...(result.status === "pass" ? { detail: result.detail } : {}),
          ...(result.status === "fail"
            ? { detail: result.detail, expected: result.expected, actual: result.actual }
            : {}),
          ...(result.status === "not-applicable" ? { reason: result.reason } : {}),
        };
      } catch (error) {
        outcome = {
          id: assertion.id,
          title: assertion.title,
          status: "error",
          severity: assertion.severity,
          refs: assertion.refs,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - began,
          logs,
        };
      }
      assertions.push(outcome);
    }

    return {
      schemaVersion: RESULT_SCHEMA_VERSION,
      target: {
        id: targetId,
        versions: harness.meta.libraryVersions ?? {},
        adapterVersion: harness.meta.adapterVersion,
        ...(harness.meta.notes ? { notes: harness.meta.notes } : {}),
      },
      component: spec.id,
      specVersion: spec.version,
      environment,
      startedAt,
      finishedAt: new Date().toISOString(),
      assertions,
    };
  } finally {
    await cdp.detach();
  }
}
