const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { componentTagger } = require('lovable-tagger');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/main.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      chunkFilename: isProduction ? 'assets/[name].[contenthash].chunk.js' : 'assets/[name].chunk.js',
      clean: true,
      publicPath: '/',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                  decorators: false,
                  dynamicImport: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: isDevelopment,
                    refresh: isDevelopment,
                  },
                },
                target: 'es2020',
                loose: false,
                externalHelpers: false,
              },
              module: {
                type: 'es6',
              },
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  auto: (resourcePath) => resourcePath.includes('.module.'),
                  localIdentName: isDevelopment
                    ? '[path][name]__[local]--[hash:base64:5]'
                    : '[hash:base64:8]',
                },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: path.resolve(__dirname, 'postcss.config.cjs'),
                },
              },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb
            },
          },
          generator: {
            filename: 'assets/images/[name].[hash][ext]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[hash][ext]',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: true,
        minify: isProduction
          ? {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            }
          : false,
      }),
      // lovable-tagger plugin (Vite-specific, disabled for Webpack)
      // Uncomment and adapt if needed: ...(isDevelopment ? [componentTagger()] : []),
    ].filter(Boolean),
    devServer: {
      host: '::',
      port: 8080,
      hot: true,
      open: false,
      historyApiFallback: true,
      compress: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    optimization: {
      minimize: isProduction,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};
