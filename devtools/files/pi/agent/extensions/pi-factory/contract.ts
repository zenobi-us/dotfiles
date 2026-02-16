import { Type, type Static } from "@sinclair/typebox";
import { FactoryError } from "./errors.js";

export const SubagentSchema = Type.Object({
	task: Type.String({ description: "Label/description for this program run." }),
	code: Type.String({ description: "TypeScript program. Must export async run(input, rt). Runs with rt.spawn/join/parallel/sequence for multi-agent orchestration." }),
});

export type SubagentParams = Static<typeof SubagentSchema>;

export function validateParams(params: SubagentParams): SubagentParams {
	if (!params.task?.trim()) {
		throw new FactoryError({ code: "INVALID_INPUT", message: "'task' is required.", recoverable: true });
	}
	if (!params.code?.trim()) {
		throw new FactoryError({ code: "INVALID_INPUT", message: "'code' is required and must be non-empty.", recoverable: true });
	}
	return params;
}
