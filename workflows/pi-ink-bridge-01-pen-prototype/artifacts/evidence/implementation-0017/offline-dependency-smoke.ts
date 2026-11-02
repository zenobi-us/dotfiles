// Exercise the real request server with an empty uv cache, without network fallback.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createAnnotationServer, type AnnotatorResult } from "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator/index.ts";
const cache = await mkdtemp(join(tmpdir(), "ink-offline-cache-"));
const previous = process.env.UV_CACHE_DIR;
process.env.UV_CACHE_DIR = cache;
const results: (AnnotatorResult | undefined)[] = [];
const data = await readFile(join(import.meta.dirname,"source.png"));
const server = await createAnnotationServer({type:"image",mimeType:"image/png",name:"source.png",data:data.toString("base64")},"offline-smoke",result=>results.push(result));
try {
  const response = await fetch(`http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}/api/pdf-source?token=offline-smoke`);
  const body = await response.text();
  if (response.status !== 500 || results.length !== 0 || !body.includes("PDF processing failed")) throw new Error(`Unexpected offline result: ${response.status} ${body}`);
  const report = {status:response.status, delivered:false, error:body, networkFallback:false};
  await writeFile(join(import.meta.dirname,"offline-dependency-result.json"),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {
  await server.close();
  if (previous === undefined) delete process.env.UV_CACHE_DIR;
  else process.env.UV_CACHE_DIR = previous;
  await rm(cache,{recursive:true,force:true});
}
