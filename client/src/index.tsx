    // client/src/index.tsx
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import './index.css';
    import App from './App.tsx';
    import { AuthProvider } from './context/AuthContext.tsx';

    const container = document.getElementById('root');

    if (container) {
      const root = createRoot(container);
      root.render(
        // <React.StrictMode>  <-- THIS MUST REMAIN COMMENTED OUT
          <AuthProvider>
            <App />
          </AuthProvider>
        // </React.StrictMode>
      );
    } else {
      console.error("Failed to find the root element with ID 'root'. Please ensure it exists in your index.html.");
    }
    