// Saved screenshot feedback stays separate from immutable evidence.
// Durable publication and retry preserve the original annotation identity.
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { link, lstat, mkdir, open, readdir, realpath, unlink, type FileHandle } from "node:fs/promises";
import { join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { assetBytes, boundedFile, checkId, safeComponents, schema, validateSession, type FeedbackView } from "./records.ts";

interface Geometry { x: number; y: number; width: number; height: number }
interface AnnotationInput {
  schema: typeof schema; kind: "annotation"; id: string;
  sessionId: string; caseId: string; assetId: string; sourceSha256: string;
  originalWidth: number; originalHeight: number; geometry: Geometry;
  priority: "P1" | "P2" | "P3"; comment: string;
}
export interface Annotation extends AnnotationInput {
  revision: 1; createdAt: string; updatedAt: string; pixelGeometry: Geometry;
}
export class AnnotationError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); this.name = "AnnotationError"; }
}

export async function createAnnotation(view: FeedbackView, input: unknown): Promise<Annotation> {
  const annotation = validateInput(view, input);
  const asset = view.cases.find(record => record.id === annotation.caseId)!.assets.find(record => record.id === annotation.assetId)!;
  await verifySource(view.directory, asset);
  const existing = (await listAnnotations(view)).find(record => record.id === annotation.id);
  if (existing) {
    const { revision: _revision, createdAt: _createdAt, updatedAt: _updatedAt, pixelGeometry: _pixels, ...original } = existing;
    requireAnnotation(isDeepStrictEqual(original, annotation), "Annotation ID already has different content", 409);
    await syncAnnotation(view, existing);
    return existing;
  }
  const timestamp = new Date().toISOString();
  const record: Annotation = { ...annotation, revision: 1, createdAt: timestamp, updatedAt: timestamp, pixelGeometry: pixels(annotation) };
  await publishAnnotation(view, record);
  return record;
}

export async function listAnnotations(view: FeedbackView): Promise<Annotation[]> {
  const annotations: Annotation[] = [];
  const ids = new Set<string>();
  for (const record of view.cases) {
    const directory = join(view.directory, "cases", record.id, "annotations");
    checkId(record.id);
    await safeComponents(directory, true);
    let entries: string[];
    try { entries = await readdir(directory); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
    for (const name of entries.sort()) {
      // An interrupted publication can leave an uncommitted temporary file.
      if (/^\.pending-[0-9a-f-]{36}$/.test(name)) {
        const stat = await lstat(join(directory, name));
        requireAnnotation(stat.isFile() && !stat.isSymbolicLink(), "Unsafe annotation temporary file");
        continue;
      }
      requireAnnotation(name.endsWith(".json"), "Unrecognized annotation file");
      const id = name.slice(0, -5); checkId(id);
      let value: unknown;
      try { value = JSON.parse((await boundedFile(view.directory, `cases/${record.id}/annotations/${name}`, 1024 * 1024)).toString("utf8")); }
      catch { throw new AnnotationError("Annotation record is missing, unsafe or malformed"); }
      const annotation = validateStored(view, value);
      requireAnnotation(annotation.id === id && annotation.caseId === record.id, "Annotation file identity differs from its record");
      requireAnnotation(!ids.has(id), "Duplicate annotation ID");
      ids.add(id); annotations.push(annotation);
    }
  }
  return annotations;
}

export async function exportSession(directory: string): Promise<object> {
  const view = await validateSession(directory);
  const annotations = await listAnnotations(view);
  const assets = view.cases.flatMap(record => record.assets);
  for (const asset of assets) await verifySource(view.directory, asset);
  return { schema, kind: "export", success: true, session: view.session, cases: view.cases, assets, annotations };
}

function validateInput(view: FeedbackView, value: unknown): AnnotationInput {
  requireAnnotation(isObject(value), "Annotation must be an object");
  const keys = ["schema", "kind", "id", "sessionId", "caseId", "assetId", "sourceSha256", "originalWidth", "originalHeight", "geometry", "priority", "comment"];
  requireAnnotation(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), "Annotation fields do not match the supported schema");
  requireAnnotation(value.schema === schema && value.kind === "annotation", "Unsupported annotation schema or kind");
  for (const key of ["id", "sessionId", "caseId", "assetId"]) {
    try { checkId(value[key]); } catch { throw new AnnotationError("Annotation identity must use a safe stable ID"); }
  }
  requireAnnotation(value.sessionId === view.session.id, "Annotation belongs to a different session", 409);
  const record = view.cases.find(record => record.id === value.caseId);
  const asset = record?.assets.find(asset => asset.id === value.assetId);
  requireAnnotation(asset?.mediaType === "image/png", "Annotation requires a registered image asset");
  requireAnnotation(value.sourceSha256 === asset.sha256 && value.originalWidth === asset.width && value.originalHeight === asset.height, "Annotation source hash or dimensions changed; import a new session", 409);
  requireAnnotation(value.priority === "P1" || value.priority === "P2" || value.priority === "P3", "Annotation priority must be P1, P2 or P3");
  requireAnnotation(typeof value.comment === "string" && value.comment.trim().length > 0 && Buffer.byteLength(value.comment, "utf8") <= 64 * 1024, "Annotation comment must contain text and fit within 64 KiB");
  const geometry = value.geometry;
  requireAnnotation(isObject(geometry) && Object.keys(geometry).length === 4 && ["x", "y", "width", "height"].every(key => Object.hasOwn(geometry, key) && typeof geometry[key] === "number" && Number.isFinite(geometry[key]) && geometry[key] >= 0 && geometry[key] <= 1), "Annotation geometry must contain finite normalized coordinates");
  const { x, y, width, height } = geometry as unknown as Geometry;
  requireAnnotation(x + width <= 1 && y + height <= 1, "Annotation geometry exceeds the image bounds");
  requireAnnotation((width === 0 && height === 0) || (width > 0 && height > 0), "Annotation must be a point or a positive-area box");
  return { schema, kind: "annotation", id: value.id as string, sessionId: value.sessionId as string, caseId: value.caseId as string, assetId: value.assetId as string, sourceSha256: asset.sha256, originalWidth: asset.width, originalHeight: asset.height, geometry: { x: x || 0, y: y || 0, width: width || 0, height: height || 0 }, priority: value.priority, comment: value.comment };
}

function validateStored(view: FeedbackView, value: unknown): Annotation {
  requireAnnotation(isObject(value), "Annotation record must be an object");
  const { revision, createdAt, updatedAt, pixelGeometry, ...input } = value;
  const annotation = validateInput(view, input);
  requireAnnotation(revision === 1 && typeof createdAt === "string" && Number.isFinite(Date.parse(createdAt)) && new Date(createdAt).toISOString() === createdAt && updatedAt === createdAt, "Invalid annotation revision or timestamps");
  requireAnnotation(isDeepStrictEqual(pixelGeometry, pixels(annotation)), "Annotation pixel geometry differs from its normalized geometry");
  return { ...annotation, revision: 1, createdAt, updatedAt: createdAt, pixelGeometry: pixelGeometry as Geometry };
}

function pixels(annotation: AnnotationInput): Geometry {
  const { x, y, width, height } = annotation.geometry;
  const left = Math.round(x * annotation.originalWidth), top = Math.round(y * annotation.originalHeight);
  const right = Math.round((x + width) * annotation.originalWidth), bottom = Math.round((y + height) * annotation.originalHeight);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

async function publishAnnotation(view: FeedbackView, annotation: Annotation): Promise<void> {
  const casePath = resolve(view.directory, "cases", annotation.caseId);
  const parent = await openDirectory(casePath);
  let directory: FileHandle | undefined;
  let temporary: string | undefined;
  try {
    const anchor = `/proc/self/fd/${parent.fd}`;
    try { await mkdir(join(anchor, "annotations"), { mode: 0o700 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    await parent.sync();
    directory = await open(join(anchor, "annotations"), constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    requireAnnotation(await realpath(`/proc/self/fd/${directory.fd}`) === join(casePath, "annotations"), "Annotation directory escaped its registered path");
    const directoryAnchor = `/proc/self/fd/${directory.fd}`;
    temporary = join(directoryAnchor, `.pending-${randomUUID()}`);
    const file = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    try { await file.writeFile(JSON.stringify(annotation, null, 2) + "\n"); await file.sync(); }
    finally { await file.close(); }
    // Linking publishes the complete file atomically without replacing an existing ID.
    try { await link(temporary, join(directoryAnchor, `${annotation.id}.json`)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new AnnotationError("Annotation ID already exists", 409); throw error; }
    await unlink(temporary); temporary = undefined;
    await directory.sync();
  } finally {
    try { if (temporary) await unlink(temporary); }
    finally { try { await directory?.close(); } finally { await parent.close(); } }
  }
}

async function syncAnnotation(view: FeedbackView, annotation: Annotation): Promise<void> {
  const casePath = resolve(view.directory, "cases", annotation.caseId);
  const parent = await openDirectory(casePath);
  let directory: FileHandle | undefined;
  try {
    directory = await open(join(`/proc/self/fd/${parent.fd}`, "annotations"), constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    const directoryPath = join(casePath, "annotations");
    requireAnnotation(await realpath(`/proc/self/fd/${directory.fd}`) === directoryPath, "Annotation directory escaped its registered path");
    const file = await open(join(`/proc/self/fd/${directory.fd}`, `${annotation.id}.json`), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      requireAnnotation(await realpath(`/proc/self/fd/${file.fd}`) === join(directoryPath, `${annotation.id}.json`) && (await file.stat()).isFile(), "Annotation file escaped its registered path");
      await file.sync();
    } finally { await file.close(); }
    await directory.sync();
    await parent.sync();
  } finally { try { await directory?.close(); } finally { await parent.close(); } }
}

async function openDirectory(path: string): Promise<FileHandle> {
  await safeComponents(path);
  const handle = await open(path, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try { requireAnnotation(await realpath(`/proc/self/fd/${handle.fd}`) === resolve(path), "Annotation directory escaped its registered path"); return handle; }
  catch (error) { await handle.close(); throw error; }
}
async function verifySource(root: string, asset: Parameters<typeof assetBytes>[1]): Promise<void> {
  try { await assetBytes(root, asset); }
  catch { throw new AnnotationError("Registered source image changed or is unsafe; import a new session", 409); }
}
function isObject(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function requireAnnotation(value: unknown, message: string, status = 400): asserts value { if (!value) throw new AnnotationError(message, status); }
