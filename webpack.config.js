const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const PUBLIC_DIR = path.resolve(__dirname, 'public');

// Иконки сайта и манифест из public/ копируются в сборку как есть.
// index.html там же — это шаблон, его собирает HtmlWebpackPlugin
class CopyPublicFilesPlugin {
  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    compiler.hooks.thisCompilation.tap('CopyPublicFilesPlugin', (compilation) => {
      compilation.contextDependencies.add(PUBLIC_DIR);
      compilation.hooks.processAssets.tap(
        { name: 'CopyPublicFilesPlugin', stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
        () => {
          for (const entry of fs.readdirSync(PUBLIC_DIR, { withFileTypes: true })) {
            if (!entry.isFile() || entry.name === 'index.html') continue;
            const content = fs.readFileSync(path.join(PUBLIC_DIR, entry.name));
            compilation.emitAsset(entry.name, new sources.RawSource(content));
          }
        }
      );
    });
  }
}

module.exports = (env, argv) => {
  const production = argv.mode === 'production';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      // Код разбит на части: основной бандл, React отдельно (vendors), экраны режимов (со своими стилями)
      // и данные колод — ленивые чанки, которые грузятся только когда нужны
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
          // В сборке для сайта CSS — отдельные минифицированные файлы: стили главной и меню грузятся сразу,
          // стили ленивых экранов — вместе с ними. При разработке — встроенные стили, чтобы правки применялись сразу
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
          // Стили, общие для нескольких ленивых экранов (карточка, таблица), — одним файлом.
          // Без этого webpack копирует их в CSS каждого экрана: лишние байты
          sharedStyles: {
            type: 'css/mini-extract',
            chunks: 'async',
            minChunks: 2,
            name: 'shared',
            enforce: true,
          },
        },
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        title: 'ЕГЭ Карточки',
      }),
      new CopyPublicFilesPlugin(),
      ...(production ? [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })] : []),
    ],
    devServer: {
      port: 3000,
      open: true,
      historyApiFallback: true,
    },
  };
};
