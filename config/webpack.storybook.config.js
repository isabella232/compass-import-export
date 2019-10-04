const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

const baseWebpackConfig = require('./webpack.base.config');
const project = require('./project');

const PLUGINS = [
  // Node externals
  // new webpack.ExternalsPlugin('commonjs', ['fs']),
  new webpack.ProvidePlugin({
    BrowserFS: 'bfsGlobal',
    process: 'processGlobal',
    Buffer: 'bufferGlobal'
  }),
  // Electron externals
  new webpack.ExternalsPlugin('commonjs', [
    'app',
    'auto-updater',
    'browser-window',
    'clipboard',
    'content-tracing',
    'crash-reporter',
    'dialog',
    'electron',
    'global-shortcut',
    'ipc',
    'ipc-main',
    'menu',
    'menu-item',
    'native-image',
    'original-fs',
    'power-monitor',
    'power-save-blocker',
    'protocol',
    'screen',
    'session',
    'shell',
    'tray',
    'web-contents'
  ])
];

if (process.env.NODE_ENV !== 'production') {
  PLUGINS.push.apply(PLUGINS, [
    // Enable HMR globally
    new webpack.HotModuleReplacementPlugin(),

    // Prints more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin()
  ]);
}

PLUGINS.push.apply(PLUGINS, [
  // Do not emit compiled assets that include errors
  new webpack.NoEmitOnErrorsPlugin()
]);

const config = {
  target: 'web',
  // target: 'electron-renderer',
  resolve: {
    alias: {
      fs: 'browserfs/dist/shims/fs.js',
      buffer: 'browserfs/dist/shims/buffer.js',
      path: 'browserfs/dist/shims/path.js',
      processGlobal: 'browserfs/dist/shims/process.js',
      bufferGlobal: 'browserfs/dist/shims/bufferGlobal.js',
      bfsGlobal: require.resolve('browserfs')
    }
  },
  node: {
    process: false,
    Buffer: false
  },
  devtool: 'eval-source-map',
  entry: {
    index: path.resolve(project.path.src, 'index.js')
  },
  output: {
    path: project.path.output,
    filename: '[name].js'
  },
  externals: [nodeExternals()],
  module: {
    noParse: /browserfs\.js/,
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 500000
            }
          }
        ]
      },
      {
        test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 500000
            }
          }
        ]
      }
    ]
  },
  plugins: PLUGINS
};
module.exports = merge.smart(baseWebpackConfig, config);
