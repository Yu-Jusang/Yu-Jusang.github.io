import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({base:'./',plugins:[react()],publicDir:false,build:{outDir:'../gonggang',emptyOutDir:false}});
