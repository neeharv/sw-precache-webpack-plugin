/**
 * Make sure this plugin will run and the file is created into build dir
 */

import test from 'ava';
import path from 'path';
import webpack from 'webpack';
import SWPrecacheWebpackPlugin from '../lib';

const DEFAULT_OPTIONS = {
  cacheId: 'sw-precache-webpack-plugin',
  filename: 'service-worker.js',
};

const webpackConfig = () => {

  const config = {
    context: __dirname,
    entry: {
      main: path.resolve(__dirname, 'stubs/entry'),
    },
    output: {
      path: path.resolve(__dirname, '../tmp'),
      filename: '[name].js',
    },
  };

  config.plugins = [
    // ...plugins,
    new SWPrecacheWebpackPlugin(),
    //   {
    //     ...pluginConfig,
    //   }
    // ),
  ];

  return {
    config,
  };
};

const testSWPrecacheWebpackPlugin = ({
  config,
  tests,
}) => {

  const compiler = webpack(config);

  return compiler.run((err, stats) => {
    // if (err) t.fail();
    //
    // if (!stats.length) t.fail();

    return tests(stats);
  });
};


test('will use defualt options', t => {

  const plugin = new SWPrecacheWebpackPlugin();

  t.deepEqual(plugin.options, DEFAULT_OPTIONS);
  //
  // plugin.apply(compiler);
  // console.log(plugin, plugin.apply);

});

test('can set chacheId', t => {

  const altConfig = {
    cacheId: 'alt-cache-id',
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });

});

test('can set filename', t => {

  const altConfig = {
    filename: 'alt-sw.js',
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});
