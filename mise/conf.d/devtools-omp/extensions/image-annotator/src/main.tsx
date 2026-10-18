import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@excalidraw/excalidraw/index.css";
import "./style.css";

type SupportedImageMimeType = "image/png" | "image/jpeg" | "image/webp" | "image/gif";
type ExcalidrawFileData = NonNullable<ExcalidrawInitialDataState["files"]>[string];
type ExcalidrawFileId = ExcalidrawFileData["id"];
type ExcalidrawElement = NonNullable<ExcalidrawInitialDataState["elements"]>[number];
type ExcalidrawZoomValue = NonNullable<NonNullable<ExcalidrawInitialDataState["appState"]>["zoom"]>["value"];

type SourceImage = {
  data: string;
  mimeType: SupportedImageMimeType;
};
type AnnotationScene = ExcalidrawInitialDataState & { scrollToContent: boolean };
const fileId = "annotation-source-image" as ExcalidrawFileId;
const token = new URLSearchParams(window.location.search).get("token");

function App() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [scene, setScene] = useState<AnnotationScene | null>(null);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This annotation session is invalid.");
      return;
    }

    void fetch(`/api/source?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json() as Promise<SourceImage>;
      })
      .then(setSource)
      .catch((reason: unknown) => setError(errorText(reason)));
  }, []);
  useEffect(() => {
    if (!source) return;
    void makeScene(source).then(setScene).catch((reason: unknown) => setError(errorText(reason)));
  }, [source]);
  useEffect(() => {
    if (!api || !scene) return;
    const imageElement = scene.elements?.[0];
    if (imageElement) api.scrollToContent(imageElement, { fitToViewport: true, viewportZoomFactor: 0.9, animate: false });
  }, [api, scene]);

  const finish = async () => {
    if (!api || saving || !token) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: {
          ...api.getAppState(),
          exportBackground: false,
          exportWithDarkMode: false,
        },
        files: api.getFiles(),
        mimeType: "image/png",
        exportPadding: 0,
      });
      const response = await fetch(`/api/done?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "image/png" },
        body: blob,
      });
      if (!response.ok) throw new Error(await response.text());
      document.body.innerHTML = "<main class=complete>Annotated image sent to Pi. You can close this tab.</main>";
    } catch (reason) {
      setError(errorText(reason));
      setSaving(false);
    }
  };
  const cancel = async () => {
    if (!token || saving) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/cancel?token=${encodeURIComponent(token)}`, { method: "POST" });
      if (!response.ok) throw new Error(await response.text());
      document.body.innerHTML = "<main class=complete>Annotation cancelled. You can close this tab.</main>";
    } catch (reason) {
      setError(errorText(reason));
      setSaving(false);
    }
  };

  if (error && !source) return <main className="notice">{error}</main>;
  if (!source || !scene) return <main className="notice">{error ?? "Loading image…"}</main>;

  return (
    <main className="app">
      <header className="toolbar">
        <strong>Annotate image</strong>
        <span>Draw on the image, then send the result to Pi.</span>
        <button className="cancel" type="button" onClick={() => void cancel()} disabled={saving}>
          Cancel
        </button>
        <button type="button" onClick={() => void finish()} disabled={!api || saving}>
          {saving ? "Sending…" : "Done"}
        </button>
      </header>
      {error && <div className="error">{error}</div>}
      <Excalidraw
        excalidrawAPI={setApi}
        initialData={scene}
      />
    </main>
  );
}

async function makeScene(source: SourceImage): Promise<AnnotationScene> {
  const dataURL = `data:${source.mimeType};base64,${source.data}`;
  const image = new Image();
  image.src = dataURL;
  await new Promise<void>((resolveImage, rejectImage) => {
    image.onload = () => resolveImage();
    image.onerror = () => rejectImage(new Error("The image could not be loaded."));
  });
  const element: NonNullable<ExcalidrawInitialDataState["elements"]>[number] = {
    index: "a0" as ExcalidrawElement["index"],
    id: fileId,
    type: "image",
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
    angle: 0,
    strokeColor: "transparent",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 0,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: 1,
    version: 1,
    versionNonce: 1,
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: true,
    status: "saved",
    fileId,
    scale: [1, 1],
    crop: null,
  };
  const zoom = Math.min(
    1,
    ((window.innerWidth - 80) * 0.9) / image.naturalWidth,
    ((window.innerHeight - 150) * 0.9) / image.naturalHeight,
  );
  return {
    elements: [element],
    appState: { viewBackgroundColor: "#ffffff", zoom: { value: zoom as ExcalidrawZoomValue } },
    files: {
      [fileId]: {
        id: fileId,
        mimeType: source.mimeType,
        dataURL: `data:${source.mimeType};base64,${source.data}` as ExcalidrawFileData["dataURL"],
        created: Date.now(),
        lastRetrieved: Date.now(),
      },
    },
    scrollToContent: true,
  };
}

function errorText(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

createRoot(document.getElementById("root")!).render(<App />);
