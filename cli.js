#!/usr/bin/env node
const argv = require('yargs').argv;
const exec = require('child_process').exec;
const build = require('./build.js');
const ystatic = require('ystatic');
const path = require('path');
const opn = require('opn');

// 默认参数
var defaultArgv = {
    root: process.env.PWD,
    port: '8080'
}
// 用户参数
customerArgv = Object.assign(defaultArgv, argv);

build(customerArgv.root);
ystatic({
    port: customerArgv.port,
    notfound: 'index.html',
    root: path.resolve(customerArgv.root, '.twriter')
});
opn(`http://localhost:${customerArgv.port}`);
