export function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return (error as NodeJS.ErrnoException).code === "EPERM";
	}
}

export async function waitForProcessesExit(
	pids: readonly number[],
	options: { timeoutMs?: number; intervalMs?: number; isAlive?: (pid: number) => boolean } = {},
): Promise<number[]> {
	const isAlive = options.isAlive ?? isProcessAlive;
	const remaining = new Set(pids.filter((pid) => Number.isInteger(pid) && pid > 0 && isAlive(pid)));
	const deadline = Date.now() + (options.timeoutMs ?? 5_000);
	while (remaining.size > 0 && Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, options.intervalMs ?? 50));
		for (const pid of remaining) if (!isAlive(pid)) remaining.delete(pid);
	}
	return [...remaining];
}
