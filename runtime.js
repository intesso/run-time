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
  opts = setOptions(opts);
  debug('init options', opts);

  try {
    var p = getPaths();
    shell.mkdir('-p', p.runtimePath);

    var upstart = ejs.render(p.upstartTemplate, opts);
    var nginx = ejs.render(p.nginxTemplate, opts);

    fs.writeFileSync(p.upstartRuntimePath, upstart);
    fs.writeFileSync(p.nginxRuntimePath, nginx);

    console.log('Generated upstart configuration:', p.upstartRuntimePath);
    console.log('Generated   nginx configuration:', p.nginxRuntimePath);

    debug('upstart configuration', upstart);
    debug('nginx   configuration', nginx);
  } catch (err) {
    console.error('Generating configuration files FAILED:', err);
  }


};

exports.add = function(opts) {
  opts = setOptions(opts);
  debug('add options', opts);

  try {
    var p = getPaths();
    // add (copy) host config files
    shell.cp(p.upstartTemplatePath, p.upstartDestPath + opts.appName + '.conf');
    shell.cp(p.nginxTemplatePath, p.nginxDestPath + opts.appName + '.conf');

    console.log('Copied upstart configuration from:', p.upstartTemplatePath, 'to:', p.upstartDestPath + opts.appName + '.conf');
    console.log('Copied   nginx configuration from:', p.nginxTemplatePath, 'to:', p.nginxDestPath + opts.appName + '.conf');

    // reload nginx and start the service
    exec('/usr/sbin/nginx', ['-s', 'reload']);
    exec('start', [opts.appName]); // /sbin/start

    console.log('Sucessfully added the new configuration');

  } catch (err) {
    console.error('Adding/Starting the configuration FAILED:', err);
  }

};

exports.remove = function(opts) {
  opts = setOptions(opts);
  debug('remove options', opts);
  var p;

  // stop the app first
  try {
    p = getPaths();
    exec('stop', [opts.appName]); // /sbin/stop
    console.log('Sucessfully stopped:', opts.appName);
  } catch (err) {
    console.error('Stopping', opts.appName, 'FAILED:', err);
  }

  try {
    // remove the config files from the host paths
    shell.rm(p.upstartDestPath + opts.appName + '.conf');
    shell.rm(p.nginxDestPath + opts.appName + '.conf');
    // reload nginx configuration after removing the configuration for the app
    exec('/usr/sbin/nginx', ['-s', 'reload']);
    console.log('Sucessfully removed the configuration files and reloaded nginx.');
  } catch (err) {
    console.error('Reloading nginx FAILED:', err);
  }

};

/*
 * private helper functions
 */
function setOptions(opts) {
  opts = opts || {};
  opts.application = getAbsolutePath(opts.exec);

  return defaults(opts, settings);
}

function getPaths() {

  var pwd = process.cwd();

  var runtimePath = pwd + '/.runtime/';

  var upstartRuntimePath = runtimePath + 'upstart.conf';
  var nginxRuntimePath = runtimePath + 'nginx.conf';

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


