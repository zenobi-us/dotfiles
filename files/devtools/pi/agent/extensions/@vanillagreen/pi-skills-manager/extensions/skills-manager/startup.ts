import { InteractiveMode } from "@earendil-works/pi-coding-agent";
import { STARTUP_HIDE_ENABLED_SYMBOL, STARTUP_PATCH_SYMBOL } from "./constants.js";

export function setStartupHideEnabled(enabled: boolean): void {
	(globalThis as unknown as Record<PropertyKey, unknown>)[STARTUP_HIDE_ENABLED_SYMBOL] = enabled;
}

function startupHideEnabled(): boolean {
	return (globalThis as unknown as Record<PropertyKey, unknown>)[STARTUP_HIDE_ENABLED_SYMBOL] === true;
}

export function patchInteractiveModeStartupSkillsBlock(): void {
	const prototype = InteractiveMode.prototype as unknown as Record<PropertyKey, unknown> & { showLoadedResources?: (...args: unknown[]) => unknown };
	if (prototype[STARTUP_PATCH_SYMBOL]) return;
	const originalShowLoadedResources = prototype.showLoadedResources;
	if (typeof originalShowLoadedResources !== "function") return;

	prototype.showLoadedResources = function patchedShowLoadedResources(this: unknown, ...args: unknown[]) {
		if (!startupHideEnabled()) return originalShowLoadedResources.apply(this, args);
		const interactiveMode = this as {
			session?: { resourceLoader?: { getSkills?: () => { skills: unknown[]; diagnostics?: unknown[] } } };
		};
		const resourceLoader = interactiveMode.session?.resourceLoader;
		if (!resourceLoader || typeof resourceLoader.getSkills !== "function") return originalShowLoadedResources.apply(this, args);
		const originalGetSkills = resourceLoader.getSkills;
		resourceLoader.getSkills = () => ({ ...originalGetSkills.call(resourceLoader), skills: [] });
		try {
			return originalShowLoadedResources.apply(this, args);
		} finally {
			resourceLoader.getSkills = originalGetSkills;
		}
	};
	prototype[STARTUP_PATCH_SYMBOL] = true;
}
