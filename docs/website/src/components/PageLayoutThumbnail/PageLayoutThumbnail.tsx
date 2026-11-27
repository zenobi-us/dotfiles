import { useId } from "react";
import { layoutRoles, type PageKind } from "../PageKinds/page-kinds";

/** A schematic, not a screenshot. Every colour-coded region also has a label. */
export function PageLayoutThumbnail(props: { kind: PageKind }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 200 184"
      width={200}
      height={184}
      className="block h-auto w-full"
      role="img"
      aria-labelledby={`${id}-title ${id}-description`}
    >
      <title id={`${id}-title`}>{`${props.kind.name} layout`}</title>
      <desc id={`${id}-description`}>{props.kind.description}</desc>
      {props.kind.regions.map((region) => (
        <g key={`${region.x}-${region.y}`} className={layoutRoles[region.role].className}>
          <rect
            x={region.x}
            y={region.y}
            width={region.width}
            height={region.height}
            fill="currentColor"
            fillOpacity={0.12}
            stroke="currentColor"
            strokeOpacity={0.65}
            strokeWidth={0.7}
          />
          <text x={region.x + 5} y={region.y + region.height / 2 + 2.7} fontSize={8} fill="currentColor">
            {region.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
