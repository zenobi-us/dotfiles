// Component props arrive as one `props` object and are read as `props.name`.
// This rule reports destructuring of component props, in the parameter list or in the body.
import type { RuleTester } from "oxlint/plugins-dev";

type Rule = Parameters<RuleTester["run"]>[1];

// The AST nodes this rule reads, narrowed to the fields it uses.
type Node = { type: string; range: [number, number]; [key: string]: any };

const MESSAGE = "Receive component props as one `props` object and read `props.name`; do not destructure props.";

export const noPropsDestructuring: Rule = {
  meta: {
    type: "suggestion",
    docs: { description: "Disallow destructuring component props." },
    messages: { destructured: MESSAGE },
    schema: [],
  },
  create(context) {
    function checkComponent(fn: Node, name: string | undefined) {
      if (!name || !isComponentName(name)) return;
      const first = unwrapDefault(fn.params[0]);
      if (first?.type === "ObjectPattern") context.report({ node: first, messageId: "destructured" });
    }

    return {
      FunctionDeclaration(node: Node) {
        checkComponent(node, node.id?.name);
      },
      VariableDeclarator(node: Node) {
        const init = node.init;
        if (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression") {
          checkComponent(init, node.id.type === "Identifier" ? node.id.name : undefined);
        }
        if (node.id.type === "ObjectPattern" && init?.type === "Identifier" && init.name === "props") {
          context.report({ node: node.id, messageId: "destructured" });
        }
      },
    };
  },
};

/** React treats a PascalCase function as a component. */
function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name);
}

/** Returns the pattern inside `{ a } = defaults`, or the parameter itself. */
function unwrapDefault(param: Node | undefined): Node | undefined {
  return param?.type === "AssignmentPattern" ? param.left : param;
}

export default {
  meta: { name: "local" },
  rules: { "no-props-destructuring": noPropsDestructuring },
};
