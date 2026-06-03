// SPIKE: dynamic merged route context for Expo Router.
//
// Expo Router builds its route table from a single `require.context` over
// EXPO_ROUTER_APP_ROOT (see expo-router/_ctx.web.js). This file replaces that
// single context with the *union* of two contexts — SaaS's own `app/` and
// core's `app/` — so every core route is exposed by SaaS without per-route
// shadow files. SaaS files override core on identical paths; BLACKLIST opts
// routes out. metro.config.cjs resolves `expo-router/_ctx` to this file.

// Metro requires the require.context regex to be an inline literal (not a
// variable), so the matcher below is duplicated in both calls. It is copied
// verbatim from expo-router/_ctx.web.js (web route matcher: excludes +api and
// +html/+native-intent root files).
const saasCtx = require.context(
  './app',
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+(html|native-intent))))\.[tj]sx?$).*(?:\.android|\.ios|\.native)?\.[tj]sx?$/,
);
// Path is a static literal so Metro can statically resolve it; coreRoot is in
// metro.config watchFolders so the files are bundled and watched.
const coreCtx = require.context(
  '../../TableSched/frontend/app',
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+(html|native-intent))))\.[tj]sx?$).*(?:\.android|\.ios|\.native)?\.[tj]sx?$/,
);

// Routes to skip from core (matched against keys like './(public)/...').
const BLACKLIST = [];

function isBlacklisted(key) {
  return BLACKLIST.some((re) => re.test(key));
}

const saasKeySet = new Set(saasCtx.keys());

function mergedKeys() {
  const keys = new Set();
  for (const k of coreCtx.keys()) {
    if (!isBlacklisted(k)) keys.add(k);
  }
  for (const k of saasCtx.keys()) keys.add(k); // SaaS wins on collisions
  return [...keys];
}

function ctx(id) {
  return saasKeySet.has(id) ? saasCtx(id) : coreCtx(id);
}
ctx.keys = mergedKeys;
ctx.resolve = (id) => (saasKeySet.has(id) ? saasCtx.resolve(id) : coreCtx.resolve(id));
ctx.id = saasCtx.id;

export { ctx };
