import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PreferencesProvider } from './context/Preferences';
import { ToastProvider } from './components/ui/Toast';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </PreferencesProvider>
  </StrictMode>
);
