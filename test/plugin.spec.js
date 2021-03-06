/**
 * Test that plugin can accept arguments and methods work
 */

import test from 'ava';
import webpack from 'webpack';
import SWPrecacheWebpackPlugin from '../lib';
import path from 'path';
import fs from 'fs';
import sinon from 'sinon';
import UglifyJS from 'uglify-js';
import mkdirp from 'mkdirp';
import bluebirdPromise from 'bluebird';
bluebirdPromise.promisifyAll(fs);
bluebirdPromise.promisifyAll(mkdirp);

const outputPath = path.resolve(__dirname, 'tmp');

const DEFAULT_OPTIONS = {
  cacheId: 'sw-precache-webpack-plugin',
  filename: 'service-worker.js',
  forceDelete: false,
  minify: false,
};

const webpackConfig = () => {

  const config = {
    context: __dirname,
    entry: {
      main: path.resolve(__dirname, 'stubs/entry'),
    },
    output: {
      path: outputPath,
      filename: '[name].js',
    },
  };

  return config;
};

test.before(async t => {
  await mkdirp(outputPath);
});

/** SWPrecacheWebpackPlugin constructor paramaters */

test('will use default options', t => {

  const plugin = new SWPrecacheWebpackPlugin();

  t.deepEqual(plugin.options, DEFAULT_OPTIONS);

});

test('can set cacheId', t => {

  const altConfig = {
    cacheId: 'alt-cache-id',
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });

});

test('can set directoryIndex', t => {

  const altConfig = {
    directoryIndex: 'alt-value',
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});

test('can set dynamicUrlToDependencies', t => {

  const altConfig = {
    dynamicUrlToDependencies: {
      '/pages/home': ['layout.jade', 'home.jade'],
    },
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});

test('can set handleFetch', t => {

  const altConfig = {
    handleFetch: true,
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

test('can set filepath', t => {

  const altConfig = {
    filepath: 'tmp/alt-sw.js',
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});

test('can set minify', t => {

  const altConfig = {
    minify: true,
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});


/** SWPrecacheWebpackPlugin methods */

/**
 * fsExists promise
 * @param {string} fp - filepath to check exists
 * @returns {Promise} fsExists
 */
const fsExists = (fp) => new Promise(
  resolve => fs.access(fp, err => resolve(!err))
);

test.serial('#writeServiceWorker(compiler, config)', async t => {
  t.plan(2);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath});

  plugin.apply(compiler);

  t.falsy(await fsExists(filepath), 'service-worker should not exist yet');
  await plugin.writeServiceWorker(compiler, plugin.options);
  t.truthy(await fsExists(filepath), 'service-worker should exist');

});

test.cb('#apply(compiler)', t => {
  t.plan(2);

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin();

  plugin.apply(compiler);

  compiler.run((err, stats) => {
    t.ifError(err, `compiler error: ${err}`);
    t.is(typeof stats, 'object');
    t.end();
  });

});

test.serial('should keep [hash] in importScripts after writing SW', async t => {
  t.plan(1);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath, importScripts: ['some_sw-[hash].js']});

  plugin.apply(compiler);

  await plugin.writeServiceWorker(compiler, plugin.options);
  t.truthy(plugin.options.importScripts[0] === 'some_sw-[hash].js', 'hash should be preserve after writing the sw');

});

test.serial('should not modify importScripts value when no hash is provided', async t => {
  t.plan(1);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath, importScripts: ['some_script.js']});

  plugin.apply(compiler);

  await plugin.writeServiceWorker(compiler, plugin.options);
  t.truthy(plugin.options.importScripts[0] === 'some_script.js', 'importScripts should not be modified');

});

test.serial('uses UglifyJS to minify code', async t => {
  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler1 = webpack(webpackConfig());
  const withoutMinificationPlugin = new SWPrecacheWebpackPlugin({filepath, minify: false});
  withoutMinificationPlugin.apply(compiler1);
  await withoutMinificationPlugin.writeServiceWorker(compiler1, withoutMinificationPlugin.options);
  const withoutMinificationFileContents = await fs.readFileAsync(filepath);
  // spy on uglify
  const uglifyMock = sinon.mock(UglifyJS);
  const minifyExpectation = uglifyMock.expects('minify');
  minifyExpectation.once();
  minifyExpectation.returns({code: 'minified string', map: null});
  minifyExpectation.withExactArgs({
    'service-worker.js': withoutMinificationFileContents.toString(),
  }, {
    fromString: true,
  });
  const compiler2 = webpack(webpackConfig());
  const withMinificationPlugin = new SWPrecacheWebpackPlugin({filepath, minify: true});
  withMinificationPlugin.apply(compiler2);
  await withMinificationPlugin.writeServiceWorker(compiler2, withMinificationPlugin.options);
  // verify uglify js was called correctly
  minifyExpectation.verify();
  uglifyMock.restore();
  // check if minified code was written correctly
  const withMinificationFileContents = await fs.readFileAsync(filepath);
  t.deepEqual(withMinificationFileContents.toString(), 'minified string');
});
