import type { DiagramDefinition } from "./types";

export interface ExcalidrawSkeleton {
  id: string;
  type: "rectangle" | "arrow";
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[][];
  backgroundColor?: string;
  strokeColor: string;
  strokeStyle?: "solid" | "dashed";
  endArrowhead?: "arrow";
  label: { text: string; fontSize: number };
}

export function diagramToSkeleton(definition: DiagramDefinition): ExcalidrawSkeleton[] {
  const nodes = new Map(definition.nodes.map((node) => [node.id, node]));
  const rectangles: ExcalidrawSkeleton[] = definition.nodes.map((node) => ({
    id: node.id,
    type: "rectangle",
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    backgroundColor: node.kind === "boundary" ? "#fff3bf" : node.kind === "monitor" || node.kind === "dashboard" ? "#e5dbff" : "#dbe4ff",
    strokeColor: node.kind === "boundary" ? "#e67700" : "#5f3dc4",
    label: { text: node.label, fontSize: 16 }
  }));
  const arrows: ExcalidrawSkeleton[] = definition.edges.flatMap((edge) => {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) return [];
    const startX = from.x + from.width / 2;
    const startY = from.y + from.height / 2;
    const endX = to.x + to.width / 2;
    const endY = to.y + to.height / 2;
    return [{
      id: edge.id,
      type: "arrow" as const,
      x: startX,
      y: startY,
      points: [[0, 0], [endX - startX, endY - startY]],
      strokeColor: edge.flow === "failure" ? "#c92a2a" : edge.flow === "observability" ? "#7048e8" : "#2b8a3e",
      strokeStyle: edge.flow === "happy" ? "solid" as const : "dashed" as const,
      endArrowhead: "arrow" as const,
      label: { text: edge.label, fontSize: 12 }
    }];
  });
  return [...rectangles, ...arrows];
}
