import React from 'react';
import ReactDOM from 'react-dom/client';
import { SandboxApp } from './sandbox/SandboxApp';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <SandboxApp />
    </React.StrictMode>
  );
}
