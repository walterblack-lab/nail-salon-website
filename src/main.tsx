import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles first, so component styles can refine them.
import './styles/tokens.css';
import './styles/base.css';
import { LanguageProvider } from './i18n/LanguageProvider';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
