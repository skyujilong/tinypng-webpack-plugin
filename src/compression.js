'use strict';
var fs = require('fs');
var Promise = require('bluebird');

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

exports.compressImg = function(tinify,fileInfo) {
    return new Promise(function(resolve, reject) {
        tinify.fromBuffer(fileInfo.data).toBuffer(function(err, resultData) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    dir: fileInfo.dir,
                    compressionData: resultData
                });
            }

        });
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
