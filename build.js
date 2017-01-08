const gulp = require('gulp');
const marked = require('marked');
const tap = require('gulp-tap');
const named = require('vinyl-named');
const R = require('ramda');
const concat = require('gulp-concat');
const header = require('gulp-header');
const footer = require('gulp-footer');
const exec = require('child_process').exec;
const argv = require('yargs').argv;
const path = require('path');
const watch = require('gulp-watch');

var toCamelCase = R.replace(/(-(\w))/g, function($$, $1, $2){
    return $2.toUpperCase();
});

var toPath = function(a){
    return '/'+R.replace(/-/g, '/')(a);
};

var clearN = R.replace(/\n/g, '');

var toString = function(buffer) {
    return buffer.toString();
};

var toBuffer = function(string) {
    return new Buffer(string);
}

var toVueComponent = R.curry(function(name, string) {
    return `var ${name} = Vue.extend({template: '<div>${string}</div>'})`;
});

var toTitle = function(name) {
    return name.split('-')[name.split('-').length-1];
}

var toRoute = function(name) {
    return `{ "path": "${toPath(name)}", "component": ${toCamelCase(name)} }`
};

var toMenu = function(name) {
    return `{ "title": "${toTitle(name)}", "href": "${toPath(name)}" }`
};

var sortMenuByTitle = function(menu) {
    return menu.sort(function(a, b){
        return toTitle(a.title) > toTitle(b.title);
    });
}

/**
[[1,2,3],[1,3,4],[3,4,5]]
**/
var parseMenu = function(menu) {
    var r = [];
    menu.forEach(item=>{
        var roop = r;
        item.forEach((title, index)=>{
            if(roop.some(node=>node.title===title)) {
                roop = roop.filter(node=>node.title=title)[0].menu;
            }else {
                var children = [];
                roop.push({
                    title:title,
                    menu:children,
                    href: index===item.length-1?`/${item.join('/')}`:'javascript:;'
                });
                roop = children;
            }
        })
    })
    return r;
}

var track = function(a) {
    console.log(a);
    return a;
}

module.exports = function(root) {
    // src 注入资源
    gulp.src(path.resolve(__dirname,'resource/**'))
        .pipe(gulp.dest(`${root}/.twriter`));

    function transform() {
        // menu
        gulp.src(`${root}/*.md`)
            .pipe(named())
            .pipe(tap(function(file){
                if (file.contents === null) return;
                file.contents = R.compose(toBuffer, JSON.stringify , R.split('-'))(file.named);
            }))
            .pipe(concat('menu.js', {
                newLine: ','
            }))
            .pipe(header('['))
            .pipe(footer(']'))
            .pipe(tap(function(file){
                if (file.contents === null) return;
                file.contents = R.compose(toBuffer, JSON.stringify, parseMenu, JSON.parse ,toString)(file.contents);
            }))
            .pipe(header('var menu = '))
            .pipe(gulp.dest(`${root}/.twriter`));

        // routes
        gulp.src(`${root}/*.md`)
            .pipe(named())
            .pipe(tap(function(file){
                if (file.contents === null) return;
                file.contents = R.compose(toBuffer, toRoute)(file.named);
            }))
            .pipe(concat('routes.js', {
                newLine: ','
            }))
            .pipe(header('var routes = ['))
            .pipe(footer('];'))
            .pipe(gulp.dest(`${root}/.twriter`));


        // pages
        gulp.src(`${root}/*.md`)
            .pipe(named())
            .pipe(tap(function(file){
                if (file.contents === null) return;
                file.contents = R.compose(toBuffer, clearN, toVueComponent(toCamelCase(file.named)), marked, toString)(file.contents);
            }))
            .pipe(concat('pages.js'))
            .pipe(gulp.dest(`${root}/.twriter`));
    };
    transform();

    console.log('build start');
    watch(`${root}/*.md`, function(){
        transform();
        console.log('build change');
    });
}