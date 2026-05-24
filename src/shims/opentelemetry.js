// Empty shim — @opentelemetry uses dynamic import() which breaks Hermes in
// release builds. Supabase only uses it optionally for tracing, so it's safe
// to replace with a no-op.
module.exports = {};
