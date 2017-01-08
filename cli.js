#!/usr/bin/env node
const argv = require('yargs').argv;
const exec = require('child_process').exec;
const build = require('./build.js');
const ystatic = require('ystatic');
const path = require('path');

var pwd = function() {
    return new Promise(function(resolve, reject){
        exec('pwd', function(err, r){
            if(err) {
                reject(err);
            }else {
                resolve(r.replace(/\n/g,''));
            }
        })
    });
}

pwd().then(function(pwd){
    // 默认参数
    var defaultArgv = {
        root: pwd,
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
    exec(`open http://localhost:${customerArgv.port}`);
})
