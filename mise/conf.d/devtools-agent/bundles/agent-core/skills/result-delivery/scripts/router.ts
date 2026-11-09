#!/usr/bin/env -S mise x -- bun --install=fallback
// This CLI exposes the same delivery boundary used directly by operation CLIs.
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { acknowledgeResult, deliverResult, loadDeliveryContext, readDeliveredResult } from "./delivery.ts";

const app = new Crust("result-delivery").meta({
  description: "Route result output, publish durable artifacts, and verify or acknowledge a handoff.",
});
const contextFlag = {
  context: { type: "string" as const, description: "Absolute context JSON file; otherwise use RESULT_DELIVERY_CONTEXT or human output." },
};

const route = app.sub("route")
  .meta({ description: "Print the validated delivery context as JSON without writing artifacts." })
  .flags(contextFlag)
  .run(async ({ flags }) => {
    await reportErrors(async () => {
      console.log(JSON.stringify(await loadDeliveryContext(flags.context), null, 2));
    });
  });

const emit = app.sub("emit")
  .meta({ description: "Deliver a domain JSON object from --input or stdin. Artifact delivery cannot be overridden." })
  .flags({
    ...contextFlag,
    input: { type: "string", description: "Read the domain JSON object from this file instead of stdin." },
    format: { type: "string", description: "Presentation: human or json. Does not replace assigned artifact delivery." },
  })
  .run(async ({ flags }) => {
    await reportErrors(async () => {
      if (flags.format !== undefined && flags.format !== "human" && flags.format !== "json") {
        throw new Error("--format must be human or json.");
      }
      const context = await loadDeliveryContext(flags.context);
      if (flags.format !== undefined && context.mode !== "artifact-reference") {
        context.mode = flags.format;
        context.audience = flags.format === "json" ? "machine" : "human";
      }
      if (flags.input === undefined && process.stdin.isTTY) throw new Error("Pass --input or pipe a domain JSON object to stdin.");
      const source = flags.input === undefined ? await Bun.stdin.text() : await Bun.file(flags.input).text();
      let result: unknown;
      try {
        result = JSON.parse(source);
      } catch {
        throw new Error("Input must contain a valid JSON object.");
      }
      if (result === null || typeof result !== "object" || Array.isArray(result)) throw new Error("Input must contain a JSON object.");
      console.log(await deliverResult(result as Record<string, unknown>, context));
    });
  });

const read = app.sub("read")
  .meta({ description: "Verify artifact schema, identity and hash, then print the unchanged domain result as JSON." })
  .flags(contextFlag)
  .run(async ({ flags }) => {
    await reportErrors(async () => {
      const delivered = await readDeliveredResult(await loadDeliveryContext(flags.context));
      console.log(JSON.stringify(delivered.result, null, 2));
    });
  });

const ack = app.sub("ack")
  .meta({ description: "Write a matching immutable acknowledgement without deleting the delivered artifact." })
  .flags({
    ...contextFlag,
    sha256: { type: "string", description: "Required verified SHA-256 from the delivered reference." },
  })
  .run(async ({ flags }) => {
    await reportErrors(async () => {
      if (flags.sha256 === undefined) throw new Error("ack requires --sha256.");
      const context = await loadDeliveryContext(flags.context);
      await acknowledgeResult(context, flags.sha256);
      console.log(JSON.stringify({ schema: "result-delivery/v1", kind: "acknowledgement", runId: context.runId, operationId: context.operationId, sha256: flags.sha256, ref: context.target!.ref, resultSchema: context.target!.schema }));
    });
  });

async function reportErrors(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Result delivery failed.";
    console.error(message.replace(/[\u0000-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`));
    process.exitCode = 1;
  }
}

app.use(helpPlugin()).command(route).command(emit).command(read).command(ack).execute();
