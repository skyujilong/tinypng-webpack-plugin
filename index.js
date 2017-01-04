'use strict';

var path = require('path');
var _ = require('lodash');
var tinify = require('tinify');
var readDir = require('./src/compression.js').readDir;
var compressImg = require('./src/compression.js').compressImg;
var emitImg = require('./src/compression.js').emitImg;

function TinyPNGPlugin(options) {
    this.options = _.assign({
        key: '',
        relativePath: './',
        ext: ['png', 'gif', 'jpeg', 'jpg']
    }, options);
    //正则表达式筛选图片
    this.reg = new RegExp("\.(" + this.options.ext.join('|') + ')$', 'i');
    tinify.key = this.options.key;
}

TinyPNGPlugin.prototype.apply = function(compiler) {
    var _self = this,
        targetImgDir = this.getImgDir(compiler.outputPath);
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
tinyPNGPlugin.prototype.upload = function(targetImgDir, compilation, callback) {
    var imgCount = 0,
        _self = this;
    _.forEach(targetImgDir, function(imgDir) {
        readDir(imgDir).then(function(files) {
            var promiseList = [];
            _.forEach(files, function(file) {
                if (_self.reg.test(file)) {
                    imgCount++;
                    promiseList.push(_self.compress(file, function() {
                        imgCount--;
                    }));
                }
            });
            return Promise.all(promiseList);
        }, function() {}).then(function() {
            if (imgCount <= 0) {
                callback();
            }
        }, function(err) {
            throw err;
        })
    });
};
TinyPNGPlugin.prototype.compress = function(imgDir, cb) {
    return readDir(imgDir).then(function(ImgFileInfo) {
        return compressImg(ImgFileInfo);
    }, function() {}).then(function(compressImgInfo) {
        return emitImg(compressImgInfo);
    }, function() {}).then(function() {
        cb();
    }, function() {});
};

module.exports = TinyPNGPlugin;
