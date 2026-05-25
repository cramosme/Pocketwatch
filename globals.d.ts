// Type declarations for static asset imports.
// Metro bundler handles these at runtime, but tsc needs explicit
// declarations to understand the import.

declare module "*.css";

declare module "*.png" {
  const value: number;
  export default value;
}

// Expo inlines process env variables at build time.
// TypeScript needs this declaration to recognize the global.
declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_KEY: string;
    EXPO_PUBLIC_API_URL: string;
  };
};