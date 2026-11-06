import { type ReactNode, useMemo } from "react";
import { cx } from "../../lib/cx";
import { DiagramContext, useDiagram } from "./useDiagram";

const VIEWBOX_WIDTH = 1120;
const NODE_HEIGHT = 64;

function Svg(props: { id: string; title: string; description: string; height: number; children: ReactNode }) {
  const context = useMemo(() => ({ id: props.id }), [props.id]);
  return (
    <DiagramContext.Provider value={context}>
      <svg
        className="mx-auto block h-auto w-[min(100%,1440px)] min-w-[980px] print:min-w-0 wide:w-[min(100%,1600px)]"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${props.height}`}
        role="img"
        aria-labelledby={`${props.id}-title ${props.id}-desc`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title id={`${props.id}-title`}>{props.title}</title>
        <desc id={`${props.id}-desc`}>{props.description}</desc>
        <Markers />
        {props.children}
      </svg>
    </DiagramContext.Provider>
  );
}

function Markers() {
  const diagram = useDiagram();
  return (
    <defs>
      <marker
        id={`${diagram.id}-arrow`}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 0L10 5L0 10Z" fill="var(--color-primary)" />
      </marker>
      <marker
        id={`${diagram.id}-error`}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path d="M0 0L10 5L0 10Z" fill="var(--color-error)" />
      </marker>
    </defs>
  );
}

const tones = {
  default: "fill-foreground text-[13px]",
  small: "fill-muted text-[11px]",
  label: "fill-muted text-[10px] tracking-[.08em]",
  key: "fill-primary text-[13px]",
  success: "fill-success text-[13px]",
  failure: "fill-error text-[13px]",
};

type TextProps = {
  x: number;
  y: number;
  tone?: keyof typeof tones;
  anchor?: "start" | "middle" | "end";
  children: string;
};

function Text(props: TextProps) {
  return (
    <text
      className={cx("font-mono font-normal", tones[props.tone ?? "small"])}
      x={props.x}
      y={props.y}
      textAnchor={props.anchor ?? "start"}
    >
      {props.children}
    </text>
  );
}

type NodeProps = { x: number; y: number; width: number; title: string; subtitle?: string; highlighted?: boolean };

/** A box with a title and an optional subtitle. `highlighted` marks the node the diagram is about. */
function Node(props: NodeProps) {
  return (
    <g>
      <rect
        className={cx("fill-card stroke-1", props.highlighted ? "stroke-primary" : "stroke-border")}
        x={props.x}
        y={props.y}
        width={props.width}
        height={NODE_HEIGHT}
      />
      <Text x={props.x + 16} y={props.y + 26} tone={props.highlighted ? "key" : "default"}>
        {props.title}
      </Text>
      {props.subtitle && (
        <Text x={props.x + 16} y={props.y + 47}>
          {props.subtitle}
        </Text>
      )}
    </g>
  );
}

function Edge(props: { d: string; dashed?: boolean; failure?: boolean }) {
  const diagram = useDiagram();
  return (
    <path
      className={cx("fill-none stroke-[1.3]", props.failure ? "stroke-error" : "stroke-primary")}
      d={props.d}
      strokeDasharray={props.dashed ? "5 5" : undefined}
      markerEnd={`url(#${diagram.id}-${props.failure ? "error" : "arrow"})`}
    />
  );
}

/** A dashed vertical guide for one actor in a sequence diagram. */
function Lane(props: { x: number; from: number; to: number }) {
  return <path className="stroke-border [stroke-dasharray:4_5]" d={`M${props.x} ${props.from}V${props.to}`} />;
}

export const Diagram = Object.assign(Svg, { Svg, Node, Edge, Text, Lane });
