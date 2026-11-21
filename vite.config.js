import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build works on GitHub Pages under /mehalshivani/
export default defineConfig({ plugins: [react()], base: './' })
