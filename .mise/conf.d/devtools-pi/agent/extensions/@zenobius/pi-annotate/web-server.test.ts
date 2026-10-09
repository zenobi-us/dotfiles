import assert from "node:assert/strict";
import test from "node:test";

import { browserCommand } from "./web-server.js";

const url = "http://127.0.0.1:1234/token";

test("opens the Windows browser under WSL", () => {
	assert.deepEqual(
		browserCommand(url, "linux", "6.6.87.2-microsoft-standard-WSL2", {}),
		{ file: "cmd.exe", args: ["/c", "start", "", url] },
	);
});

test("uses xdg-open on ordinary Linux", () => {
	assert.deepEqual(browserCommand(url, "linux", "6.8.0-generic", {}), { file: "xdg-open", args: [url] });
});
