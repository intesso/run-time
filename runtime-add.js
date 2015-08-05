#!/usr/bin/env node

var runtime = require('./runtime');
var program = require('commander');

//no program.option

program
  .parse(process.argv);


var opts = program.opts();
opts.parent = 'cmd';

return runtime.add(opts);

