import { useState, useMemo } from "react";
import type { Location, LocationMapping } from "../../api";
import { useLocations, useLocationMappings } from "../../lib/hooks/useApiQueries";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";

const SVG_SIZE = 600;
const CENTER = SVG_SIZE / 2;
const RADIUS = 220;
const NODE_RADIUS = 24;
const PRIMARY_HSL = "hsl(213, 72%, 37%)";
const EDGE_STROKE = "hsl(215, 12%, 44%)";

interface NodePosition {
  x: number;
  y: number;
  location: Location;
}

function computeCircularLayout(locations: Location[]): NodePosition[] {
  const count = locations.length;
  if (count === 0) return [];
  if (count === 1) {
    return [{ x: CENTER, y: CENTER, location: locations[0] }];
  }
  return locations.map((loc, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
      location: loc,
    };
  });
}

function nodeOpacity(rank: number, maxRank: number): number {
  if (maxRank <= 0) return 1;
  return 0.4 + 0.6 * (1 - rank / (maxRank + 1));
}

function curvedEdgePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const curvature = 0.2;
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function shortenToEdge(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  r: number,
): { x: number; y: number } {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: toX, y: toY };
  return {
    x: toX - (dx / dist) * r,
    y: toY - (dy / dist) * r,
  };
}

interface TooltipData {
  location: Location;
  x: number;
  y: number;
}

function GraphEdge({
  mapping,
  nodeMap,
}: {
  mapping: LocationMapping;
  nodeMap: Map<number, NodePosition>;
}) {
  const source = nodeMap.get(mapping.sourceId);
  const sink = nodeMap.get(mapping.sinkId);
  if (!source || !sink) return null;

  const target = shortenToEdge(source.x, source.y, sink.x, sink.y, NODE_RADIUS + 4);
  const start = shortenToEdge(sink.x, sink.y, source.x, source.y, NODE_RADIUS + 2);

  return (
    <path
      d={curvedEdgePath(start.x, start.y, target.x, target.y)}
      fill="none"
      stroke={EDGE_STROKE}
      strokeWidth={1.5}
      markerEnd="url(#arrowhead)"
      opacity={0.7}
    />
  );
}

function GraphNode({
  node,
  maxRank,
  onHover,
  onLeave,
}: {
  node: NodePosition;
  maxRank: number;
  onHover: (data: TooltipData) => void;
  onLeave: () => void;
}) {
  const opacity = nodeOpacity(node.location.rank, maxRank);

  return (
    <g
      onMouseEnter={() =>
        onHover({ location: node.location, x: node.x, y: node.y })
      }
      onMouseLeave={onLeave}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={node.x}
        cy={node.y}
        r={NODE_RADIUS}
        fill={PRIMARY_HSL}
        opacity={opacity}
        stroke="white"
        strokeWidth={2}
      />
      <text
        x={node.x}
        y={node.y + NODE_RADIUS + 16}
        textAnchor="middle"
        fontSize={11}
        fill="currentColor"
        className="select-none"
      >
        {node.location.name.length > 18
          ? node.location.name.slice(0, 16) + "\u2026"
          : node.location.name}
      </text>
      <text
        x={node.x}
        y={node.y + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill="white"
        className="select-none"
      >
        {node.location.rank}
      </text>
    </g>
  );
}

function Tooltip({ data }: { data: TooltipData }) {
  const boxWidth = 180;
  const boxHeight = 72;
  let tx = data.x + NODE_RADIUS + 8;
  let ty = data.y - boxHeight / 2;

  if (tx + boxWidth > SVG_SIZE) tx = data.x - NODE_RADIUS - 8 - boxWidth;
  if (ty < 0) ty = 4;
  if (ty + boxHeight > SVG_SIZE) ty = SVG_SIZE - boxHeight - 4;

  return (
    <g pointerEvents="none">
      <rect
        x={tx}
        y={ty}
        width={boxWidth}
        height={boxHeight}
        rx={6}
        fill="hsl(215, 28%, 17%)"
        stroke="hsl(215, 12%, 44%)"
        strokeWidth={1}
        opacity={0.95}
      />
      <text x={tx + 10} y={ty + 18} fontSize={12} fontWeight={600} fill="white">
        {data.location.name}
      </text>
      <text x={tx + 10} y={ty + 34} fontSize={10} fill="hsl(215, 12%, 70%)">
        Rank: {data.location.rank} | Year: {data.location.year}
      </text>
      <text x={tx + 10} y={ty + 50} fontSize={9} fill="hsl(215, 12%, 60%)">
        {data.location.address.length > 28
          ? data.location.address.slice(0, 26) + "\u2026"
          : data.location.address}
      </text>
      {data.location.description && (
        <text x={tx + 10} y={ty + 64} fontSize={9} fill="hsl(215, 12%, 55%)">
          {data.location.description.length > 30
            ? data.location.description.slice(0, 28) + "\u2026"
            : data.location.description}
        </text>
      )}
    </g>
  );
}

export function LocationGraph() {
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const { data: mappings, isLoading: mappingsLoading } = useLocationMappings();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const isLoading = locationsLoading || mappingsLoading;

  const nodes = useMemo(
    () => computeCircularLayout(locations ?? []),
    [locations],
  );

  const nodeMap = useMemo(() => {
    const map = new Map<number, NodePosition>();
    for (const n of nodes) {
      map.set(n.location.id, n);
    }
    return map;
  }, [nodes]);

  const maxRank = useMemo(
    () =>
      (locations ?? []).reduce(
        (max, loc) => Math.max(max, loc.rank),
        0,
      ),
    [locations],
  );

  const edgeCount = (mappings ?? []).length;
  const nodeCount = (locations ?? []).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Location Mapping Graph
          {!isLoading && (
            <>
              <Badge variant="secondary" className="ml-2">
                {nodeCount} nodes
              </Badge>
              <Badge variant="outline">{edgeCount} edges</Badge>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-64 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : nodeCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No locations to display in the graph
            </p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full"
            style={{ maxHeight: "600px" }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth={10}
                markerHeight={7}
                refX={9}
                refY={3.5}
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={EDGE_STROKE}
                />
              </marker>
            </defs>

            {(mappings ?? []).map((m) => (
              <GraphEdge key={m.id} mapping={m} nodeMap={nodeMap} />
            ))}

            {nodes.map((node) => (
              <GraphNode
                key={node.location.id}
                node={node}
                maxRank={maxRank}
                onHover={setTooltip}
                onLeave={() => setTooltip(null)}
              />
            ))}

            {tooltip && <Tooltip data={tooltip} />}
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
