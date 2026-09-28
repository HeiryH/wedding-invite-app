// The friendly half of the slug rules, whose strict half is
// backend/WeddingInvite.Core/Utilities/EventSlug.cs.
//
// The server only folds case and whitespace and REJECTS anything else — it won't quietly rewrite
// a posted URL into something the caller didn't ask for. So turning "Sarah & Mike!" into
// "sarah-mike" is this file's job, done as the admin types, where they can see the result before
// saving. Keep the accepted shape in step with EventSlug.Shape: lowercase alphanumerics with
// single hyphens between them, 3–60 characters.
//
// This is not a validation gate — `CreateAsync`/`SetSlugAsync` re-check on save, which is the
// only check that can be trusted (two admins can type the same URL at once).

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 60;

export function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The same folding, but kept usable *while typing*: a trailing hyphen survives, so "sarah-" can
 * become "sarah-and-mike" instead of having the hyphen eaten on every keystroke.
 */
export function slugifyWhileTyping(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '');
}

/**
 * Returns the reason a slug can't be used, or null when it's fine. Mirrors EventSlug.Validate.
 * Call it on `slugify()` output, not on raw input — mid-typing, "sarah-" has a trailing hyphen
 * the server would reject, and flagging that on every keystroke would be noise.
 */
export function slugProblem(slug: string): string | null {
  if (!slug) return 'A URL is required.';
  if (slug.length < SLUG_MIN_LENGTH) return `A URL needs at least ${SLUG_MIN_LENGTH} characters.`;
  if (slug.length > SLUG_MAX_LENGTH) return `A URL can be at most ${SLUG_MAX_LENGTH} characters.`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
    return 'A URL can only contain letters, numbers and single hyphens between them.';
  return null;
}
