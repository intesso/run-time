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

var runtimePath = __dirname + '/.runtime/';

var upstartRuntimePath = runtimePath + 'upstart.conf';
var nginxRuntimePath = runtimePath + 'nginx.conf';

var upstartTemplatePath = __dirname + '/templates/upstart.conf';
var nginxTemplatePath = __dirname + '/templates/nginx.conf';

var upstartTemplate = fs.readFileSync(upstartTemplatePath, 'utf-8');
var nginxTemplate = fs.readFileSync(nginxTemplatePath, 'utf-8');

var upstartDestPath = '/etc/init/';
var nginxDestPath = '/etc/nginx/conf.d/';


/*
 * api functions
 */

exports.init = function(opts) {
  opts = setOptions(opts);
  debug('init options', opts);

  try{
    shell.mkdir('-p', runtimePath);

    var upstart = ejs.render(upstartTemplate, opts);
    var nginx = ejs.render(nginxTemplate, opts);

    fs.writeFileSync(upstartRuntimePath, upstart);
    fs.writeFileSync(nginxRuntimePath, nginx);

    console.log('Generated upstart configuration:', upstartRuntimePath);
    console.log('Generated   nginx configuration:', nginxRuntimePath);

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
    // add (copy) host config files
    shell.cp(upstartTemplatePath, upstartDestPath + opts.appName + '.conf');
    shell.cp(nginxTemplatePath, nginxDestPath + opts.appName + '.conf');

    console.log('Copied upstart configuration from:', upstartTemplatePath, 'to:', upstartDestPath + opts.appName + '.conf');
    console.log('Copied   nginx configuration from:', nginxTemplatePath, 'to:', nginxDestPath + opts.appName + '.conf');

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

  // stop the app first
  try {
    exec('stop', [opts.appName]); // /sbin/stop
    console.log('Sucessfully stopped:', opts.appName);
  } catch (err) {
    console.error('Stopping', opts.appName, 'FAILED:', err);
  }

  try {
    // remove the config files from the host paths
    shell.rm(upstartDestPath + opts.appName + '.conf');
    shell.rm(nginxDestPath + opts.appName + '.conf');
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


function getAbsolutePath(p) {
  var dir = process.cwd() + '/';
  if (!p) return dir;
  if (pathIsAbsolute(p)) return p;
  return process.cwd() + '/' + p;
}


