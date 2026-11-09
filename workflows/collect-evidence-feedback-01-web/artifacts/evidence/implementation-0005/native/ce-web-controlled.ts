const server = Bun.serve({ hostname: "127.0.0.1", port: 18765, fetch(request) {
  const path = new URL(request.url).pathname;
  const credential = path === "/credential";
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Evidence controlled page</title><style>body{font:24px sans-serif;margin:48px;color:#183046;background:#f6f8fb}button,input{font:inherit;padding:12px;margin:12px 0}main{max-width:720px;border:3px solid #387d98;padding:32px}#status{padding:24px;background:#d9eee3}label{display:block}</style><main><h1>Evidence controlled page</h1><p>Owned local validation. No accounts or remote actions.</p>${credential ? '<label>Password <input type="password" id="password"></label>' : '<label>Project name <input id="project" value="Orbit"></label>'}<button id="choose" onclick="document.getElementById('status').textContent='Project selected: '+(document.getElementById('project')?.value||'blocked')">Select project</button><p id="status">No project selected</p></main></html>`, { headers: { "Content-Type": "text/html" } });
}});
console.log(`Controlled page listening on ${server.url}`);
