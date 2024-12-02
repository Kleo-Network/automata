import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { visualizer } from 'rollup-plugin-visualizer';
import pkg from './package.json';
import tailwindcss from 'tailwindcss';
import svgr from '@svgr/rollup';
import autoprefixer from 'autoprefixer';
import postcssImport from 'postcss-import';

const production = !process.env.ROLLUP_WATCH;

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Common plugins used in multiple bundles
const commonPlugins = [
  resolve({
    browser: true,
    extensions,
    preferBuiltins: false,
  }),
  commonjs(),
  json(),
  replace({
    'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
    preventAssignment: true,
  }),
  production && terser(),
];

// React Application (Popup or Options Page)
const reactApp = {
  input: 'src/index.tsx', // Entry point for your React app
  output: {
    sourcemap: !production,
    format: 'iife',
    name: 'app',
    file: 'dist/js/app.js',
  },
  plugins: [
    ...commonPlugins,
    typescript({
      tsconfig: './tsconfig.json',
    }),
    babel({
      babelHelpers: 'bundled',
      extensions,
      exclude: 'node_modules/**',
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
    }),
    production &&
      visualizer({
        filename: 'stats-app.html',
        template: 'treemap', // or 'sunburst' for different visualization
      }),
      postcss({
        extract: true,
        minimize: production,
        plugins: [postcssImport(), tailwindcss(), autoprefixer()],
      }),
      svgr(),
    copy({
      targets: [
        { src: 'src/logo/**/*', dest: 'dist/logo/' },
        { src: 'src/assets/**/*', dest: 'dist/assets/' },
        { src: 'public/**/*', dest: 'dist/' },
        {
          src: 'manifest.json',
          dest: 'dist/',
          transform: (contents) => {
            const jsonContent = JSON.parse(contents.toString());
            jsonContent.version = pkg.version;
            return JSON.stringify(jsonContent, null, 2);
          },
        },
      ],
    }),
  ],
};

// Background Scripts
// Background Scripts
const background = {
  input: 'background/index.ts',
  output: {
    sourcemap: !production,
    format: 'es',
    name: 'background',
    file: 'dist/background.js',
    inlineDynamicImports: true, // Add this line
  },
  plugins: [
    ...commonPlugins,
    nodePolyfills(),
    typescript({
      tsconfig: './tsconfig.json',
      include: ['background/**/*.ts'],
    }),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.ts'],
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env', '@babel/preset-typescript'],
    }),
    production &&
      visualizer({
        filename: 'stats-background.html',
        template: 'treemap',
      }),
  ],
};


// Content Script
const contentScript = {
  input: 'content/index.ts',
  output: {
    sourcemap: !production,
    format: 'iife',
    name: 'contentScript',
    file: 'dist/contentScript.js',
  },
  plugins: [
    ...commonPlugins,
    typescript({
      tsconfig: './tsconfig.json',
      include: ['content/**/*.ts'],
    }),
    babel({
      babelHelpers: 'bundled',
      extensions,
      exclude: 'node_modules/**',
      presets: [
        '@babel/preset-env',
        '@babel/preset-react', // Include if your content script uses JSX
        '@babel/preset-typescript',
      ],
    }),
    production &&
      visualizer({
        filename: 'stats-contentScript.html',
        template: 'treemap',
      }),
  ],
};

export default [reactApp, background, contentScript];
