// moved from CRA in 2023 because build was broken on new laptop. builds INTO ../public, commit the result!!
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '../public', emptyOutDir: true },
  server: { proxy: { '/login': 'http://localhost:3000', '/products': 'http://localhost:3000', '/products_admin': 'http://localhost:3000', '/product_save': 'http://localhost:3000', '/order': 'http://localhost:3000', '/order_status': 'http://localhost:3000', '/myorders': 'http://localhost:3000', '/report': 'http://localhost:3000', '/export_csv': 'http://localhost:3000' } }
})
