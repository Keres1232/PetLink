import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // El proyecto está dentro de OneDrive, que a veces no avisa los cambios de archivos
    // y Vite seguía sirviendo versiones viejas: se revisan los archivos cada cierto tiempo
    watch: { usePolling: true, interval: 300 },
  },
})
