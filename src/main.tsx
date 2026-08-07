import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const savedTheme = localStorage.getItem('epdc-theme')
document.documentElement.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light')

createRoot(document.getElementById('root')!).render(<App />)
