import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Excalidraw,
  convertToExcalidrawElements,
  exportToBlob,
  exportToSvg
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import type { DiagramDefinition } from "./types";
import { diagramToSkeleton } from "./diagram-adapter";

function download(value: Blob | string, filename: string): void {
  const blob = typeof value === "string" ? new Blob([value], { type: "application/json" }) : value;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Editor({ definition }: { definition: DiagramDefinition }): React.JSX.Element {
  const canonicalElements = useMemo(
    () => convertToExcalidrawElements(diagramToSkeleton(definition) as Parameters<typeof convertToExcalidrawElements>[0]),
    [definition]
  );
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const exportScene = async (format: "svg" | "png" | "excalidraw") => {
    if (!api) return;
    const elements = api.getSceneElements();
    const files = api.getFiles();
    if (format === "svg") {
      const svg = await exportToSvg({ elements, appState: api.getAppState(), files, exportPadding: 20 });
      download(new XMLSerializer().serializeToString(svg), `${definition.id}.svg`);
    } else if (format === "png") {
      const blob = await exportToBlob({ elements, appState: api.getAppState(), files, mimeType: "image/png", quality: 0.95 });
      download(blob, `${definition.id}.png`);
    } else {
      download(JSON.stringify({ type: "excalidraw", version: 2, source: window.location.origin, elements, appState: {}, files }, null, 2), `${definition.id}.excalidraw`);
    }
  };

  return (
    <div className={`visual-editor-shell${fullscreen ? " is-fullscreen" : ""}`}>
      <div className="visual-editor-toolbar" role="toolbar" aria-label="Diagram editor actions">
        <button type="button" onClick={() => api?.updateScene({ elements: canonicalElements })}>Reset canonical diagram</button>
        <button type="button" onClick={() => void exportScene("svg")}>Export SVG</button>
        <button type="button" onClick={() => void exportScene("png")}>Export PNG</button>
        <button type="button" onClick={() => void exportScene("excalidraw")}>Download .excalidraw</button>
        <button type="button" onClick={() => setFullscreen((value) => !value)}>{fullscreen ? "Exit full screen" : "Full screen"}</button>
      </div>
      <p className="visual-save-note">Edits stay in this browser session. Download a file to keep them.</p>
      <div className="visual-editor-canvas">
        <Excalidraw
          initialData={{ elements: canonicalElements, appState: { viewBackgroundColor: "#ffffff" } }}
          excalidrawAPI={setApi}
          name={definition.title}
        />
      </div>
    </div>
  );
}

export function openDiagramEditor(container: HTMLElement, definition: DiagramDefinition): () => void {
  const root = createRoot(container);
  root.render(<Editor definition={definition} />);
  return () => root.unmount();
}
