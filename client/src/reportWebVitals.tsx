//src/reportWebVitals.tsx
import type { ReportCallback } from 'web-vitals';
const reportWebVitals = (onPerfEntry?: ReportCallback) => {
    if (onPerfEntry && typeof onPerfEntry === 'function') {
        import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
            onCLS(onPerfEntry);
            onINP(onPerfEntry);
            onFCP(onPerfEntry);
            onLCP(onPerfEntry);
            onTTFB(onPerfEntry);
        }).catch(error => {
            console.error('Error loading web-vitals:', error);
        });
    }
};
export default reportWebVitals;
