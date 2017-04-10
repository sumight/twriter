//TODO 在新页面中打开
//TODO 删除保存代码
//TODO 默认只显示 output ✅
//TODO 修改通用例子的样式 ✅
//TODO 默认设置为自动运行js

Vue.component('tw-example-new' ,{
    name: 'tw-example-new',
    template: `
        <div class="tw-example tw-example-new">
            <div class="tw-example__playground">
                <iframe src="./jsbin/index.html?output" class="tw-example__iframe"></iframe>
            </div>
        </div>
    `,
    props: {
        urls: '',
        code: ''
    },
    computed: {
        descDecoded: function() {
            return decodeURI(this.desc);
        }
    },
    mounted: function() {
        this.$iframe = this.$el.querySelector('.tw-example__iframe');
        this.$iframe.contentWindow.addEventListener('load', this.initPlayground);
        this.$iframe.style.height = '500px';
    },
    beforeDestory: function() {
        this.$iframe.contentWindow.removeEventListener('load', function() {
            this.initPlayground();
            clearInterval(this.timeFlat);
        }.bind(this));
    },
    methods: {
        initPlayground: function() {
            var code = decodeURI(this.code);
            code = JSON.parse(code);
            ['html','js','javascript', 'css'].forEach(function(lang) {
                if(/html/.test(lang) && code[lang]) {
                    this.$iframe.contentWindow.jsbin.panels.panels.html.setCode(code[lang])        
                }
                if(/(js|javascript)/.test(lang) && code[lang]) {
                    this.$iframe.contentWindow.jsbin.panels.panels.javascript.setCode(code[lang])        
                }
                if(/css/.test(lang) && code[lang]) {
                    this.$iframe.contentWindow.jsbin.panels.panels.css.setCode(code[lang])        
                }
            }.bind(this))
            // this.$iframe.contentWindow.jsbin.panels.panels.html.setCode(decodeURI(this.code))
            // 设置资源
            var urls = decodeURI(this.urls)
            urls = JSON.parse(urls);
            this.$iframe.contentWindow.jsbin.panels.panels.html.editor.setCursor(4)
            this.$iframe.contentWindow.insertResources(urls);
            this.$iframe.contentWindow.$('#runwithalerts').trigger('click', 'keyboard');
        }
    }
})
