import { describe, expect, test } from "bun:test";

import { stackPrefix } from "../tool-renderer/theme.js";

describe("tool renderer theme helpers", () => {
	test("stackPrefix prefers dedicated toolBullet token over accent", () => {
		const theme = {
			fg(token: string, text: string) {
				if (token === "toolBullet") return `tool:${text}:tool`;
				if (token === "accent") return `accent:${text}:accent`;
				if (token === "text") return `text:${text}:text`;
				return text;
			},
		};

		expect(stackPrefix(theme)).toBe("tool:● :tool");
	});

	test("stackPrefix falls back to accent without toolBullet token", () => {
		const theme = {
			fg(token: string, text: string) {
				if (token === "toolBullet") return text;
				if (token === "accent") return `accent:${text}:accent`;
				if (token === "text") return `text:${text}:text`;
				return text;
			},
		};

		expect(stackPrefix(theme)).toBe("accent:● :accent");
	});
});
