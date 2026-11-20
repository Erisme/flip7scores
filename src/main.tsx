import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/overpass/700.css'
import '@fontsource/overpass/800.css'
import '@fontsource/overpass/900.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './index.css'
import App from './App.tsx'
import { IconContext } from '@phosphor-icons/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IconContext.Provider value={{ size: '1.15em', weight: 'fill' }}>
      <App />
    </IconContext.Provider>
  </StrictMode>,
)
