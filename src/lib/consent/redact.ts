/**
 * Strip anything sensitive out of a URL before it is recorded.
 *
 * This used to remove the token from /r/<token>, because that token was the
 * whole security of a share link. That route is gone, and what replaced it is
 * worse to leak: /my-round carries the round itself -- every client name,
 * postcode and visit time -- in the fragment.
 *
 * So the rule is now the blunt one. Drop the fragment from every URL, on every
 * page, rather than naming the paths that must not leak. A list of exceptions
 * is only correct until someone adds a route and forgets to update it, which
 * is exactly what happened to the /r/ entry.
 *
 * Which page it was is still worth keeping, so origin, path and query stay.
 */
export function redact(href: string): string {
  const hash = href.indexOf("#");
  return hash === -1 ? href : href.slice(0, hash);
}
