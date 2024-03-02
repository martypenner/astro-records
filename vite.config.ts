import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

const DEV_PARTYKIT_HOST = '127.0.0.1:1999';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],

  define: {
    'import.meta.env.PARTYKIT_HOST': JSON.stringify(DEV_PARTYKIT_HOST),
  },
});
