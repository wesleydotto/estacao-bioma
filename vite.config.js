// Configuração do Vite (o programa que roda o servidor de desenvolvimento e monta a versão final)
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  assetsInclude: ['**/*.glb'],      // modelos 3D (.glb) são tratados como arquivos (ex.: o Biólogo em js/modelos/)                       // caminhos relativos: a pasta dist/ funciona em qualquer lugar (ex.: GitHub Pages)
  build: {
    target: 'es2022',               // permite o "await" no topo do main.js (espera a fonte carregar)
    chunkSizeWarningLimit: 1000,    // o Three.js é grande (~600 kB); sem isso o Vite mostra um aviso à toa
  },
});
