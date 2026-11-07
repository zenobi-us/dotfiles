import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

/** A reference table. Wide tables scroll inside their own box on narrow screens. */
function Root(props: { label: string; children: ReactNode }) {
  return (
    <div className="max-w-full overflow-x-auto border border-border [&+&]:mt-4">
      <table className="w-full border-collapse text-left text-[11px]" aria-label={props.label}>
        {props.children}
      </table>
    </div>
  );
}

function Head(props: { columns: string[] }) {
  return (
    <thead className="bg-card">
      <tr>
        {props.columns.map((column) => (
          <th key={column} scope="col" className="border-b border-border px-3 py-2 font-medium whitespace-nowrap">
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Body(props: { children: ReactNode }) {
  return <tbody>{props.children}</tbody>;
}

function Row(props: { children: ReactNode }) {
  return <tr className="align-top [&+&]:border-t [&+&]:border-border">{props.children}</tr>;
}

function Cell(props: { code?: boolean; muted?: boolean; children: ReactNode }) {
  return (
    <td
      className={cx("px-3 py-2", props.code && "font-mono whitespace-nowrap text-primary", props.muted && "text-muted")}
    >
      {props.children}
    </td>
  );
}

export const DataTable = Object.assign(Root, { Root, Head, Body, Row, Cell });
