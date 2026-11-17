import { formatRichText } from "./format.js";

export const QUICK_POST_LIMIT = 500;
const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });

export function isQuickPost(object: { type: string; metadata: unknown }): boolean {
  return object.type === "article" && !!object.metadata &&
    (object.metadata as Record<string, unknown>).quickPost === true;
}

function decode(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39);/g, (_, name: string) =>
    ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[name]!);
}

function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Tokenize only our own safe formatter's HTML, never arbitrary caller HTML.
// Mapping visible graphemes back to text nodes lets a preview end inside a
// formatted span or link while still closing every tag correctly.
function visibleBody(body: string) {
  const html = formatRichText(body);
  const tokens = (html.match(/<[^>]*>|[^<]+/g) ?? []).map((raw) =>
    raw.startsWith("<") ? { html: raw, text: undefined } : { html: raw, text: decode(raw) });
  const characters: Array<{ value: string; token: number; end: number }> = [];
  let pendingSpace = false;
  tokens.forEach((token, index) => {
    if (token.text === undefined) {
      if (/^<br\b|^<\/(?:p|h[1-6]|li|ul|ol|blockquote|pre)>/i.test(token.html)) pendingSpace = true;
      return;
    }
    for (const part of graphemes.segment(token.text)) {
      if (/^\s+$/u.test(part.segment)) {
        pendingSpace = true;
      } else {
        if (pendingSpace && characters.length) characters.push({ value: " ", token: index, end: part.index });
        characters.push({ value: part.segment, token: index, end: part.index + part.segment.length });
        pendingSpace = false;
      }
    }
  });
  return { html, tokens, characters, text: characters.map((part) => part.value).join("") };
}

export function quickPostPreview(body: string | null | undefined): {
  html: string; text: string; truncated: boolean; characterCount: number;
} {
  const visible = visibleBody(body ?? "");
  const characterCount = visible.characters.length;
  if (characterCount <= QUICK_POST_LIMIT) {
    return { html: visible.html, text: visible.text, truncated: false, characterCount };
  }
  let length = QUICK_POST_LIMIT;
  // Prefer a nearby complete word; a single very long word still gets a
  // bounded preview. Grapheme boundaries keep composed emoji intact.
  if (visible.characters[length].value !== " ") {
    for (let index = length - 1; index >= QUICK_POST_LIMIT * 0.8; index--) {
      if (visible.characters[index].value === " ") { length = index; break; }
    }
  }
  while (visible.characters[length - 1]?.value === " ") length--;
  const last = visible.characters[length - 1];
  const stack: string[] = [];
  let html = "";
  for (let index = 0; index <= last.token; index++) {
    const token = visible.tokens[index];
    if (token.text !== undefined) {
      html += index === last.token ? escape(token.text.slice(0, last.end)) : token.html;
    } else {
      html += token.html;
      const tag = token.html.match(/^<(\/?)([a-z][a-z0-9]*)\b/i);
      if (tag) {
        if (tag[1]) stack.pop();
        else if (!/^(?:img|br|hr)$/i.test(tag[2])) stack.push(tag[2]);
      }
    }
  }
  html += "…" + stack.reverse().map((tag) => `</${tag}>`).join("");
  return { html, text: visible.characters.slice(0, length).map((part) => part.value).join("") + "…", truncated: true, characterCount };
}

export function quickPostTitle(body: string | null | undefined): string {
  const { characters } = visibleBody(body ?? "");
  return characters.slice(0, 80).map((part) => part.value).join("").trim() + (characters.length > 80 ? "…" : "");
}
