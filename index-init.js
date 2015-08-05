#!/usr/bin/env node

var runtime = require('./runtime');
var defaultOptions = require('./settings');
var program = require('commander');
var minimist = require('minimist');
var merge = require('utils-merge');

function toOption(option, options){
  option = option.replace(/\[/, '');
  option = option.replace(/\]/, '');
  option = option.replace(/^\s+/, '');
  option = option.replace(/\s+$/, '');

  option = option.split(' ');
  var opts = minimist(option);
  merge(options, opts);

  return options;
}

function toInt(number, def) {
 if (!number) {
   return def;
 } else {
   return parseInt(number);
 }
}

function toEnv(env, environment) {
  var keyVal = env.split('=');
  if (keyVal.length === 2) {
    environment[keyVal[0]]  = keyVal[1];
  }
  return environment;
}

program
  .option('-c, --command [value]', 'command', defaultOptions.command)
  .option('-x, --exec [value]', 'file to execute')
  .option('-o, --command-options [value]', 'command options', toOption, {})
  .option('-e, --environment-variables [value]', 'set environment variable', toEnv, {})
  .option('-l, --host-name [value]', 'host (webserver) name', 'localhost')
  .option('-h, --host-port <n>', 'host (webserver) port', toInt, defaultOptions.hostPort)
  .option('-p, --app-port <n>', 'internal web application port', toInt, defaultOptions.appPort)
  .option('-n, --app-name [value]', 'web application name')
  .option('-d, --domain-name [value]', 'domain name')
  .option('-s, --ssl [value]', 'Enable https');

program
  .parse(process.argv);

var opts = program.opts();
opts.parent = 'cmd';

return runtime.init(opts);
