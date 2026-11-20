import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { IconContext } from '@phosphor-icons/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IconContext.Provider value={{ size: '1.15em', weight: 'bold' }}>
      <App />
    </IconContext.Provider>
  </StrictMode>,
)
