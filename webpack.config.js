
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin'); 
module.exports = {
 entry: './main.js', // Точка входа - main.js
 output: {
  filename: 'bundle.js', // Имя файла сборки - bundle.js
  path: path.resolve(__dirname, 'build'), // Абсолютный путь к директории сборки
 },
 plugins: [
    new CopyWebpackPlugin({
     patterns: [
      { from: 'public', to: '' }, // Скопируем все из папки "public" в корень "build"
     ],
    }),
   ],
 devtool: 'source-map', // Активируем генерацию source-maps
};


