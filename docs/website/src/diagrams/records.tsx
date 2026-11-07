import { Diagram } from "../components/Diagram";
import type { DiagramProps } from "./types";

export function Records(props: DiagramProps) {
  return (
    <Diagram.Svg id="records" title={props.title} description={props.description} height={330}>
      <Diagram.Edge d="M230 48H290V164H360" />
      <Diagram.Edge d="M230 164H360" />
      <Diagram.Edge d="M230 280H290V164" />
      <Diagram.Edge d="M610 164H680V70H770" />
      <Diagram.Edge d="M680 164V240H770" />
      <Diagram.Edge d="M485 196V259" dashed />
      <Diagram.Node x={20} y={16} width={210} title="Phase-start" subtitle="Before the child runs" />
      <Diagram.Node x={20} y={132} width={210} title="Phase-result" subtitle="Persist the outcome" />
      <Diagram.Node x={20} y={248} width={210} title="Phase-complete" subtitle="Parent verification" />
      <Diagram.Node
        x={360}
        y={132}
        width={250}
        title="events/ · append-only"
        subtitle="Authoritative phase receipts"
        highlighted
      />
      <Diagram.Node x={770} y={38} width={330} title="Reviews + snapshots" subtitle="Immutable outputs / references" />
      <Diagram.Node x={770} y={208} width={330} title="Manifest + projections" subtitle="Replaceable current views" />
      <Diagram.Node x={360} y={259} width={250} title="Evidence reference" subtitle="Resolve its route separately" />
      <Diagram.Text x={690} y={58}>
        Immutable
      </Diagram.Text>
      <Diagram.Text x={690} y={228}>
        Replaceable
      </Diagram.Text>
    </Diagram.Svg>
  );
}
