// client/src/index.js
import React from 'react';
// Import createRoot from 'react-dom/client' for React 18+ concurrent mode
import { createRoot } from 'react-dom/client'; 
import './index.css'; // Ensure Tailwind is included
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Get the root element from the HTML
const container = document.getElementById('root');

// Create a root and render your app
// This is the new way to render applications in React 18 for concurrent mode benefits
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
} else {
  // Log an error if the root element is not found, which is essential for debugging
  console.error("Failed to find the root element with ID 'root'. Please ensure it exists in your index.html.");
}
