import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PwaUpdateNotice } from './components/pwa/PwaUpdateNotice.tsx';
import './index.css';
import './styles/app.css';

const root = document.getElementById('root');
if (!root) throw new Error('App root element was not found.');

createRoot(root).render(
  <StrictMode>
    <>
      <App />
      <PwaUpdateNotice />
    </>
  </StrictMode>,
);
