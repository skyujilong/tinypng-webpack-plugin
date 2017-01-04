'use strict';
var colors = require('colors');
var path = require('path');
var _ = require('lodash');
var tinify = require('tinify');
var readDir = require('./src/compression.js').readDir;
var readFile = require('./src/compression.js').readFile;
var compressImg = require('./src/compression.js').compressImg;
var emitImg = require('./src/compression.js').emitImg;

function TinyPNGPlugin(options) {
    this.options = _.assign({
        key: '',
        relativePath: './',
        ext: ['png', 'jpeg', 'jpg']
    }, options);

    if(!!this.options.key){
        throw new Error('need tinyPNG key');
    }

    //正则表达式筛选图片
    this.reg = new RegExp("\.(" + this.options.ext.join('|') + ')$', 'i');
    tinify.key = this.options.key;
}

TinyPNGPlugin.prototype.apply = function(compiler) {
    var _self = this,
        targetImgDir = this.getImgDir(compiler.options.output.path);
    compiler.plugin('after-emit', function(compilation, callback) {
        _self.upload(targetImgDir, compilation, callback);
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
    console.log('\n');//换行
    _.forEach(targetImgDir, function(imgDir) {
        readDir(imgDir).then(function(files) {
            var promiseList = [];
            _.forEach(files, function(file) {
                if (_self.reg.test(file)) {
                    allCount++;
                    imgCount++;
                    promiseList.push(_self.compress(path.join(imgDir, file), function() {
                        imgCount--;
                        console.log(colors.yellow('tinyPNG-webpack: img compress process is ' + (allCount - imgCount) + '/' + allCount));
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
    return readFile(imgDir).then(function(ImgFileInfo) {
        return compressImg(tinify, ImgFileInfo);
    }).then(function(compressImgInfo) {
        return emitImg(compressImgInfo);
    }).then(function() {
        cb();
    });
};

module.exports = TinyPNGPlugin;
