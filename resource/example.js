Vue.component('tw-example' ,{
    name: 'tw-example',
    template: `
        <div class="tw-example">
            <div class="tw-example__playground">
                <iframe src="./example-iframe.html" class="tw-example__iframe"></iframe>
            </div>
            <div class="tw-example__title">{{title}}</div>
            <div class="tw-example__desc" v-html="descDecoded"></div>
            <div class="tw-example__code">
                <slot></slot>
            </div>
        </div>
    `,
    props: {
        code: '',
        title: '',
        desc: ''
    },
    computed: {
        descDecoded: function() {
            return decodeURI(this.desc);
        }
    },
    mounted: function() {
        this.$iframe = this.$el.querySelector('.tw-example__iframe');
        this.$iframe.contentWindow.addEventListener('load', this.initPlayground);
    },
    beforeDestory: function() {
        this.$iframe.contentWindow.removeEventListener('load', function() {
            this.initPlayground();
            clearInterval(this.timeFlat);
        }.bind(this));
    },
    methods: {
        initPlayground: function() {
            this.$iframe.contentWindow.init(decodeURI(this.code));
            this.resizeIframe();
            this.timeFlat = setInterval(function(){
                this.resizeIframe();
            }.bind(this),200);
        },
        resizeIframe: function() {
            var $html = this.$iframe.contentWindow.document.body.parentElement;
            this.$iframe.style.height = $html.offsetHeight+'px';
        }
    }
})
