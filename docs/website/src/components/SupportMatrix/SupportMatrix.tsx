import { harnessSupport } from "../../content";
import { DataTable } from "../DataTable";
import { Glyph } from "../Glyph";

/** Rows are bundle parts, columns are harnesses. Shared by the hub and each bundle page. */
export function SupportMatrix(props: {
  parts: Array<{ id: string; name: string; description: string; harnesses: string[] }>;
}) {
  return (
    <DataTable label="Harness support">
      <DataTable.Head columns={["Part", ...harnessSupport.harnesses.map((harness) => harness.name)]} />
      <DataTable.Body>
        {props.parts.map((part) => (
          <DataTable.Row key={part.id}>
            <DataTable.Cell>
              {part.name}
              <span className="block text-muted">{part.description}</span>
            </DataTable.Cell>
            {harnessSupport.harnesses.map((harness) => {
              const supported = part.harnesses.includes(harness.id);
              return (
                <DataTable.Cell key={harness.id}>
                  <span className={supported ? "text-success" : "text-error"}>
                    <Glyph>{supported ? "✓" : "✗"}</Glyph> {supported ? "supported" : "not supported"}
                  </span>
                </DataTable.Cell>
              );
            })}
          </DataTable.Row>
        ))}
      </DataTable.Body>
    </DataTable>
  );
}
