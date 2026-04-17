import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/he-thong-thi/', // <--- BẮT BUỘC phải có dòng này để định nghĩa đường dẫn
})