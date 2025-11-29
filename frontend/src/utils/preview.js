// Generates a short description preview from a long body.
// - Strips basic HTML tags
// - Collapses whitespace
// - Trims to a maximum length and appends suffix
export function makeShortDescription(body, maxLen = 220, suffix = ' … Read More >') {
  try {
    const raw = String(body || '');
    // Strip HTML tags (basic)
    const noHtml = raw.replace(/<[^>]*>/g, ' ');
    // Collapse whitespace
    const collapsed = noHtml.replace(/\s+/g, ' ').trim();
    if (!collapsed) return '';

    // Prefer first paragraph/line if short enough
    const firstBreak = collapsed.indexOf('. ');
    const candidate = firstBreak > 0 ? collapsed.slice(0, firstBreak + 1) : collapsed;

    const base = candidate.length <= maxLen ? candidate : collapsed.slice(0, maxLen);
    const trimmed = base.replace(/[\s\.,;:!?-]+$/u, '');
    return trimmed + suffix;
  } catch {
    return '';
  }
}
