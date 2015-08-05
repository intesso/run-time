#!/usr/bin/env node

var version = require('./package.json').version;

// command line execution
if (!module.parent) {
  var program = require('commander');

  program
    .version(version)
    .command('init', 'initialize configuration files for this web application', {isDefault: true})
    .command('add', 'add the new configuration to the host')
    .command('remove', 'remove the configuration from the host');

  program
    .parse(process.argv);

  return;
}

// api
module.exports = require('./runtime');
