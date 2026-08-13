const TOKEN = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN;

/**
 * Cloudflare Web Analytics — replaces Vercel Speed Insights.
 *
 * Cloudflare already measures traffic at the edge for any request passing
 * through it, with no script at all. This beacon adds what that cannot see
 * from outside the browser: Core Web Vitals, and which page a visit landed on
 * after client-side navigation.
 *
 * Cookieless and collects no personal data or device fingerprint, so unlike
 * Google Analytics it needs no consent handling and works identically for UK
 * visitors — it is exempt from PECR's prior-consent rule because it stores
 * nothing on the device.
 *
 * A plain <script> rather than next/script: it is a single deferred beacon
 * with no ordering requirement, and this renders on the server so it is in the
 * initial HTML rather than injected after hydration.
 *
 * Renders nothing until the token is set, so the site is unaffected before
 * Web Analytics is enabled in the Cloudflare dashboard.
 */
export default function CloudflareWebAnalytics() {
  if (!TOKEN) return null;

  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: TOKEN })}
    />
  );
}
