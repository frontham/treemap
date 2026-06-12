import { Fragment, type ReactNode } from 'react';

/**
 * Render a translated template containing `{token}` placeholders with JSX
 * substitutions — for sentences that need styled words inside them (e.g.
 * "Drag {blue} to move…" where {blue} is a coloured <span>). Word order stays
 * with the translation; the styling stays with the component.
 */
export function renderTokens(template: string, tokens: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/).map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part);
    if (!m) return part;
    return <Fragment key={i}>{tokens[m[1]!] ?? part}</Fragment>;
  });
}
