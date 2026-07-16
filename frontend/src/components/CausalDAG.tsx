import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import type { Node, Edge } from "reactflow";
import type { DagNode, DagEdge } from "../lib/types";
import { Card, Skeleton, SectionTitle } from "./ui";

const KIND_STYLE: Record<
  DagNode["kind"],
  { border: string; color: string }
> = {
  source: { border: "#00D4FF", color: "#00D4FF" },
  mediator: { border: "#F39C12", color: "#F39C12" },
  outcome: { border: "#C0392B", color: "#E74C3C" },
};

function buildNodes(dagNodes: DagNode[]): Node[] {
  const sources = dagNodes.filter((n) => n.kind === "source");
  const mediators = dagNodes.filter((n) => n.kind === "mediator");
  const outcomes = dagNodes.filter((n) => n.kind === "outcome");

  const COL_SOURCE = 0;
  const COL_MEDIATOR = 340;
  const COL_OUTCOME = 680;
  const ROW_GAP = 90;

  const nodes: Node[] = [];

  const sourceHeight = Math.max(sources.length - 1, 0) * ROW_GAP;
  sources.forEach((n, i) => {
    nodes.push(makeNode(n, COL_SOURCE, i * ROW_GAP));
  });

  const mediatorOffset = sourceHeight / 2 - ((mediators.length - 1) * ROW_GAP) / 2;
  mediators.forEach((n, i) => {
    nodes.push(makeNode(n, COL_MEDIATOR, mediatorOffset + i * ROW_GAP));
  });

  const outcomeOffset = sourceHeight / 2 - ((outcomes.length - 1) * ROW_GAP) / 2;
  outcomes.forEach((n, i) => {
    nodes.push(makeNode(n, COL_OUTCOME, outcomeOffset + i * ROW_GAP));
  });

  return nodes;
}

function makeNode(n: DagNode, x: number, y: number): Node {
  const style = KIND_STYLE[n.kind];
  return {
    id: n.id,
    position: { x, y },
    data: { label: `${n.icon} ${n.label}` },
    style: {
      background: "#FFFFFF",
      border: `2px solid ${style.border}`,
      color: style.color,
      borderRadius: 12,
      padding: "8px 14px",
      fontSize: 13,
      fontWeight: 600,
      minWidth: 120,
      textAlign: "center" as const,
    },
    sourcePosition: "right" as any,
    targetPosition: "left" as any,
  };
}

function buildEdges(dagEdges: DagEdge[]): Edge[] {
  return dagEdges.map((e, i) => {
    const label = `P(AQI|do(X))=${e.prob}`;
    return {
      id: `e-${e.source}-${e.target}-${i}`,
      source: e.source,
      target: e.target,
      animated: true,
      label,
      labelShowBg: true,
      labelBgStyle: { fill: "#F1F5F9", fillOpacity: 0.9 },
      labelStyle: { fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono, monospace" },
      style: {
        stroke: "#C0392B",
        strokeWidth: 1 + e.strength * 4,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#C0392B",
      },
    } as Edge;
  });
}

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
      <Card>
        <SectionTitle icon="🔗">Causal DAG — do(X) → AQI</SectionTitle>
        <Skeleton className="h-[420px] w-full" />
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle icon="🔗">Causal DAG — do(X) → AQI</SectionTitle>
      <div className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-200">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
        >
          <Background color="#CBD5E1" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </Card>
  );
}
