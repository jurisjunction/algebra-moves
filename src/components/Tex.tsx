import katex from "katex";
import { Fragment, useMemo } from "react";

const TRUSTED = new Set(["\\htmlData", "\\htmlClass"]);

export function renderTex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: "html",
      strict: "ignore",
      trust: (ctx) => TRUSTED.has(ctx.command),
    });
  } catch {
    return latex;
  }
}

export function Tex({ latex, display = false, className }: { latex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => renderTex(latex, display), [latex, display]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Renders a message containing `$inline math$` and `**bold**`. */
export function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("$") && p.endsWith("$") && p.length > 1 ? (
          <Tex key={i} latex={p.slice(1, -1)} />
        ) : p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
