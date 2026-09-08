import { describe, expect, test } from "bun:test";

import { parseRuntimeSettings } from "./config.js";

describe("skills config", () => {
  test("accepts repo-scoped enabled skill globs", () => {
    const enabled = {
      "github-com-owner-repository--0123abcd": [
        ".agents/skills/reckon*",
      ],
    };

    expect(parseRuntimeSettings({ enabled }).enabled).toEqual(enabled);
  });
});