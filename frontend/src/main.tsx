import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App.tsx';
import { Login } from './pages/Login.tsx';
import { Feedback } from './pages/Feedback.tsx';
import { Contact } from './pages/Contact.tsx';
import { Sitemap } from './pages/Sitemap.tsx';
import { GlobalChrome } from './components/GlobalChrome.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { A11yProvider } from './context/A11yContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <A11yProvider>
          <AuthProvider>
            <Routes>
              <Route element={<GlobalChrome />}>
                <Route path="/login" element={<Login />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/sitemap" element={<Sitemap />} />
                {/* Explicit :tab param so App's useParams() actually reads it
                    from the URL - a bare "/*" wildcard would not populate it. */}
                <Route path="/authority/:tab" element={<App />} />
                <Route path="/authority" element={<App />} />
                <Route path="/citizen/:tab" element={<App />} />
                <Route path="/citizen" element={<App />} />
                <Route path="/" element={<App />} />
                <Route path="*" element={<App />} />
              </Route>
            </Routes>
          </AuthProvider>
        </A11yProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
