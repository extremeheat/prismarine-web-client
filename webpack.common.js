const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const fs = require('fs')
const https = require('https')

// https://webpack.js.org/guides/production/

const config = {
  entry: path.resolve(__dirname, './index.js'),
  output: {
    path: path.resolve(__dirname, './public'),
    filename: './index.js',
    publicPath: './'
  },
  resolve: {
    alias: {
      'minecraft-protocol': path.resolve(
        __dirname,
        'node_modules/minecraft-protocol/src/index.js'
      ), // Hack to allow creating the client in a browser
      express: false,
      net: 'net-browserify',
      fs: false,
      jose: false
    },
    fallback: {
      jose: false,
      zlib: require.resolve('browserify-zlib'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      events: require.resolve('events/'),
      assert: require.resolve('assert/'),
      crypto: require.resolve('crypto-browserify'),
      path: require.resolve('path-browserify'),
      constants: require.resolve('constants-browserify'),
      os: require.resolve('os-browserify/browser'),
      http: require.resolve('http-browserify'),
      https: require.resolve('https-browserify'),
      timers: require.resolve('timers-browserify'),
      // fs: require.resolve("fs-memory/singleton"),
      child_process: false,
      tls: false,
      perf_hooks: path.resolve(__dirname, 'lib/perf_hooks_replacement.js'),
      dns: path.resolve(__dirname, 'lib/dns.js')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      hash: true,
      minify: false
    }),
    // fix "process is not defined" error:
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.NormalModuleReplacementPlugin(
      /prismarine-viewer[/|\\]viewer[/|\\]lib[/|\\]utils/,
      './utils.web.js'
    ),
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: true,
      include: ['index.html', 'manifest.json'] // not caching a lot as anyway this works only online
    }),
    new CopyPlugin({
      patterns: [
        { from: path.join(__dirname, '/styles.css'), to: './styles.css' },
        { from: path.join(__dirname, '/node_modules/prismarine-viewer/public/blocksStates/'), to: './blocksStates/' },
        { from: './node_modules/prismarine-viewer/public/textures/*.png', to: './textures/[name][ext]' },
        { from: './node_modules/prismarine-viewer/public/textures/1.16.4/entity/', to: './textures/1.16.4/entity/' },
        { from: './node_modules/prismarine-viewer/public/textures/1.17.1/gui/*.png', to: './textures/1.17.1/gui/[name][ext]' },
        { from: path.join(__dirname, '/node_modules/prismarine-viewer/public/worker.js'), to: './' },
        { from: path.join(__dirname, '/node_modules/prismarine-viewer/public/supportedVersions.json'), to: './' },
        { from: path.join(__dirname, 'assets/'), to: './' },
        { from: path.join(__dirname, 'extra-textures/'), to: './extra-textures/' },
        { from: path.join(__dirname, 'config.json'), to: './config.json' }
      ]
    })
  ],
  externals: [
    // This removes some large unnecessary data from the bundle
    function (req, cb) {
      if (req.context.includes('minecraft-data') && req.request.endsWith('.json')) {
         const fileName = req.request.split('/').pop().replace('.json', '')
        const blocked = ['blocksB2J', 'blocksJ2B', 'blockMappings', 'steve', 'recipes']
        if (blocked.includes(fileName)) {
          cb(null, [])
          return
        }
      }
      cb()
    }
  ]
}

module.exports = config

// This loads data from the MCWiki if it is not already present
fetchExternalData({
  'https://static.wikia.nocookie.net/minecraft_gamepedia/images/4/44/InvSprite.png': path.resolve(__dirname, 'assets', 'invsprite.png')
})

function fetchExternalData (externals) {
  for (const [url, loc] of Object.entries(externals)) {
    if (fs.existsSync(loc)) return
    // Download the file from url into loc, with https
    const stream = fs.createWriteStream(loc)
    https.get(url, (res) => res.pipe(stream))
  }
}
