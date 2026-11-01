import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import { requestPersistentStorage } from './db/database'
import { syncWordFiles } from './lib/bundledWords'
import './index.css'

// Hash routing works on any static host without server rewrite rules.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

void requestPersistentStorage()
syncWordFiles().catch((err) => console.error('Could not load word files', err))
