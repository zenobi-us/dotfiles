import { Diagram } from "../components/Diagram";
import type { DiagramProps } from "./types";

export function Lifecycle(props: DiagramProps) {
  return (
    <Diagram.Svg id="life" title={props.title} description={props.description} height={400}>
      <Diagram.Edge d="M220 116H290" />
      <Diagram.Edge d="M490 116H560" />
      <Diagram.Edge d="M760 116H840" />
      <Diagram.Edge d="M660 148V239" failure />
      <Diagram.Edge d="M560 271H390V148" dashed />
      <Diagram.Edge d="M1040 116H1090V345H760" />
      <Diagram.Edge d="M940 148V239" />
      <Diagram.Edge d="M940 303V345H760" />
      <Diagram.Edge d="M940 84V24H390V84" dashed />
      <Diagram.Node x={20} y={84} width={200} title="Implementing" subtitle="Fresh implementation" />
      <Diagram.Node x={290} y={84} width={200} title="Reviewable" subtitle="Freeze source commit" />
      <Diagram.Node x={560} y={84} width={200} title="Review" subtitle="Independent reviewer" />
      <Diagram.Node x={840} y={84} width={200} title="Approved" subtitle="Commit-bound verdict" highlighted />
      <Diagram.Node x={560} y={239} width={200} title="Needs fix" subtitle="Fix → new commit" />
      <Diagram.Node x={840} y={239} width={200} title="Submitted" subtitle="Optional pull request" />
      <Diagram.Node x={560} y={313} width={200} title="Finished" subtitle="Finish directly or after PR" />
      <Diagram.Text x={800} y={101} tone="success" anchor="middle">
        SUCCESS
      </Diagram.Text>
      <Diagram.Text x={676} y={196} tone="failure">
        FAILURE
      </Diagram.Text>
      <Diagram.Text x={460} y={229} anchor="middle">
        Review again
      </Diagram.Text>
      <Diagram.Text x={956} y={195}>
        Submit
      </Diagram.Text>
      <Diagram.Text x={1078} y={229} anchor="end">
        Finish
      </Diagram.Text>
      <Diagram.Text x={960} y={330}>
        Finish
      </Diagram.Text>
      <Diagram.Text x={660} y={15} anchor="middle">
        New commit invalidates the previous verdict
      </Diagram.Text>
    </Diagram.Svg>
  );
}
