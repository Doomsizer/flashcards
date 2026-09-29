const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const production = argv.mode === 'production';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      // Код разбит на части: основной бандл, React отдельно (vendors), экраны режимов и данные
      // колод — ленивые чанки, которые грузятся только когда нужны
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].js',
      publicPath: 'auto',
      clean: true,
    },
    module: {
      rules: [
        {
          // .mjs — общий с генератором разборщик формата колод (src/deckFormat)
          test: /\.m?jsx?$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          // В сборке для сайта CSS — отдельный минифицированный файл (без комментариев и отступов),
          // при разработке — встроенные стили, чтобы правки применялись сразу
          test: /\.css$/,
          use: [production ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.mjs'],
    },
    optimization: {
      // '...' — стандартная минификация JS, плюс минификация CSS
      minimizer: ['...', new CssMinimizerPlugin()],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // React и прочие зависимости меняются редко — отдельный файл дольше живет в кэше браузера
          defaultVendors: false,
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'initial',
            priority: 10,
          },
        },
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        title: 'ЕГЭ Карточки',
      }),
      ...(production ? [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })] : []),
    ],
    devServer: {
      port: 3000,
      open: true,
      historyApiFallback: true,
    },
  };
};
