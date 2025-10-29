// Token storage key
const TOKEN_KEY = 'fraud_detection_auth_token';

// Get authentication token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Set authentication token in localStorage
export const setToken = (token: string): void => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

// Remove authentication token from localStorage
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Get auth header for API requests
export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Parse JWT token
export const parseJwt = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error('Error parsing JWT token:', e);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = parseJwt(token);
    return decoded.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};
