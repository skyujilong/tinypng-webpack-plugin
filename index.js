'use strict';
var colors = require('colors');
var path = require('path');
var _ = require('lodash');
var readDir = require('./src/compression.js').readDir;
var readFile = require('./src/compression.js').readFile;
var compressImg = require('./src/compression.js').compressImg;
var emitImg = require('./src/compression.js').emitImg;

const uploader = require('./src/uploader.js');


function TinyPNGPlugin(options) {
    this.options = _.assign({
        key: '',
        ext: ['png', 'jpeg', 'jpg']
    }, options);

    if (!this.options.key) {
        throw new Error('need tinyPNG key');
    }

    if (_.isString(this.options.key)) {
        this.options.key = [this.options.key];
    }

    //正则表达式筛选图片
    this.reg = new RegExp("\.(" + this.options.ext.join('|') + ')$', 'i');
}

TinyPNGPlugin.prototype.apply = function(compiler) {
    var _self = this,
        targetImgDir = this.getImgDir(compiler.options.output.path);
    //TODO 上传文件操作开始
    compiler.plugin('emit',(compilation, cb) => {
        uploader(compilation,).then(() => {
            cb();
        }).catch((e) => {
            console.log(e.stack);
            cb();
        });
        // _.each(compilation.assets,(val,key) => {
        //     console.log(key);
        //     val._value = 'test change source'
        //     //有可能source是一个buffer
        //     console.log(val.source());
        //     //console.log(require('util').inspect(val, { depth: null }));
        // });
        // console.log(require('util').inspect(compilation.assets, { depth: null }));

    });
};





TinyPNGPlugin.prototype.getImgDir = function(outputPath) {
        var imgUrls = [];
        if (_.isString(this.options.relativePath)) {

            imgUrls.push(path.resolve(outputPath, this.options.relativePath));

        } else if (_.isArray(this.options.relativePath)) {

            _.forEach(this.options.relativePath, function(relativePath) {
                imgUrls.push(path.resolve(outputPath, relativePath));
            });

        }
        return imgUrls;
    }
    /**
     * 上传到tinyPNG 官网上面进行文件压缩处理
     * @param  {Array}   targetImgDir 存储图片的绝对路径
     * @param  {Object}   compilation  [description]
     * @param  {Function} callback     [description]
     * @return {[type]}                [description]
     */
TinyPNGPlugin.prototype.upload = function(targetImgDir, compilation, callback) {
    var imgCount = 0,
        allCount = 0,
        _self = this;
    console.log('\n'); //换行
    _.forEach(targetImgDir, function(imgDir) {
        readDir(imgDir).then(function(files) {
            var promiseList = [];
            _.forEach(files, function(file) {
                if (_self.reg.test(file)) {
                    allCount++;
                    imgCount++;
                    promiseList.push(_self.compress(path.join(imgDir, file), function() {
                        imgCount--;
                        console.log(colors.yellow('tinyPNG-webpack-plugin: img compress process is ' + (allCount - imgCount) + '/' + allCount));
                    }).catch(function(e) {
                        //AccountError 用户认证失败
                        imgCount--;
                        console.log(colors.red('tinyPNG-webpack-plugin:' + file + ', compress error'));
                        compilation.errors.push(e);
                    }));
                }
            });
            return Promise.all(promiseList);
        }).then(function() {
            if (imgCount <= 0) {
                callback();
            }
        }).catch(function(e) {
            callback()
            compilation.errors.push(e);
            throw e;
        })
    });
};
TinyPNGPlugin.prototype.compress = function(imgDir, cb) {
    var _self = this;
    return readFile(imgDir).then(function(ImgFileInfo) {
        return compressImg(_self.options.key, ImgFileInfo);
    }).then(function(compressImgInfo) {
        return emitImg(compressImgInfo);
    }).then(function() {
        cb();
    });
};

module.exports = TinyPNGPlugin;
