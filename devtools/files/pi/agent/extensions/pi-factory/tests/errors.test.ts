import test from "node:test";
import assert from "node:assert/strict";
import { FactoryError, toErrorDetails } from "../errors.js";

test("structured error roundtrip", () => {
	const err = new FactoryError({ code: "RUNTIME", message: "bad payload", recoverable: true });
	const details = toErrorDetails(err);
	assert.equal(details.code, "RUNTIME");
	assert.equal(details.message, "bad payload");
	assert.equal(details.recoverable, true);
});

test("unknown errors map to RUNTIME", () => {
	const details = toErrorDetails(new Error("boom"));
	assert.equal(details.code, "RUNTIME");
	assert.equal(details.message, "boom");
});

test("string errors map to RUNTIME", () => {
	const details = toErrorDetails("something broke");
	assert.equal(details.code, "RUNTIME");
	assert.equal(details.message, "something broke");
});

test("fallback code is used for plain errors", () => {
	const details = toErrorDetails(new Error("nope"), { code: "CANCELLED" });
	assert.equal(details.code, "CANCELLED");
});

test("FactoryError preserves all detail fields", () => {
	const err = new FactoryError({
		code: "MODEL_NOT_FOUND",
		message: "no such model",
		recoverable: true,
		meta: { available: ["a/b"] },
	});
	const details = toErrorDetails(err);
	assert.equal(details.code, "MODEL_NOT_FOUND");
	assert.deepEqual(details.meta, { available: ["a/b"] });
});
