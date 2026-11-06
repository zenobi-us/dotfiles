import { Diagram } from "../components/Diagram";
import type { DiagramProps } from "./types";

export function Ownership(props: DiagramProps) {
  return (
    <Diagram.Svg id="owner" title={props.title} description={props.description} height={330}>
      <Diagram.Edge d="M160 163H220" />
      <Diagram.Edge d="M440 163H490V45H570" />
      <Diagram.Edge d="M490 125H570" />
      <Diagram.Edge d="M490 205H570" />
      <Diagram.Edge d="M490 163V285H570" />
      <Diagram.Edge d="M790 45H900" />
      <Diagram.Edge d="M790 125H900" />
      <Diagram.Edge d="M790 205H900" />
      <Diagram.Node x={16} y={131} width={144} title="You" subtitle="Select a phase" />
      <Diagram.Node x={220} y={131} width={220} title="Worktree playbook" subtitle="Coordinate the phase" highlighted />
      <Diagram.Node x={570} y={13} width={220} title="shared-context" subtitle="Resolve storage routes" />
      <Diagram.Node x={570} y={93} width={220} title="muxer-subagents" subtitle="Create fresh sessions" />
      <Diagram.Node x={570} y={173} width={220} title="Worktrunk" subtitle="Own Git lifecycle" />
      <Diagram.Node x={570} y={253} width={220} title="Ticket skill" subtitle="Resolve issue reference" />
      <Diagram.Node x={900} y={13} width={204} title="Records" subtitle="Resolved locations" />
      <Diagram.Node x={900} y={93} width={204} title="New agent" subtitle="Independent context" />
      <Diagram.Node x={900} y={173} width={204} title="Git worktree" subtitle="Source workspace" />
      <Diagram.Text x={490} y={321} anchor="middle">
        Coordination is not ownership of storage, sessions, or Git.
      </Diagram.Text>
    </Diagram.Svg>
  );
}
