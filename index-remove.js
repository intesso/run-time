#!/usr/bin/env node

var runtime = require('./runtime');
var program = require('commander');

program
  .option('-n, --app-name [value]', 'web application name');

program
  .parse(process.argv);

var opts = program.opts();
opts.parent = 'cmd';

return runtime.remove(opts);

