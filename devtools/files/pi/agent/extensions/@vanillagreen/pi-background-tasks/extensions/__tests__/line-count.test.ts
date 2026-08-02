import { describe, expect, test } from "bun:test";

import { lineCount } from "../format.js";

describe("lineCount", () => {
	test("empty string is zero", () => {
		expect(lineCount("")).toBe(0);
	});

	test("single line without trailing newline", () => {
		expect(lineCount("hello")).toBe(1);
	});

	test("two lines without trailing newline", () => {
		expect(lineCount("a\nb")).toBe(2);
	});

	test("ignores a single trailing LF", () => {
		expect(lineCount("a\nb\n")).toBe(2);
	});

	test("ignores a single trailing CRLF", () => {
		expect(lineCount("a\r\nb\r\n")).toBe(2);
	});

	test("lone newline is zero lines of output", () => {
		expect(lineCount("\n")).toBe(0);
	});

	test("keeps blank interior lines", () => {
		expect(lineCount("a\n\nb\n")).toBe(3);
	});
});
