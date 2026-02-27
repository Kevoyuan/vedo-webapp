import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    // Build optimizations
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-mantine': ['@mantine/core', '@mantine/hooks'],
        }
      }
    },
    // Source maps for debugging (disable in production for smaller bundles)
    sourcemap: true,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@mantine/core',
      'framer-motion',
    ],
    // Exclude web workers from optimization
    exclude: [],
  },
  // Worker config
  worker: {
    format: 'es',
  },
})
