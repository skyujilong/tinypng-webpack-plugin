'use strict';

const _ = require('lodash');
const uploader = require('./src/uploader.js');
const stdout = require('./src/stdout.js');

class TinyPNGPlugin {
    constructor(options){
        debugger;
        this.pluginName = 'tinypng-webpack-plugin';
        this.options = _.assign({
            key: '',
            ext: ['png', 'jpeg', 'jpg'],
            proxy:''
        }, options);

        if (!this.options.key) {
            throw new Error('need tinyPNG key');
        }

        if (_.isString(this.options.key)) {
            this.options.key = [this.options.key];
        }

        if(_.isString(this.options.proxy) && this.options.proxy !== ''){
            if(this.options.proxy.indexOf('http://') === -1){
                throw new Error('the proxy must be HTTP proxy!')
            }
        }

        //正则表达式筛选图片
        this.reg = new RegExp("\.(" + this.options.ext.join('|') + ')$', 'i');
    }
    apply(compiler){
        compiler.hooks.emit.tapPromise(this.pluginName,(compilation)=>{
            stdout.render();
            return uploader(compilation, this.options).then((failList) => {
                stdout.stop();
                stdout.renderErrorList(failList);
            }).catch((e) => {
                stdout.stop();
                compiler.errors.push(e);
            });
        });
    }
}


module.exports = TinyPNGPlugin;
