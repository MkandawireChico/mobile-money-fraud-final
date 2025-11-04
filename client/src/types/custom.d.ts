// Declarations for third-party modules without type definitions used in the app.
// These are minimal shims to unblock TypeScript compilation. If you need
// full typings later, replace with proper @types/* packages or handwritten
// declarations.

declare module 'react-date-range' {
  // export any because the app uses the library at runtime and we only need
  // to satisfy the compiler for now.
  const value: any;
  export default value;
}

declare module 'chart.js/auto' {
  const Chart: any;
  export default Chart;
}

declare module 'web-vitals' {
  export function getCLS(onReport: any): void;
  export function getFID(onReport: any): void;
  export function getLCP(onReport: any): void;
  export function getTTFB(onReport: any): void;
  export function getFCP(onReport: any): void;
}

// Generic fallback for any other module paths that might be missing types
declare module '*-adapter-date-fns' {
  const x: any;
  export default x;
}
