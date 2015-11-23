#!/usr/bin/env node

var VERSION = '0.1.0';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var find = require('find');

var optimist = require('optimist')
  .usage('Precompile underscore templates into joined amd files.\nUsage: $0 [directory...] target', {
    prefix: {
      type: 'string',
      description: 'Prefix for module names',
      alias: 'p'
    },
    store: {
      type: 'string',
      description: 'Store template functions in a global namespace object',
      alias: 'g'
    },
    require: {
      type: 'string', // actually array
      description: 'Require module(s)',
      alias: 'r'
    },

    version: {
      type: 'boolean',
      description: 'Prints the current versions of this package and underscore',
      alias: 'v'
    },

    help: {
      type: 'boolean',
      description: 'Outputs this message',
      alias: 'h'
    }
  })

  .wrap(120)
  .check(function(argv) {
    if (argv.version) {
      console.error(
         'PreScore version: ' + VERSION +
      '\nUnderscore version: ' + _.VERSION +
      '\nNode version: ' + process.version);
      process.exit(0);
    }
    if (argv.help) {
      optimist.showHelp();
      process.exit(0);
    }
  });

var argv = optimist.argv;
argv.output = argv._.pop();
if (argv.require) {
  if (typeof argv.require === 'string') argv.require = [argv.require];
} else argv.require = [];

var templates = [];
var stat, sourcePath;

function compile(sourcePath, basePath) {
  console.log('< ' + sourcePath);
  var pathInfo = path.parse(sourcePath);
  var name = pathInfo.name;
  if (basePath && pathInfo.dir.length > basePath.length)
    name = pathInfo.dir.substr(basePath.length) + '/' + name;
  if (argv.prefix) name = argv.prefix + name;
  console.log('> ' + name);
  var template = _.template(fs.readFileSync(sourcePath, {encoding: 'utf-8'}));
  templates.push({
    path: sourcePath,
    source: template.source,
    name: name
  });
}

for (var inputPath of argv._) {
  stat = fs.lstatSync(inputPath);
  if (stat.isDirectory()) {
    for (sourcePath of find.fileSync(/\.html$/, inputPath)) compile(sourcePath, inputPath);
  } else if (stat.isFile()) compile(inputPath);
  else {
    console.error('Invalid inputPath ' + inputPath);
    process.exit(1);
  }
}

var out = fs.openSync(argv.output, 'w+');
var requires = _.map(argv.require, function(req) {return "'" + req + "'"}).join(', ');
var requireArgs = _.map(argv.require, function(req) {return req.replace(/\W/g, '__')}).join(', ');
var storeSteps = [];
var storePath = '';
if (argv.store) {
  for (var step of argv.store.split('.')) {
    if (storePath.length) {
      storePath += '.' + step;
      storeSteps.push(storePath);
    } else storePath = step;
  }
}

for (var template of templates) {
  fs.writeSync(out,
    "define('" + template.name + "', [" + requires + "], function(" + requireArgs + ") {\n  var __template = " + template.source + ";\n");
  if (argv.store) {
    for (var step of storeSteps) {
      fs.writeSync(out,
      "  " + step + " = " + step + " || {};\n");
    }
    fs.writeSync(out,
    "  " + argv.store + "['" + template.name + "'] = __template;\n");
  }
  fs.writeSync(out, "  return __template;\n});\n\n")
}
fs.closeSync(out);
