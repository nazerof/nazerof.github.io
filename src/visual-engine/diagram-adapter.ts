import type { DiagramDefinition, DiagramNode, DiagramNodeKind } from "./types";

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
  strokeStyle?: "solid" | "dashed" | "dotted";
  endArrowhead?: "arrow";
  label: { text: string; fontSize: number };
}

const NODE_STYLES: Record<DiagramNodeKind, { background: string; stroke: string }> = {
  scheduler: { background: "#eef1fd", stroke: "#4c51bf" },
  service: { background: "#eef1fd", stroke: "#4c51bf" },
  connector: { background: "#eef1fd", stroke: "#4c51bf" },
  process: { background: "#eef1fd", stroke: "#4c51bf" },
  boundary: { background: "#fff8e6", stroke: "#e67700" },
  storage: { background: "#e6f7f1", stroke: "#087f5b" },
  monitor: { background: "#f3f0ff", stroke: "#7048e8" },
  dashboard: { background: "#f3f0ff", stroke: "#7048e8" }
};

type Point = [number, number];

/**
 * Anchor an edge on the facing borders of its two nodes (instead of centre to
 * centre) so arrows in the editor never cut through the boxes they connect.
 */
function anchors(from: DiagramNode, to: DiagramNode): { start: Point; end: Point } {
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const deltaX = toCenter.x - fromCenter.x;
  const deltaY = toCenter.y - fromCenter.y;
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    const start: Point = [deltaX >= 0 ? from.x + from.width : from.x, fromCenter.y];
    const end: Point = [deltaX >= 0 ? to.x : to.x + to.width, toCenter.y];
    return { start, end };
  }
  const start: Point = [fromCenter.x, deltaY >= 0 ? from.y + from.height : from.y];
  const end: Point = [toCenter.x, deltaY >= 0 ? to.y : to.y + to.height];
  return { start, end };
}

function segmentCrossesRect(a: Point, b: Point, node: DiagramNode, margin = 4): boolean {
  const left = node.x - margin;
  const right = node.x + node.width + margin;
  const top = node.y - margin;
  const bottom = node.y + node.height + margin;
  const steps = 24;
  for (let step = 1; step < steps; step++) {
    const t = step / steps;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    if (x > left && x < right && y > top && y < bottom) return true;
  }
  return false;
}

function crossings(waypoints: Point[], obstacles: DiagramNode[]): number {
  let count = 0;
  for (const node of obstacles) {
    for (let index = 0; index < waypoints.length - 1; index++) {
      if (segmentCrossesRect(waypoints[index], waypoints[index + 1], node)) {
        count++;
        break;
      }
    }
  }
  return count;
}

/**
 * Route an edge. A straight border-anchored segment is preferred; when it would
 * cut through an unrelated node, fall back to the L-shaped elbow (horizontal
 * exit, vertical entry — or the reverse) that crosses the fewest nodes.
 */
function route(from: DiagramNode, to: DiagramNode, obstacles: DiagramNode[]): Point[] {
  const { start, end } = anchors(from, to);
  const straight: Point[] = [start, end];
  if (!crossings(straight, obstacles)) return straight;

  const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const horizontalExit: Point[] = [
    [toCenter.x > fromCenter.x ? from.x + from.width : from.x, fromCenter.y],
    [toCenter.x, fromCenter.y],
    [toCenter.x, fromCenter.y > toCenter.y ? to.y + to.height : to.y]
  ];
  const verticalExit: Point[] = [
    [fromCenter.x, toCenter.y > fromCenter.y ? from.y + from.height : from.y],
    [fromCenter.x, toCenter.y],
    [fromCenter.x > toCenter.x ? to.x + to.width : to.x, toCenter.y]
  ];
  const candidates = [horizontalExit, verticalExit].map((points) => ({ points, cost: crossings(points, obstacles) }));
  candidates.sort((a, b) => a.cost - b.cost);
  return candidates[0].cost < crossings(straight, obstacles) ? candidates[0].points : straight;
}

export function diagramToSkeleton(definition: DiagramDefinition): ExcalidrawSkeleton[] {
  const nodes = new Map(definition.nodes.map((node) => [node.id, node]));
  const rectangles: ExcalidrawSkeleton[] = definition.nodes.map((node) => {
    const style = NODE_STYLES[node.kind];
    return {
      id: node.id,
      type: "rectangle",
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      backgroundColor: style.background,
      strokeColor: style.stroke,
      label: { text: node.label, fontSize: 16 }
    };
  });
  const arrows: ExcalidrawSkeleton[] = definition.edges.flatMap((edge) => {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) return [];
    const obstacles = definition.nodes.filter((node) => node.id !== edge.from && node.id !== edge.to);
    const waypoints = route(from, to, obstacles);
    const [startX, startY] = waypoints[0];
    return [
      {
        id: edge.id,
        type: "arrow" as const,
        x: startX,
        y: startY,
        points: waypoints.map(([x, y]) => [x - startX, y - startY]),
        strokeColor: edge.flow === "failure" ? "#c92a2a" : edge.flow === "observability" ? "#7048e8" : "#087f5b",
        strokeStyle: edge.flow === "happy" ? ("solid" as const) : edge.flow === "failure" ? ("dashed" as const) : ("dotted" as const),
        endArrowhead: "arrow" as const,
        label: { text: edge.label, fontSize: 12 }
      }
    ];
  });
  return [...rectangles, ...arrows];
}
