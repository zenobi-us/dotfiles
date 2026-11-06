import { Diagram } from "../components/Diagram";
import type { DiagramProps } from "./types";

const YOU = 120;
const PLAYBOOK = 520;
const AGENT = 990;

const messages: Array<{ from: number; to: number; y: number; label: string }> = [
  { from: YOU, to: PLAYBOOK, y: 84, label: "start(ticket)" },
  { from: PLAYBOOK, to: AGENT, y: 140, label: "Implementation handoff" },
  { from: AGENT, to: PLAYBOOK, y: 196, label: "Completion signal + durable receipt" },
  { from: YOU, to: PLAYBOOK, y: 252, label: "review(ticket)" },
  { from: PLAYBOOK, to: AGENT, y: 308, label: "Different reviewer · same source worktree" },
  { from: AGENT, to: PLAYBOOK, y: 364, label: "Verdict for the frozen commit" },
];

export function Handoff(props: DiagramProps) {
  return (
    <Diagram.Svg id="handoff" title={props.title} description={props.description} height={442}>
      {[YOU, PLAYBOOK, AGENT].map((x) => (
        <Diagram.Lane key={x} x={x} from={50} to={388} />
      ))}
      <Diagram.Text x={YOU} y={26} tone="label" anchor="middle">
        YOU
      </Diagram.Text>
      <Diagram.Text x={PLAYBOOK} y={26} tone="label" anchor="middle">
        WORKTREE PLAYBOOK
      </Diagram.Text>
      <Diagram.Text x={AGENT} y={26} tone="label" anchor="middle">
        FRESH AGENT SESSION
      </Diagram.Text>
      {messages.map(({ from, to, y, label }) => (
        <g key={label}>
          <Diagram.Edge d={`M${from} ${y}H${to}`} />
          <Diagram.Text x={(from + to) / 2} y={y - 12} anchor="middle">
            {label}
          </Diagram.Text>
        </g>
      ))}
      <Diagram.Text x={YOU} y={420} anchor="middle">
        01 / Request
      </Diagram.Text>
      <Diagram.Text x={PLAYBOOK} y={420} anchor="middle">
        02 / Verify receipts after each signal
      </Diagram.Text>
      <Diagram.Text x={AGENT} y={420} anchor="middle">
        03 / Never reuse the implementer
      </Diagram.Text>
    </Diagram.Svg>
  );
}
