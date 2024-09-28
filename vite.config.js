import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

export default defineConfig({
  plugins: [
    react(), // React support
    dts({ // Generate .d.ts files for TypeScript types
      insertTypesEntry: true, // Add an entry point for types
    }),
    libInjectCss(),
  ],
  css: {
    modules: {
      scopeBehaviour: 'local', // This is the default, ensures CSS modules are used
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'), // Entry point of your library
      name: 'EzGantt', // UMD global name for browser use
      fileName: format => `ez-gantt.${format}.js`, // Output filenames
      formats: ['es', 'cjs', 'umd'], // Build in multiple formats
    },
    cssCodeSplit: false,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      external: [
        'react',
        'react-dom',
        'react-dom/client',

        // Atlaskit top-level imports
        '@atlaskit/pragmatic-drag-and-drop',
        '@atlaskit/pragmatic-drag-and-drop-auto-scroll',

        // Atlaskit specific submodule imports
        '@atlaskit/pragmatic-drag-and-drop/combine',
        '@atlaskit/pragmatic-drag-and-drop/element/adapter',
        '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview',
        '@atlaskit/pragmatic-drag-and-drop/external/adapter',
        '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled',
        '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source',
        '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview',
        '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element',
        '@atlaskit/pragmatic-drag-and-drop-auto-scroll/external',
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOMClient',

          // Atlaskit globals
          '@atlaskit/pragmatic-drag-and-drop': 'PragmaticDragAndDrop',
          '@atlaskit/pragmatic-drag-and-drop/combine': 'combine',
          '@atlaskit/pragmatic-drag-and-drop/element/adapter': 'adapter',
          '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview': 'disableNativeDragPreview',
          '@atlaskit/pragmatic-drag-and-drop/external/adapter': 'adapter$1',
          '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled': 'preventUnhandled',
          '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source': 'preserveOffsetOnSource',
          '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview': 'setCustomNativeDragPreview',
          '@atlaskit/pragmatic-drag-and-drop-auto-scroll': 'PragmaticDragAndDropAutoScroll',
          '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element': 'element',
          '@atlaskit/pragmatic-drag-and-drop-auto-scroll/external': 'external',
        },
      },
    },
  },
})
