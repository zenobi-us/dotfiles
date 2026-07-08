import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

type SessionInfo = {
	path: string;
	name: string;
	group: string;
	mtimeMs: number;
};

function shellQuote(value: string): string {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function App() {
	const [sessions, setSessions] = useState<SessionInfo[]>([]);
	const [filter, setFilter] = useState("");
	const [active, setActive] = useState<SessionInfo | undefined>();
	const [title, setTitle] = useState("Pick a session.");
	const [headerInfo, setHeaderInfo] = useState("");
	const [frameUrl, setFrameUrl] = useState("");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		fetch("/api/sessions").then((r) => r.json()).then(setSessions).catch((error) => setTitle(String(error)));
	}, []);

	const groups = useMemo(() => {
		const q = filter.toLowerCase();
		const map = new Map<string, SessionInfo[]>();
		for (const session of sessions) {
			const haystack = `${session.group} ${session.name} ${session.path}`.toLowerCase();
			if (q && !haystack.includes(q)) continue;
			map.set(session.group, [...(map.get(session.group) ?? []), session]);
		}
		return [...map.entries()];
	}, [filter, sessions]);

	const command = active ? `pi --session ${shellQuote(active.name)}` : "";

	async function exportSession(session: SessionInfo) {
		setActive(session);
		setTitle(`Exporting ${session.name}…`);
		setHeaderInfo("");
		const response = await fetch("/api/export", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ path: session.path }),
		});
		const data = await response.json();
		if (!response.ok) {
			setTitle(data.error || "Export failed");
			return;
		}

		setFrameUrl(data.url);
		const html = await fetch(data.url).then((r) => r.text());
		const doc = new DOMParser().parseFromString(html, "text/html");
		const exportedTitle = doc.querySelector("title")?.textContent?.trim();
		setTitle(exportedTitle && exportedTitle !== "Pi Session Export" ? exportedTitle : new Date(session.mtimeMs).toLocaleString());
		setHeaderInfo(doc.querySelector(".header-info")?.innerHTML || "");
	}

	async function copyCommand() {
		await navigator.clipboard.writeText(command);
		setCopied(true);
		setTimeout(() => setCopied(false), 900);
	}

	return <div id="app">
		<aside>
			<input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter sessions" autoFocus />
			<div>
				{groups.map(([group, items]) => <details key={group} open>
					<summary>{group} ({items.length})</summary>
					{items.map((session) => <button key={session.path} className={session.path === active?.path ? "active" : ""} onClick={() => exportSession(session)}>
						<div>{session.name}</div>
						<div className="meta">{new Date(session.mtimeMs).toLocaleString()}</div>
					</button>)}
				</details>)}
			</div>
		</aside>
		<main>
			<header id="detail-header">
				<h2>{title}</h2>
				{command && <div id="command-row">
					<pre id="session-command"><code>{command}</code></pre>
					<button id="copy-command" type="button" onClick={copyCommand}>{copied ? "Copied" : "Copy"}</button>
				</div>}
				{headerInfo && <div id="header-info" dangerouslySetInnerHTML={{ __html: headerInfo }} />}
			</header>
			{frameUrl ? <iframe src={frameUrl} /> : <div className="empty">Select a session to export.</div>}
		</main>
	</div>;
}

createRoot(document.getElementById("root")!).render(<App />);
