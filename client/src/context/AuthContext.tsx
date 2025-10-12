//src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import api from '../api/axios.ts';
import { User } from '../types/index.ts';

export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    login: async () => { },
    logout: () => { },
    checkAuth: () => { },
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const checkAuth = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                const userData: User = JSON.parse(storedUser);
                if (userData && userData.id && userData.role) {
                    setIsAuthenticated(true);
                    setUser(userData);
                    console.log('[AuthContext] Auth check: User data hydrated from localStorage for user:', userData.username);
                } else {
                    console.warn('[AuthContext] Auth check: Invalid user data in localStorage. Clearing data.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (error) {
                console.error('[AuthContext] Failed to parse user from localStorage. Clearing:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                setUser(null);
            }
        } else {
            setIsAuthenticated(false);
            setUser(null);
            console.log('[AuthContext] Auth check: No user/token found in localStorage. User is not authenticated.');
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            console.log("[AuthContext] /auth/login response.data:", response.data);
            const { token: receivedToken, user: userData } = response.data;

            localStorage.setItem('token', receivedToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setIsAuthenticated(true);
            setUser(userData);
            console.log('[AuthContext] Login successful. User:', userData.username);
        } catch (err: any) {
            console.error('Login failed:', err.response?.data?.message || err.message);
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            throw err; // Re-throw the error for the component to handle
        } finally {
            setIsLoading(false);
        }
    };

    const logout = useCallback(() => {
        console.log('[AuthContext] Logging out. Clearing localStorage.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const authContextValue: AuthContextType = {
        isAuthenticated,
        user,
        isLoading,
        login,
        logout,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};