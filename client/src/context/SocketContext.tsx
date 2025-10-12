// client/src/context/SocketContext.tsx
import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext.tsx';
import { Anomaly as AnomalyType } from '../types/index.ts'; // Renamed AlertType to AnomalyType

// Define the shape of the Socket Context value
export interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    anomalies: AnomalyType[]; // Renamed from fraudAlerts to anomalies
    clearAnomalies: () => void; // Renamed from clearAlerts
    dismissAnomalyById: (anomalyId: string) => void; // Renamed from dismissAlertById
}

// Create the SocketContext with a default empty value
export const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    anomalies: [], // Renamed from fraudAlerts
    clearAnomalies: () => { /* no-op */ }, // Renamed from clearAlerts
    dismissAnomalyById: () => { /* no-op */ }, // Renamed from dismissAlertById
});

// Define the props for SocketProvider
interface SocketProviderProps {
    children: ReactNode;
}

// SocketProvider component
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const { isAuthenticated, user, isLoading: authLoading } = useContext(AuthContext);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [anomalies, setAnomalies] = useState<AnomalyType[]>([]); // Renamed from fraudAlerts
    const anomaliesRef = useRef<AnomalyType[]>([]); // Renamed from alertsRef
    const socketRef = useRef<Socket | null>(null); // Ref to hold the socket instance

    // Update ref whenever anomalies state changes
    useEffect(() => {
        anomaliesRef.current = anomalies; // Renamed from alertsRef.current = fraudAlerts;
    }, [anomalies]); // Renamed dependency

    // Function to clear anomalies
    const clearAnomalies = useCallback(() => { // Renamed from clearAlerts
        setAnomalies([]); // Renamed state setter
        console.log('[SocketContext] All anomalies cleared.'); // Updated log
    }, []);

    // Function to dismiss a specific anomaly by ID
    const dismissAnomalyById = useCallback((anomalyId: string) => { // Renamed from dismissAlertById
        setAnomalies(prevAnomalies => prevAnomalies.filter(anomaly => anomaly.id !== anomalyId)); // Renamed state setter and variable
        console.log(`[SocketContext] Anomaly with ID ${anomalyId} dismissed.`); // Updated log
    }, []);

    // Effect to manage socket connection based on authentication status
    useEffect(() => {
        // Only proceed if auth state has finished loading
        if (authLoading) {
            console.log('[SocketContext] Auth state still loading, deferring socket connection attempt.');
            return;
        }

        let newSocket: Socket | null = null; // Declare newSocket here to be accessible in cleanup

        if (isAuthenticated) {
            const currentToken = localStorage.getItem('token');
            console.log('[SocketContext] User is authenticated. Attempting to connect socket...');

            if (!currentToken) {
                console.warn('[SocketContext] Authenticated but no token found in localStorage for socket. Disconnecting any existing socket.');
                // Disconnect and clean up if no token
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
                setSocket(null);
                setIsConnected(false);
                setAnomalies([]); // Renamed state setter
                return;
            }

            // Disconnect existing socket if any, before creating a new one
            if (socketRef.current) {
                console.log('[SocketContext] Disconnecting existing socket before new connection.');
                socketRef.current.disconnect();
                socketRef.current = null;
            }

            newSocket = io('http://localhost:5000', { // Use explicit URL
                auth: {
                    token: currentToken,
                },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                randomizationFactor: 0.5,
            });

            socketRef.current = newSocket; // Store new socket in ref
            setSocket(newSocket); // Also update state for re-renders

            // --- Socket Event Listeners ---
            newSocket.on('connect', () => {
                setIsConnected(true);
                console.log('[SocketContext] Socket Connected:', newSocket?.id);
                newSocket?.emit('request_initial_anomalies'); // Changed event name
            });

            newSocket.on('disconnect', (reason) => {
                setIsConnected(false);
                console.log('[SocketContext] Socket Disconnected:', reason);
            });

            newSocket.on('connect_error', (error) => {
                console.error('[SocketContext] Socket Connection Error:', error.message);
                if (error.message.includes('Authentication error') || error.message.includes('Invalid token')) {
                    console.log('[SocketContext] Socket authentication failed. Clearing token and redirecting to login.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            });

            newSocket.on('reconnect_attempt', (attemptNumber) => {
                console.log(`[SocketContext] Reconnect attempt #${attemptNumber}...`);
            });

            newSocket.on('reconnect', (attemptNumber) => {
                console.log(`[SocketContext] Socket Reconnected after ${attemptNumber} attempts.`);
                setIsConnected(true);
                newSocket?.emit('request_initial_anomalies'); // Changed event name
            });

            newSocket.on('reconnect_error', (error) => {
                console.error('[SocketContext] Socket Reconnection Error:', error.message);
            });

            newSocket.on('reconnect_failed', () => {
                console.error('[SocketContext] Socket Reconnection Failed Permanently.');
            });

            newSocket.on('newAnomaly', (anomaly: AnomalyType) => { // Changed event name and variable name
                console.log('[SocketContext] New Anomaly received:', anomaly); // Updated log
                if (!anomaliesRef.current.some(existingAnomaly => existingAnomaly.id === anomaly.id)) { // Renamed ref and variable
                    setAnomalies(prevAnomalies => [...prevAnomalies, anomaly]); // Renamed state setter and variable
                }
            });

            newSocket.on('initial_anomalies', (initialAnomalies: AnomalyType[]) => { // Changed event name and variable name
                console.log('[SocketContext] Received initial anomalies:', initialAnomalies); // Updated log
                const uniqueNewAnomalies = initialAnomalies.filter( // Renamed variable
                    newAnomaly => !anomaliesRef.current.some(existingAnomaly => existingAnomaly.id === newAnomaly.id) // Renamed variables
                );
                if (uniqueNewAnomalies.length > 0) {
                    setAnomalies(prevAnomalies => [...prevAnomalies, ...uniqueNewAnomalies]); // Renamed state setter and variable
                }
            });

            newSocket.on('anomalyUpdated', (updatedAnomaly: AnomalyType) => { // Changed event name and variable name
                console.log('[SocketContext] Anomaly updated:', updatedAnomaly); // Updated log
                setAnomalies(prevAnomalies => // Renamed state setter
                    prevAnomalies.map(anomaly => (anomaly.id === updatedAnomaly.id ? updatedAnomaly : anomaly)) // Renamed variables
                );
            });

            newSocket.on('anomalyDeleted', (anomalyId: string) => { // Changed event name
                console.log('[SocketContext] Anomaly deleted:', anomalyId); // Updated log
                setAnomalies(prevAnomalies => prevAnomalies.filter(anomaly => anomaly.id !== anomalyId)); // Renamed state setter
            });

        } else if (!isAuthenticated) {
            // Disconnect socket if user logs out or is not authenticated
            console.log('[SocketContext] User logged out or not authenticated, disconnecting socket.');
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setSocket(null);
            setIsConnected(false);
            setAnomalies([]); // Renamed state setter // Clear alerts on logout
        }

        // --- Cleanup function for useEffect ---
        return () => {
            console.log('[SocketContext] Running useEffect cleanup...');
            // Use the locally scoped newSocket instance for cleanup
            if (newSocket) {
                console.log('[SocketContext] Disconnecting socket and removing all listeners during cleanup.');
                newSocket.off('connect');
                newSocket.off('disconnect');
                newSocket.off('connect_error');
                newSocket.off('reconnect_attempt');
                newSocket.off('reconnect');
                newSocket.off('reconnect_error');
                newSocket.off('reconnect_failed');
                newSocket.off('newAnomaly'); // Changed event name
                newSocket.off('initial_anomalies'); // Changed event name
                newSocket.off('anomalyUpdated'); // Changed event name
                newSocket.off('anomalyDeleted'); // Changed event name
                // Only disconnect if the socket is actively connected
                if (newSocket.connected) {
                    newSocket.disconnect();
                }
            }
            // Clear state and ref regardless, to ensure a clean slate
            setSocket(null);
            socketRef.current = null;
            setIsConnected(false);
            setAnomalies([]); // Renamed state setter
        };
    }, [isAuthenticated, authLoading, user?.id]); // Re-run effect if auth state or user ID changes

    // The value provided to components consuming this context
    const socketContextValue: SocketContextType = {
        socket,
        isConnected,
        anomalies, // Renamed
        clearAnomalies, // Renamed
        dismissAnomalyById, // Renamed
    };

    return (
        <SocketContext.Provider value={socketContextValue}>
            {children}
        </SocketContext.Provider>
    );
};

// Custom hook to consume the SocketContext easily
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
