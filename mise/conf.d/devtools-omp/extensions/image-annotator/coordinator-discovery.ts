// Avahi owns multicast sockets. The D-Bus connection owns this registration, including cleanup after an OMP crash.
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { systemBus, type ClientInterface, type MessageBus } from "dbus-next";

export const COORDINATOR_SERVICE_TYPE = "_omp-ink._tcp";

export interface CoordinatorAdvertisement {
  name: string;
  close(): Promise<void>;
}

interface AdvertisementOptions {
  id: string;
  port: number;
  onFailure(error: Error): void;
}

interface AvahiServer extends ClientInterface {
  EntryGroupNew(): Promise<string>;
}

interface AvahiEntryGroup extends ClientInterface {
  AddService(iface: number, protocol: number, flags: number, name: string, type: string, domain: string, host: string, port: number, txt: Buffer[]): Promise<void>;
  Commit(): Promise<void>;
  GetState(): Promise<number>;
}

interface AdvertisementState {
  ready: boolean;
  closing: boolean;
  onFailure(error: Error): void;
  rejectStartup(error: Error): void;
}

export async function advertiseCoordinator(options: AdvertisementOptions): Promise<CoordinatorAdvertisement> {
  const name = `OMP Ink ${options.id}`;
  const bus = systemBus();
  const { promise: failed, reject: rejectFailure } = Promise.withResolvers<never>();
  const state: AdvertisementState = {
    ready: false,
    closing: false,
    onFailure: options.onFailure,
    rejectStartup: rejectFailure,
  };
  bus.on("error", () => reportAdvertisementFailure(state, new Error("Avahi D-Bus connection failed. Check the system bus and avahi-daemon.")));
  const deadline = setTimeout(() => reportAdvertisementFailure(state, new Error("DNS-SD registration timed out. Check avahi-daemon.")), 10_000);
  try {
    await Promise.race([registerService(bus, name, options, state), failed]);
    state.ready = true;
  } catch (error) {
    state.closing = true;
    bus.disconnect();
    throw error;
  } finally {
    clearTimeout(deadline);
  }
  return {
    name,
    close: async () => {
      if (state.closing) return;
      state.closing = true;
      bus.disconnect();
    },
  };
}

// Discovery IDs survive address changes, but are public preferences rather than authentication keys.
export async function loadCoordinatorIdentity(directory: string): Promise<string> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = resolve(directory, "coordinator-id");
  let stored: string;
  try {
    stored = await readFile(path, "utf8");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
    const id = randomBytes(16).toString("hex");
    try {
      await writeFile(path, `${id}\n`, { flag: "wx", mode: 0o600 });
      return id;
    } catch (writeError) {
      if (!(writeError instanceof Error) || !("code" in writeError) || writeError.code !== "EEXIST") throw writeError;
      stored = await readFile(path, "utf8");
    }
  }
  const id = stored.trim();
  if (!/^[a-f0-9]{32}$/.test(id)) {
    throw new Error("Stored coordinator ID must contain 32 lowercase hexadecimal characters. Preserve the file and repair it before startup.");
  }
  return id;
}

async function registerService(bus: MessageBus, name: string, options: AdvertisementOptions, state: AdvertisementState): Promise<AvahiEntryGroup> {
  const root = await bus.getProxyObject("org.freedesktop.Avahi", "/");
  const server = root.getInterface<AvahiServer>("org.freedesktop.Avahi.Server");
  const path = await server.EntryGroupNew();
  const object = await bus.getProxyObject("org.freedesktop.Avahi", path);
  const group = object.getInterface<AvahiEntryGroup>("org.freedesktop.Avahi.EntryGroup");
  await new Promise<void>((resolveReady, rejectReady) => {
    group.on("StateChanged", (value: number) => {
      if (value === 2) resolveReady();
      else if (value === 3 || value === 4) {
        const error = new Error("Avahi could not register the coordinator. Check for a service-name conflict or daemon failure.");
        if (state.ready) reportAdvertisementFailure(state, error);
        else rejectReady(error);
      }
    });
    void group.AddService(-1, -1, 0, name, COORDINATOR_SERVICE_TYPE, "local", "", options.port, [
      Buffer.from("proto=1"), Buffer.from(`id=${options.id}`), Buffer.from("path=/"),
    ]).then(() => group.Commit()).then(() => group.GetState()).then((value) => {
      if (value === 2) resolveReady();
      else if (value === 3 || value === 4) rejectReady(new Error("Avahi coordinator registration failed."));
    }).catch(rejectReady);
  });
  return group;
}

function reportAdvertisementFailure(state: AdvertisementState, error: Error): void {
  if (state.closing) return;
  if (state.ready) state.onFailure(error);
  else state.rejectStartup(error);
}
