import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/site.css'

document.addEventListener(
  'contextmenu',
  (e) => {
    if (e.target instanceof Element && e.target.closest('img, video, canvas, picture, svg')) {
      e.preventDefault()
    }
  },
  true,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
