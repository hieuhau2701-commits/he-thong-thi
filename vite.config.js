import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/kiemtra/', // Tên này phải trùng với tên Repository bạn sẽ tạo trên GitHub
})