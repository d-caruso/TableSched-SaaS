import { RootShell } from '@saas/components/lifecycle/RootShell';

// Re-export core root layout; RootShell is imported here so Metro includes it.
// The shell is rendered as the (saas) group's own layout wrapping all routes.
export { default } from '@core/app/_layout';
export { RootShell };
