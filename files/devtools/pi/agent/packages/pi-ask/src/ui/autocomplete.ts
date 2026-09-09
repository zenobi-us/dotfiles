import { accessSync, constants as fsConstants } from "node:fs";
import { delimiter, join } from "node:path";
import { CombinedAutocompleteProvider } from "@earendil-works/pi-tui";

const FD_BINARY_NAMES =
	process.platform === "win32"
		? ["fd.exe", "fdfind.exe", "fd", "fdfind"]
		: ["fd", "fdfind"];

/**
 * pi resolves fd internally for its main editor, but that resolver is not part of
 * the public extension API. Custom editors therefore need to supply the fd path
 * themselves when reusing CombinedAutocompleteProvider for `@` file mentions.
 */
export function createAskAutocompleteProvider(cwd: string) {
	return Object.assign(
		new CombinedAutocompleteProvider(
			[],
			cwd,
			findAutocompleteBinary(FD_BINARY_NAMES)
		),
		{ triggerCharacters: ["@"] }
	);
}

function findAutocompleteBinary(binaryNames: readonly string[]): string | null {
	const pathValue = process.env.PATH;
	if (!pathValue) {
		return null;
	}

	const directories = pathValue.split(delimiter).filter(Boolean);
	for (const binaryName of binaryNames) {
		const executablePath = directories
			.map((directory) => join(directory, binaryName))
			.find(isExecutableFile);
		if (executablePath) {
			return executablePath;
		}
	}

	return null;
}

function isExecutableFile(path: string): boolean {
	try {
		accessSync(path, fsConstants.X_OK);
		return true;
	} catch {
		return false;
	}
}
