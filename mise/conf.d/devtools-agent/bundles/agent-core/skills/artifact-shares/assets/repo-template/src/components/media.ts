/*!
 * What a browser can render from this site, and what it cannot.
 *
 * Kept from the zeno app so a published share behaves the same way.
 */

/** An image or a video becomes a thumbnail. Everything else stays a row. */
export const IS_IMAGE = /\.(png|jpe?g|gif|svg|webp|avif)$/i;

/**
 * Only the formats every current browser plays from a plain <video> tag. A
 * .mov or .avi file stays a row, because a thumbnail that cannot paint its
 * first frame reads as a broken image.
 */
export const IS_VIDEO = /\.(mp4|m4v|webm)$/i;

export const isMedia = (path: string) => IS_IMAGE.test(path) || IS_VIDEO.test(path);
export const isVideo = (path: string) => IS_VIDEO.test(path);

export function baseName(path: string): string {
  const cut = path.lastIndexOf("/");
  return cut === -1 ? path : path.slice(cut + 1);
}

export type Slide = {
  /** URL of the file, already prefixed with the site base path. */
  src: string;
  /** Caption under the thumbnail and inside the viewer. */
  caption?: string;
};
