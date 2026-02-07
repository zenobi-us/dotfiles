import { FooterContextProvider, FooterSegment } from "../types";

export function normalize(
    name: string,
    value: ReturnType<FooterContextProvider>): FooterSegment[] {
    if (!value) return [];
    const toSegment = (entry: string | FooterSegment): FooterSegment => {
        if (typeof entry === "string") {
            return { text: entry, align: "left", order: 0, enabled: true };
        }
        return {
            text: entry.text,
            align: entry.align ?? "left",
            order: entry.order ?? 0,
            enabled: entry.enabled ?? true,
        };
    };

    const segments = Array.isArray(value)
        ? value.map(toSegment)
        : [toSegment(value)];
    return segments.filter(
        (segment) => segment.enabled && segment.text.trim().length > 0
    );
}
