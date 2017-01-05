'use strict';
var fs = require('fs');
var Promise = require('bluebird');
var tinify = require('tinify');
var _ = require('lodash');

exports.readDir = function(dir) {
    return new Promise(function(resolve, reject) {
        fs.readdir(dir, function(err, files) {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
};

exports.readFile = function(fileDir) {
    return new Promise(function(resolve, reject) {
        fs.readFile(fileDir, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    dir: fileDir,
                    data: data
                });
            }
        });
    });
};

exports.compressImg = function(key, fileInfo) {
    var __keys = _.clone(key), __serverErrorRetry = 2;
    return new Promise(function(resolve, reject) {
        (function tinifyCompress() {
            tinify.key = __keys[0];
            tinify.fromBuffer(fileInfo.data).toBuffer(function(err, resultData) {
                if (err instanceof tinify.AccountError && __keys.length > 1) {
                    //更换秘钥
                    __keys.splice(0, 1);
                    tinifyCompress();
                } else if (err instanceof tinify.ServerError && __serverErrorRetry -- > 0) {
                    tinifyCompress();
                } else if(err){
                    reject(err);
                } else {
                    resolve({
                        dir: fileInfo.dir,
                        compressionData: resultData
                    });
                }
            });
        })();
    });
};

exports.emitImg = function(compressionImgInfo) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(compressionImgInfo.dir, compressionImgInfo.compressionData, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};
