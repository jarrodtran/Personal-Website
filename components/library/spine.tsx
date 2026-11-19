import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import {
  SPINE_FALLBACK,
  spineInk,
  type SpineFace,
  type SpineLook,
} from "@/lib/library";

const faceClass: Record<SpineFace, string> = {
  serif: "font-display",
  "serif-caps": "font-display uppercase tracking-[0.08em]",
  sans: "font-sans font-semibold",
  "sans-caps": "font-sans font-semibold uppercase tracking-[0.06em]",
};

const faceScale: Record<SpineFace, number> = {
  serif: 1.12,
  "serif-caps": 0.86,
  sans: 1,
  "sans-caps": 0.8,
};

/** Fine cloth weave and a rounded-spine shading, laid over the color. */
const weave =
  "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.05) 0 1px, rgb(0 0 0 / 0.05) 1px 2px), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.04) 0 1px, rgb(0 0 0 / 0.04) 1px 2px)";
const rounding =
  "linear-gradient(90deg, rgb(0 0 0 / 0.4) 0%, rgb(0 0 0 / 0.14) 22%, rgb(255 255 255 / 0.1) 48%, rgb(0 0 0 / 0.12) 76%, rgb(0 0 0 / 0.34) 100%)";

/** Surname-ish tail of the first author, printed at the foot like an imprint. */
function footLabel(author: string): string {
  const first = author.split(/\s+and\s+|,/)[0].trim();
  return first.split(/\s+/).at(-1) ?? first;
}

/**
 * One book standing on a shelf, drawn in CSS 3D: the spine faces out and the
 * front cover is the right-hand side face, which
 * shows as the book turns left (books right of center just foreshorten, as
 * on a packed shelf). The turn comes from the `--ry` custom property (set per book by the shelf), and
 * `--lift` raises it on hover. Purely visual: the caller wraps it in a link
 * that carries the book's name.
 */
export function Spine({
  title,
  author,
  src,
  color,
  look,
  className,
}: {
  title: string;
  author: string;
  /** Base-path-prefixed cover URL. */
  src?: string;
  color?: string;
  look: SpineLook;
  className?: string;
}) {
  const background = color ?? SPINE_FALLBACK;
  const ink = spineInk(background);
  const long = title.length > 26;
  const fontSize =
    Math.min(17, look.width * 0.3) * faceScale[look.face] * (long ? 0.72 : 1);

  const box: CSSProperties = {
    transformStyle: "preserve-3d",
    transform: `rotateY(var(--ry, 0deg)) rotateZ(${look.lean}deg) translateZ(${look.z}px) translateY(var(--lift, 0px))`,
    color: ink,
  };

  return (
    <span
      aria-hidden="true"
      data-book-art=""
      style={box}
      className={cn(
        "pointer-events-none absolute inset-0 origin-bottom transition-transform duration-500 ease-out motion-reduce:transition-none",
        className,
      )}
    >
      {/* Spine */}
      <span
        className="absolute inset-0 overflow-hidden rounded-[2px] shadow-[0_10px_24px_-16px_rgb(0_0_0/0.5)]"
        style={{ backgroundColor: background }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-cover object-left opacity-70"
          />
        ) : null}
        <span
          className="absolute inset-0"
          style={{ backgroundColor: background, opacity: 0.7 }}
        />
        <span
          className="absolute inset-x-[3px] top-[12px] h-px opacity-40"
          style={{ backgroundColor: ink }}
        />
        <span
          className="absolute inset-x-[3px] bottom-[28px] h-px opacity-30"
          style={{ backgroundColor: ink }}
        />
        <span className="absolute inset-x-0 top-[18px] bottom-[34px] flex items-center justify-center overflow-hidden px-[3px]">
          <span
            className={cn(
              "max-h-full text-center leading-[1.05] [text-shadow:0_0.5px_0_rgb(0_0_0/0.3)] [writing-mode:vertical-rl]",
              faceClass[look.face],
            )}
            style={{ fontSize: `${fontSize.toFixed(2)}px` }}
          >
            {title}
          </span>
        </span>
        <span className="absolute inset-x-0 bottom-[10px] flex justify-center opacity-60">
          <span className="max-w-full truncate px-1 font-sans text-[7px] tracking-[0.16em] uppercase">
            {footLabel(author)}
          </span>
        </span>
        <span
          className="absolute inset-0 opacity-60"
          style={{ backgroundImage: weave }}
        />
        <span
          className="absolute inset-0"
          style={{ backgroundImage: rounding }}
        />
        <span className="absolute inset-0 rounded-[2px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08),inset_0_2px_3px_rgb(0_0_0/0.18)]" />
      </span>
      {/* Front cover, seen as the book turns left */}
      <span
        className="absolute top-0 left-full h-full overflow-hidden rounded-r-[2px] [backface-visibility:hidden]"
        style={{
          width: look.depth,
          backgroundColor: background,
          transformOrigin: "left center",
          transform: "rotateY(90deg)",
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="pointer-events-none size-full object-cover"
          />
        ) : null}
        <span className="absolute inset-0 bg-[linear-gradient(90deg,rgb(255_255_255/0.16),rgb(0_0_0/0.34)_70%,rgb(0_0_0/0.5))]" />
      </span>
      {/* Page block along the top edge */}
      <span
        className="absolute bottom-full left-0 w-full [backface-visibility:hidden]"
        style={{
          height: look.depth,
          transformOrigin: "center bottom",
          transform: "rotateX(90deg)",
          backgroundImage:
            "repeating-linear-gradient(90deg, rgb(239 234 224) 0 1px, rgb(221 214 200) 1px 2px)",
        }}
      />
    </span>
  );
}
