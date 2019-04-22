const webpack = require('webpack')
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InlineManifestWebpackPlugin = require('inline-manifest-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const optimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const merge = require('webpack-merge')
const port = '52050' // Dev Port

function resolve (dir) {
    return path.join(__dirname, '..', dir)
}

const common = {
    entry: {
        app: './src/index.js'
    },
    resolve: {
        alias: {
          '@': resolve('src'),
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                include: path.resolve(__dirname, '../src'),
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    optimization: {
        runtimeChunk: 'single',
    },
    plugins: [
        new CleanWebpackPlugin(['dist'], {
            root: path.join(__dirname, '..')
        }),
        new HtmlWebpackPlugin({
            template: 'index.html',
            favicon: 'favicon.ico',
            chunksSortMode: 'dependency'
        }),
        new CopyWebpackPlugin([
            {from: 'src/assets', to: 'assets'}
        ])
    ]
}

const development = merge(common, {
    mode: 'development',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, '../dist'),
        pathinfo: false
    },
    devtool: 'cheap-module-eval-source-map',
    devServer: {
        contentBase: './dist',
        historyApiFallback: true,
        hot: true,
        proxy: {
            '/api': {
                target: 'http://localhost:'+ port +'/',
                pathRewrite: {'^/api' : ''},
                changeOrigin: true,
                secure: false,
                headers: {
                    'x-real-ip': '61.190.56.217'
                }
              }
        }
    },
    optimization: {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
    }
})

const production = merge(common, {
    mode: 'production',
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, '../dist')
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            minSize: 0,
            maxAsyncRequests: Infinity,
            maxInitialRequests: Infinity,
            name: true,
            cacheGroups: {
                default: {
                    chunks: 'async',
                    minSize: 30000,
                    minChunks: 2,
                    maxAsyncRequests: 5,
                    maxInitialRequests: 3,
                    priority: -20,
                    reuseExistingChunk: true,
                },
                vendors: {
                    name: 'vendor',
                    enforce: true,
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                },
                commons: {
                    name: 'common',
                    chunks: 'initial',
                    minChunks: 2,
                    test: /[\\/]src[\\/]/,
                    priority: -5,
                    reuseExistingChunk: true
                }
            }
        },
        minimizer: [
            new UglifyJsPlugin({
                exclude: /\.min\.js$/,
                cache: true,
                sourceMap: false,
                extractComments: false,
                uglifyOptions: {
                    parallel: 4,
                    ecma: 8,
                    compress: {
                        toplevel: true,
                        warnings: false,
                    },
                    output: {
                        comments: false
                    }
                }
            }),
            new optimizeCssAssetsPlugin({
                assetNameRegExp: /\.css$/g,
                cssProcessorOptions: {
                    safe: true,
                    autoprefixer: { disable: true },
                    mergeLonghand: false,
                    discardComments: {
                        removeAll: true
                    }
                },
                canPrint: true
            })
        ]
    },
    plugins: [
        new InlineManifestWebpackPlugin('runtime'),
        new webpack.HashedModuleIdsPlugin()
    ]
})

process.env.NODE_ENV === 'production'?module.exports = production:module.exports = development