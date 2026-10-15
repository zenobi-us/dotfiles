import React from 'react';
import { Background, Controls, MarkerType, Position, ReactFlow, useNodesState } from '@xyflow/react';

const startingNodes = [
  { id: 'U', position: { x: 0, y: 170 }, data: { label: 'You' }, type: 'input' },
  { id: 'R', position: { x: 150, y: 170 }, data: { label: 'worktree router' } },
  { id: 'P', position: { x: 355, y: 170 }, data: { label: 'Selected playbook' } },
  { id: 'T', position: { x: 625, y: 0 }, data: { label: 'Ticket skill' } },
  { id: 'C', position: { x: 625, y: 96 }, data: { label: 'shared-context' } },
  { id: 'W', position: { x: 625, y: 210 }, data: { label: 'Worktrunk' } },
  { id: 'M', position: { x: 625, y: 328 }, data: { label: 'muxer-subagents' } },
  { id: 'E', position: { x: 985, y: 75 }, data: { label: 'Workflow records · repository store here' }, type: 'output' },
  { id: 'G', position: { x: 985, y: 223 }, data: { label: 'Source Git worktree' }, type: 'output' },
  { id: 'A', position: { x: 843, y: 355 }, data: { label: 'Fresh agent session' } },
].map((node) => ({ ...node, sourcePosition: Position.Right, targetPosition: Position.Left }));

const connections = [
  ['U', 'R'], ['R', 'P'],
  ['P', 'T', 'canonical issue'],
  ['P', 'C', 'resolve paths and refs'],
  ['P', 'W', 'create, merge, remove'],
  ['P', 'M', 'open, wait, read, close'],
  ['W', 'G'], ['M', 'A'], ['A', 'G'], ['C', 'E'],
  ['P', 'E', 'phase-start and phase-complete receipts'],
  ['A', 'E', 'phase-result receipts and artifacts'],
];

export function NodeWorkshop({ colors }) {
  const [nodes, , onNodesChange] = useNodesState(startingNodes);
  const edges = connections.map(([source, target, label], index) => ({
    id: `edge-${index}`, source, target, label, type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: colors.accent },
    style: { stroke: colors.accent, strokeWidth: 1.5 },
    labelStyle: { fill: colors.ink, fontSize: 12 },
    labelBgStyle: { fill: colors.surface, fillOpacity: 0.94 },
  }));

  return (
    <div className="flow-workshop" aria-label="Interactive component map">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodesConnectable={false}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.4}
        maxZoom={1.7}
        zoomOnScroll={false}
        colorMode="light"
      >
        <Background color={colors.line} gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
