// Type declarations for static asset imports.
// Metro bundler handles these at runtime, but tsc needs explicit
// declarations to understand the import.

declare module "*.png" {
  const value: number;
  export default value;
}