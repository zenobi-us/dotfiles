import assert from "node:assert/strict";
import test from "node:test";
import { looksLikeScannedPdf } from "../src/extract/pdf-pages.js";

test("looksLikeScannedPdf flags empty extractions", () => {
	assert.equal(looksLikeScannedPdf("", 5000), true);
	assert.equal(looksLikeScannedPdf("   ", 5000), true);
});

test("looksLikeScannedPdf flags very low text density on large PDFs", () => {
	assert.equal(looksLikeScannedPdf("page 1", 200_000), true);
});

test("looksLikeScannedPdf passes regular text-layer PDFs", () => {
	const text = "lorem ipsum ".repeat(40);
	assert.equal(looksLikeScannedPdf(text, 200_000), false);
});

test("looksLikeScannedPdf does not flag tiny PDFs without text", () => {
	assert.equal(looksLikeScannedPdf("hi", 1000), false);
});
