import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import type { Node, Edge } from "reactflow";
import type { DagNode, DagEdge } from "../lib/types";
import { MotionCard, Skeleton, SectionTitle } from "./ui";

/* ── Node style map ─────────────────────────────────────── */
const KIND_STYLE: Record<DagNode["kind"], { bg: string; border: string; text: string }> = {
  source:   { bg: "#EFF6FF", border: "#3B82F6", text: "#1D4ED8" },
  mediator: { bg: "#FFFBEB", border: "#F59E0B", text: "#B45309" },
  outcome:  { bg: "#FEF2F2", border: "#EF4444", text: "#B91C1C" },
};

/* ── Layout builder ─────────────────────────────────────── */
function buildNodes(dagNodes: DagNode[]): Node[] {
  const sources   = dagNodes.filter((n) => n.kind === "source");
  const mediators = dagNodes.filter((n) => n.kind === "mediator");
  const outcomes  = dagNodes.filter((n) => n.kind === "outcome");

  const COL_X = [0, 260, 520];
  const ROW_GAP = 90;
  const nodes: Node[] = [];

  const srcHeight = Math.max(sources.length - 1, 0) * ROW_GAP;

  sources.forEach((n, i) => {
    nodes.push(makeNode(n, COL_X[0], i * ROW_GAP));
  });
  const medOffset = srcHeight / 2 - ((mediators.length - 1) * ROW_GAP) / 2;
  mediators.forEach((n, i) => {
    nodes.push(makeNode(n, COL_X[1], medOffset + i * ROW_GAP));
  });
  const outOffset = srcHeight / 2 - ((outcomes.length - 1) * ROW_GAP) / 2;
  outcomes.forEach((n, i) => {
    nodes.push(makeNode(n, COL_X[2], outOffset + i * ROW_GAP));
  });

  return nodes;
}

function makeNode(n: DagNode, x: number, y: number): Node {
  const s = KIND_STYLE[n.kind];
  return {
    id:       n.id,
    position: { x, y },
    data:     { label: `${n.icon} ${n.label}` },
    style:    {
      background:  s.bg,
      border:      `1.5px solid ${s.border}`,
      color:       s.text,
      borderRadius: 12,
      padding:     "8px 16px",
      fontSize:    12,
      fontWeight:  700,
      fontFamily:  "'Plus Jakarta Sans', sans-serif",
      minWidth:    120,
      textAlign:   "center" as const,
      boxShadow:   "0 2px 8px rgba(0,0,0,0.06)",
    },
    sourcePosition: "right" as any,
    targetPosition: "left"  as any,
  };
}

/* ── Edge builder ───────────────────────────────────────── */
function buildEdges(dagEdges: DagEdge[]): Edge[] {
  return dagEdges.map((e, i) => ({
    id:         `e-${e.source}-${e.target}-${i}`,
    source:     e.source,
    target:     e.target,
    animated:   true,
    label:      `p=${e.prob.toFixed(2)}`,
    labelShowBg: true,
    labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.95, rx: 6, ry: 6 },
    labelBgPadding: [4, 6] as [number, number],
    labelStyle: {
      fill:       "#6B7280",
      fontSize:   9,
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 600,
    },
    style: {
      stroke:      "#6366F1",
      strokeWidth:  Math.max(1, 1 + e.strength * 3.5),
      strokeOpacity: 0.6 + e.strength * 0.4,
    },
    markerEnd: {
      type:  MarkerType.ArrowClosed,
      color: "#6366F1",
      width: 12,
      height: 12,
    },
  } as Edge));
}

/* ── Main export ────────────────────────────────────────── */
export function CausalDAG({
  dag,
  loading,
}: {
  dag?: { nodes: DagNode[]; edges: DagEdge[] };
  loading?: boolean;
}) {
  const nodes = useMemo(() => (dag ? buildNodes(dag.nodes) : []), [dag]);
  const edges = useMemo(() => (dag ? buildEdges(dag.edges) : []), [dag]);

  if (loading || !dag) {
    return (
      <MotionCard delay={0.2}>
        <SectionTitle>Causal Graph · do(X) → AQI</SectionTitle>
        <Skeleton className="h-[380px] w-full" />
      </MotionCard>
    );
  }

  return (
    <MotionCard delay={0.2}>
      <div className="mb-4 flex items-start justify-between">
        <SectionTitle>Causal Graph · do(X) → AQI</SectionTitle>
        <div className="flex flex-col gap-1">
          {[
            { color: "#3B82F6", label: "Source" },
            { color: "#F59E0B", label: "Mediator" },
            { color: "#EF4444", label: "Outcome" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              <span className="text-[10px] text-text-muted">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[380px] w-full overflow-hidden rounded-2xl border border-border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          nodesDraggable={false}
        >
          <Background color="#F3F4F6" gap={24} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Edge weight note */}
      <p className="mt-3 text-[10px] text-text-muted">
        Edge thickness = causal effect strength. Labels show
        P(AQI | do(X)) probability.
      </p>
    </MotionCard>
  );
}
