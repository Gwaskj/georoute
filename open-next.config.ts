import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext configuration for the Cloudflare Workers runtime.
 *
 * Deliberately minimal. The defaults cover this app: no incremental cache is
 * configured because nothing here is statically regenerated -- every page is
 * either fully static at build time or server-rendered per request, since the
 * middleware inspects the Supabase session on each one.
 *
 * If ISR is ever introduced, an incremental cache backed by R2 or a KV
 * namespace has to be declared here or regenerated pages will be rebuilt on
 * every request.
 */
export default defineCloudflareConfig();
