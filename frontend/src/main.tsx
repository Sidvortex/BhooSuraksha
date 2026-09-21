import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App.tsx';
import { Login } from './pages/Login.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Explicit :tab param so App's useParams() actually reads it
              from the URL - a bare "/*" wildcard would not populate it. */}
          <Route path="/authority/:tab" element={<App />} />
          <Route path="/authority" element={<App />} />
          <Route path="/citizen/:tab" element={<App />} />
          <Route path="/citizen" element={<App />} />
          <Route path="/citizen" element={<App />} />
          <Route path="/" element={<App />} />
          <Route path="*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
