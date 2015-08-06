#!/usr/bin/env node

/*
 * module dependencies
 */

var shell = require('shelljs');
var exec = require('child_process').execFileSync;
var defaults = require('defaults');
var settings = require('./settings');
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var Table = require('cli-table');
var pathIsAbsolute = require('path-is-absolute');
var debug = require('debug')('run-time:debug');

/*
 * api functions
 */

exports.init = function(opts) {
  opts = getOptions(opts, false);
  opts.initConfituration = opts.configuration;
  debug('init options', opts);

  try {
    shell.mkdir('-p', opts.runtimePath);

    var upstart = ejs.render(opts.upstartTemplate, opts);
    var nginx = ejs.render(opts.nginxTemplate, opts);

    fs.writeFileSync(opts.upstartRuntimePath, upstart);
    fs.writeFileSync(opts.nginxRuntimePath, nginx);
    fs.writeFileSync(opts.configurationRuntimePath, JSON.stringify(opts, null, 2));
    fs.writeFileSync(opts.configurationRerunPath, opts.configuration);
    shell.chmod('+x', opts.configurationRerunPath);

    console.log('Generated upstart configuration:', opts.upstartRuntimePath);
    console.log('Generated   nginx configuration:', opts.nginxRuntimePath);
    console.log('Stored            configuration:', opts.configurationRuntimePath);
    console.log('To rerun the      configuration: run `', opts.configurationRerunPath, '`');

    debug('upstart configuration', upstart);
    debug('nginx   configuration', nginx);
  } catch (err) {
    console.error('Generating configuration files FAILED:', err, err.stack.split('\n'));
  }

};

exports.add = function(opts) {
  opts = getOptions(opts, true);
  debug('add options', opts);

  try {
    // add (copy) host config files
    shell.cp('-f', opts.upstartRuntimePath, opts.upstartDestPath + opts.appName + '.conf');
    shell.cp('-f', opts.nginxRuntimePath, opts.nginxDestPath + opts.appName + '.conf');

    console.log('Copied upstart configuration from:', opts.upstartRuntimePath, 'to:', opts.upstartDestPath + opts.appName + '.conf');
    console.log('Copied   nginx configuration from:', opts.nginxRuntimePath, 'to:', opts.nginxDestPath + opts.appName + '.conf');

    // reload nginx and start the service
    console.log('Reloading the nginx configuration...');
    exec('/usr/sbin/nginx', ['-s', 'reload']);
    console.log('Starting the application', opts.appName, '...');
    exec('start', [opts.appName]); // /sbin/start
    console.log('Sucessfully added and started the new configuration:', opts.appName);

    // update list
    var list = readList(opts.listPath);
    list[opts.appName] = opts.initConfituration;
    storeList(opts.listPath, list);
  } catch (err) {
    console.error('Adding/Starting the configuration:', opts.appName, 'FAILED:', err, err.stack.split('\n'));
  }

};

exports.remove = function(opts) {
  opts = getOptions(opts, true);
  debug('remove options', opts);
  var p;

  // stop the app first
  try {
    console.log('Stopping the application', opts.appName, '...');
    exec('stop', [opts.appName]); // /sbin/stop
    console.log('Sucessfully stopped:', opts.appName);
  } catch (err) {
    console.error('Stopping', opts.appName, 'FAILED:', err, err.stack.split('\n'));
  }

  try {
    // remove the config files from the host paths

    var upstartDest = opts.upstartDestPath + opts.appName + '.conf';
    var nginxDest = opts.nginxDestPath + opts.appName + '.conf';
    console.log('Removing', upstartDest, '...');
    shell.rm(upstartDest);
    console.log('Removing', nginxDest, '...');
    shell.rm(nginxDest);
    console.log('Successfully removed the config files');
    // reload nginx configuration after removing the configuration for the app
    console.log('Reloading the nginx configuration...');
    exec('/usr/sbin/nginx', ['-s', 'reload']);
    console.log('Sucessfully reloaded nginx.');

    // update list
    var list = readList(opts.listPath);
    delete list[opts.appName];
    storeList(opts.listPath, list);
  } catch (err) {
    console.error('Reloading nginx FAILED:', err, err.stack.split('\n'));
  }

};

exports.list = function(opts) {
  opts = getOptions(opts, false);

  try {
    var list = readList(opts.listPath);
    printList(list);
  } catch (err) {
    debug('list error', err);
    console.log('nothing to show, sooory!');
  }
};

/*
 * private helper functions
 */
function getOptions(opts, readStored) {

  opts = opts || {};
  if (opts.exec) opts.application = getAbsolutePath(opts.exec);
  opts.configuration = "'" + process.argv.join("' '") + "'";

  // merge paths
  opts = defaults(opts, getPaths());

  // read previously stored configuration
  if (readStored) {
    try {
      var storedConfigJson = fs.readFileSync(opts.configurationRuntimePath, 'utf-8');
      var storedConfig = JSON.parse(storedConfigJson);
      // merge storedConfig
      opts = defaults(opts, storedConfig);
      debug('Loaded previously stored configuration.json', storedConfig);
    } catch (err) {
      // it's ok, if nothing was stored proviously.
    }
  }

  // merge default settings
  opts.application = opts.application || getAbsolutePath(opts.exec);
  opts = defaults(opts, settings);
  return opts;

}

function getPaths() {

  var pwd = process.cwd();

  var runtimePath = pwd + '/.runtime/';

  var upstartRuntimePath = runtimePath + 'upstart.conf';
  var nginxRuntimePath = runtimePath + 'nginx.conf';
  var configurationRuntimePath = runtimePath + 'configuration.json';
  var configurationRerunPath = runtimePath + 'rerun.sh';

  var listPath = __dirname + '/list.json';

  var upstartTemplatePath = __dirname + '/templates/upstart.conf';
  var nginxTemplatePath = __dirname + '/templates/nginx.conf';

  var upstartTemplate = fs.readFileSync(upstartTemplatePath, 'utf-8');
  var nginxTemplate = fs.readFileSync(nginxTemplatePath, 'utf-8');

  var upstartDestPath = '/etc/init/';
  var nginxDestPath = '/etc/nginx/conf.d/';

  return {

    pwd: pwd,

    listPath: listPath,

    runtimePath: runtimePath,

    upstartRuntimePath: upstartRuntimePath,
    nginxRuntimePath: nginxRuntimePath,
    configurationRuntimePath: configurationRuntimePath,
    configurationRerunPath: configurationRerunPath,

    upstartTemplatePath: upstartTemplatePath,
    nginxTemplatePath: nginxTemplatePath,

    upstartTemplate: upstartTemplate,
    nginxTemplate: nginxTemplate,

    upstartDestPath: upstartDestPath,
    nginxDestPath: nginxDestPath
  };

}

function getAbsolutePath(p) {
  var dir = process.cwd() + '/';
  if (!p) return dir;
  if (pathIsAbsolute(p)) return p;
  return process.cwd() + '/' + p;
}

function readList(location) {
  try {
    var listJson = fs.readFileSync(location, 'utf-8');
    return JSON.parse(listJson);
  } catch (err) {
    debug('Reading List failed', location, err);
    return {};
  }
}

function storeList(location, list) {
  try {
    fs.writeFileSync(location, JSON.stringify(list, null, 2));
  } catch (err) {
    debug('Storing List failed', location, err);
  }
}

function printList(list) {
  var Table = require('cli-table');

  // instantiate cli-table
  var table = new Table({
    head: ['app-name', 'configuration']
  });

  // push rows to the table
  Object.keys(list).forEach(function(key) {
    var value = list[key];
    table.push([key, value])
  });

  console.log(table.toString());

}


