const gulp = require('gulp');
// const marked = require('marked');
const marked = require('./lib/marked.js');
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
const fs = require('fs');
const ejs = require("gulp-ejs")
const remember = require('gulp-remember');
const cached = require('gulp-cached');
const crypto = require('crypto');
const browserSync = require('browser-sync');
const rename = require('gulp-rename');
const reload = browserSync.reload;
const filter = require('gulp-filter');

function getProp(obj, path) {
    var paths = path.split('.');
    try {
        for(var key of paths) {
            obj = obj[key]
        }
    }catch(e) {
        return undefined;
    }
    return obj;
}

module.exports = function(customerArgv) {
    var root = customerArgv.root;

    // 如果不存在config.js 文件，则添加配置文件
    if (!fs.existsSync(path.resolve(root, 'config.js'))) {
        gulp.src(path.resolve(__dirname, 'config.js'))
            .pipe(gulp.dest(`${root}`));
        var config = require('./config.js');
    } else {
        // 配置对象
        var config = Object.assign({}, require('./config.js'), require(path.resolve(root, 'config.js')));
    }


    var renderer = new marked.Renderer();

    const codeRender = renderer.code;

    renderer.example = function(code, lang) {
        if(lang === 'vue') {
            code = marked.Lexer.rules.gfm.fences.exec(code)[3];
            var rawCode = code;
            rawCode = encodeURI(rawCode);
            code = codeRender.call(this, code, 'html');
            code = code.replace(/^<pre>/, '<pre v-pre>');
            code = `<tw-example code="${rawCode}">${code}</tw-example>`
            return code;
        }else if(lang === 'common') {
            //todo
            // 完成 通用例子的功能
            var codeObj = {};
            marked(code, {
                renderer: {
                    code: function(code, lang) {
                        codeObj[lang] = code;
                    }
                }
            })
            code = JSON.stringify(codeObj)
            code = encodeURI(code)
            // console.log(codeObj)
            
            var urls = []
                .concat(getProp(config, 'examples.common.js')||[])
                .concat(getProp(config, 'examples.common.css')||[]);
            
            urls = JSON.stringify(urls);
            urls = encodeURI(urls);
            code = `<tw-example-new code="${code}" urls="${urls}">${code}</tw-example-new>`
            return code;
        }else {
            return marked(code);
        }
    }

 renderer.code = function(code, lang) {
        code = codeRender.call(this, code, lang);
        code = code.replace(/^<pre>/, '<pre v-pre>');
        return code;
    }

    // renderer.code = function(code, lang) {
    //     // 加入 vue-example
    //     if (/^:::example-vue/.test(code)) {
    //         var title = code.replace(/^:::example-vue (\S*) (.*)(.|\n)*/, '$1');
    //         var desc = code.replace(/^:::example-vue (\S*) (.*)(.|\n)*/, '$2');
    //         desc = marked(desc);
    //         desc = encodeURI(desc);
    //         code = code.replace(/^:::example-vue(.*)\n/, '');
    //         var rawCode = code;
    //         rawCode = encodeURI(rawCode);
    //         code = codeRender.call(this, code, 'html');
    //         code = code.replace(/^<pre>/, '<pre v-pre>');
    //         code = `<tw-example code="${rawCode}" title="${title}" desc="${desc}">${code}</tw-example>`
    //         return code;
    //     }
    //     if (/^:::example-common/.test(code)) {
    //         // var title = code.replace(/^:::example-common (\S*) (.*)(.|\n)*/, '$1');
    //         // var desc = code.replace(/^:::example-common (\S*) (.*)(.|\n)*/, '$2');
    //         // desc = marked(desc);
    //         // desc = encodeURI(desc);
    //         code = code.replace(/^:::example-common(.*)\n/, '');
    //         var rawCode = code;
    //         rawCode = encodeURI(rawCode);
    //         code = codeRender.call(this, code, 'html');
    //         code = code.replace(/^<pre>/, '<pre v-pre>');
    //         var urls = config.examples.common.js.concat(config.examples.common.css);
    //         urls = JSON.stringify(urls);
    //         urls = encodeURI(urls);
    //         code = `<tw-example-new code="${rawCode}" urls="${urls}">${code}</tw-example-new>`
    //         return code;
    //     }
    //     code = codeRender.call(this, code, lang);
    //     code = code.replace(/^<pre>/, '<pre v-pre>');
    //     return code;
    // }



    marked.setOptions({
        highlight: function(code) {
            code = require('highlight.js').highlightAuto(code).value;
            code = code.replace(/'/g, '\\\'');
            return code;
        },
        renderer: renderer
    });

    var toCamelCase = R.replace(/(-(\w|[\u4e00-\u9fa5]))/g, function($$, $1, $2) {
        return $2.toUpperCase();
    });

    var toVar = function(val) {
        return '_'+crypto.createHash('md5').update(val).digest("hex");
    }

    var toPath = function(a) {
        return '/' + R.replace(/-/g, '/')(a);
    };

    var clearN = R.replace(/\n/g, '\\n');

    var toString = function(buffer) {
        return buffer.toString();
    };

    var toBuffer = function(string) {
        return new Buffer(string);
    }

    var toVueComponent = R.curry(function(name, string) {
        // 为单独的 冒号 加上斜杠 , 操作两次避免 连续两个单引号的问题
        string = string.replace(/([^\\])(')/g, '$1\\$2').replace(/([^\\])(')/g, '$1\\$2');
        return `var ${name} = Vue.extend({template: '<div>${string}</div>'})`;
    });

    // var toTitle = function(name) {
    //     return name.split('-')[name.split('-').length - 1];
    // }

    var toRoute = function(name) {
        return `{ "path": "${toPath(name)}", "component": ${toVar(name)} }`
    };

    // var toMenu = function(name) {
    //     return `{ "title": "${toTitle(name)}", "href": "${toPath(name)}" }`
    // };

    // var sortMenuByTitle = function(menu) {
    //     return menu.sort(function(a, b) {
    //         return toTitle(a.title) > toTitle(b.title);
    //     });
    // }

    var removeIndex = function(title) {
        return title.replace(/^\[\d*\]/, '');
    }

    /**
    [[1,2,3],[1,3,4],[3,4,5]]
    **/
    var parseMenu = function(menu) {
        var r = [];
        menu.forEach(item => {
            var roop = r;
            item.forEach((title, index) => {
                title = removeIndex(title);
                if (roop.some(node => node.title === title)) {
                    roop = roop.filter(node => node.title === title)[0].menu;
                } else {
                    var children = [];
                    roop.push({
                        title: title,
                        menu: children,
                        href: index === item.length - 1 ? `/${item.join('/')}` : 'javascript:;'
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

    // ------------------------------------

    // src 注入资源
    var redirect = R.map(function(item) {
        if (/^http/.test(item) || /^\/\//.test(item)) {
            return item;
        } else {
            return item.replace(/.*\/([^\/]*)$/, './example-resource/$1');
        }
    });

    var outResource = R.concat(config.examples.vue.js, config.examples.vue.css).filter(item => {
        return !(/^http/.test(item) || /^\/\//.test(item));
    }).map(item => {
        return path.resolve(root, item);
    })

    gulp.src(outResource)
        .pipe(gulp.dest(`${root}/.twriter/example-resource`));

    config.examples.vue.js = redirect(config.examples.vue.js);
    config.examples.vue.css = redirect(config.examples.vue.css);

    const f = filter(['**/*.html'], {restore: true});
    gulp.src(path.resolve(__dirname, 'resource/**'))
        .pipe(f)
        .pipe(ejs(config))
        .pipe(f.restore)
        .pipe(gulp.dest(`${root}/.twriter`));

    // 主页面配置
    var coverPath = config.cover?path.resolve(root, config.cover):path.resolve(__dirname, 'resource/_cover.html');
    gulp.src(coverPath)
        .pipe(ejs(config))
        .pipe(rename({
            basename: 'cover',
            extname: '.html'
        }))
        .pipe(gulp.dest(`${root}/.twriter`));

    function transform() {
        // menu
        gulp.src(`${root}/*.md`)
            .pipe(named())
            .pipe(tap(function(file) {
                if (file.contents === null) return;
                file.contents = R.compose(toBuffer, JSON.stringify, R.split('-'))(file.named);
            }))
            .pipe(concat('menu.js', {
                newLine: ','
            }))
            .pipe(header('['))
            .pipe(footer(']'))
            .pipe(tap(function(file) {
                if (file.contents === null) return;
                file.contents = R.compose(toBuffer, JSON.stringify, parseMenu, JSON.parse, toString)(file.contents);
            }))
            .pipe(header('var menu = '))
            .pipe(gulp.dest(`${root}/.twriter`));

        // routes
        gulp.src(`${root}/*.md`)
            .pipe(named())
            .pipe(tap(function(file) {
                if (file.contents === null) return;
                file.contents = R.compose(toBuffer, toRoute)(file.named);
            }))
            .pipe(concat('routes.js', {
                newLine: ','
            }))
            .pipe(header('var routes = ['))
            .pipe(footer('];'))
            .pipe(gulp.dest(`${root}/.twriter`))
            .pipe(reload({
                stream: true
            }))


        // pages
        gulp.src(`${root}/*.md`)
            .pipe(named())
            .pipe(cached('scripts'))
            .pipe(tap(function(file) {
                if (file.contents === null) return;
                file.contents = R.compose(toBuffer, clearN, toVueComponent(toVar(file.named)), marked, toString)(file.contents);
            }))
            .pipe(remember('scripts'))
            .pipe(concat('pages.js'))
            .pipe(gulp.dest(`${root}/.twriter`))
            .pipe(reload({
                stream: true
            }))
    };
    transform();

    var watchTag = watch(`${root}/*.md`, function() {
        transform();
        console.log('build change');
    });

    watchTag.on('change', function(event) {
        if (event.type === 'deleted') { // 如果一个文件被删除了，则将其忘记
            delete cached.caches.scripts[event.path]; // gulp-cached 的删除 api
            remember.forget('scripts', event.path); // gulp-remember 的删除 api
        }
    });

    browserSync({
        server: {
            baseDir: path.resolve(customerArgv.root, '.twriter'),
        },
        port: customerArgv.port
    });
}
