import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { setupStore } from './app/store';
// Fonts are bundled with the app (no request to Google), latin subset only.
import '@fontsource/schibsted-grotesk/latin-400.css';
import '@fontsource/schibsted-grotesk/latin-500.css';
import '@fontsource/schibsted-grotesk/latin-600.css';
import '@fontsource/schibsted-grotesk/latin-700.css';
import '@fontsource/schibsted-grotesk/latin-800.css';
import '@fontsource/doto/latin-800.css';
import './styles/global.css';

const store = setupStore();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
