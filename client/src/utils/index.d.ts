// Type definitions for auth utilities
declare module './auth' {
  export function getToken(): string | null;
  export function setToken(token: string): void;
  export function clearToken(): void;
  export function isAuthenticated(): boolean;
  export function getAuthHeader(): { Authorization: string } | {};
  export function parseJwt(token: string): any;
  export function isTokenExpired(token: string): boolean;
}
