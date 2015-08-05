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
var pathIsAbsolute = require('path-is-absolute');
var debug = require('debug')('run-time:debug');

/*
 * api functions
 */

exports.init = function(opts) {
  opts = getOptions(opts);
  debug('init options', opts);

  try {
    shell.mkdir('-p', opts.runtimePath);

    var upstart = ejs.render(opts.upstartTemplate, opts);
    var nginx = ejs.render(opts.nginxTemplate, opts);

    fs.writeFileSync(opts.upstartRuntimePath, upstart);
    fs.writeFileSync(opts.nginxRuntimePath, nginx);
    fs.writeFileSync(opts.configurationRuntimePath, JSON.stringify(opts, null, 2));

    console.log('Generated upstart configuration:', opts.upstartRuntimePath);
    console.log('Generated   nginx configuration:', opts.nginxRuntimePath);
    console.log('Stored            configuration:', opts.configurationRuntimePath);

    debug('upstart configuration', upstart);
    debug('nginx   configuration', nginx);
  } catch (err) {
    console.error('Generating configuration files FAILED:', err, err.stack.split('\n'));
  }


};

exports.add = function(opts) {
  opts = getOptions(opts);
  debug('add options', opts);

  try {
    // add (copy) host config files
    shell.cp(opts.upstartRuntimePath, opts.upstartDestPath + opts.appName + '.conf');
    shell.cp(opts.nginxRuntimePath, opts.nginxDestPath + opts.appName + '.conf');

    console.log('Copied upstart configuration from:', opts.upstartRuntimePath, 'to:', opts.upstartDestPath + opts.appName + '.conf');
    console.log('Copied   nginx configuration from:', opts.nginxRuntimePath, 'to:', opts.nginxDestPath + opts.appName + '.conf');

    // reload nginx and start the service
    exec('/usr/sbin/nginx', ['-s', 'reload']);
    exec('start', [opts.appName]); // /sbin/start

    console.log('Sucessfully added the new configuration');

  } catch (err) {
    console.error('Adding/Starting the configuration FAILED:', err, err.stack.split('\n'));
  }

};

exports.remove = function(opts) {
  opts = getOptions(opts);
  debug('remove options', opts);
  var p;

  // stop the app first
  try {
    exec('stop', [opts.appName]); // /sbin/stop
    console.log('Sucessfully stopped:', opts.appName);
  } catch (err) {
    console.error('Stopping', opts.appName, 'FAILED:', err, err.stack.split('\n'));
  }

  try {
    // remove the config files from the host paths
    shell.rm(opts.upstartDestPath + opts.appName + '.conf');
    shell.rm(opts.nginxDestPath + opts.appName + '.conf');
    // reload nginx configuration after removing the configuration for the app
    exec('/usr/sbin/nginx', ['-s', 'reload']);
    console.log('Sucessfully removed the configuration files and reloaded nginx.');
  } catch (err) {
    console.error('Reloading nginx FAILED:', err, err.stack.split('\n'));
  }

};

/*
 * private helper functions
 */
function getOptions(opts) {

  opts = opts || {};
  if(opts.exec) opts.application = getAbsolutePath(opts.exec);


  // merge paths
  opts = defaults(opts, getPaths());

  try {
    var storedConfigJson =  fs.readFileSync(opts.configurationRuntimePath, 'utf-8');
    var storedConfig = JSON.parse(storedConfigJson);
    // merge storedConfig
    opts = defaults(opts, storedConfig);
    debug('Loaded previously stored configuration.json', storedConfig);
  } catch (err) {
    // it's ok, if nothing was stored proviously.
  }

  // merge default settings
  opts.application = opts.application || getAbsolutePath(opts.exec);
  opts.configuration = opts.configuration || "'" + process.argv.join("' '") + "'";
  opts = defaults(opts, settings);
  return opts;

}

function getPaths() {

  var pwd = process.cwd();

  var runtimePath = pwd + '/.runtime/';

  var upstartRuntimePath = runtimePath + 'upstart.conf';
  var nginxRuntimePath = runtimePath + 'nginx.conf';
  var configurationRuntimePath = runtimePath + 'configuration.json';

  var upstartTemplatePath = __dirname + '/templates/upstart.conf';
  var nginxTemplatePath = __dirname + '/templates/nginx.conf';

  var upstartTemplate = fs.readFileSync(upstartTemplatePath, 'utf-8');
  var nginxTemplate = fs.readFileSync(nginxTemplatePath, 'utf-8');

  var upstartDestPath = '/etc/init/';
  var nginxDestPath = '/etc/nginx/conf.d/';

  return {
    runtimePath: runtimePath,

    upstartRuntimePath: upstartRuntimePath,
    nginxRuntimePath: nginxRuntimePath,
    configurationRuntimePath: configurationRuntimePath,

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


