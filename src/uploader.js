'use strict';
const co = require('co');
const _ = require('lodash');
const tinify = require('tinify');
const stdout = process.stdout;
const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const readline = require('readline');

let dict = {},
    appendDict = {},
    splitCode = "$$$";

function getImgQueue(list, reg) {
    //对应分成三个队列，开启3个线程进行上传
    let queue = [
        [],
        [],
        []
    ];
    let count = 0;
    _.each(list, function (val, key) {
        if (reg.exec(key)) {
            //val RawSource 对象
            queue[count % queue.length].push({
                name: key,
                source: val
            });
            count++;
        }
    });
    return queue;
}

/**
 * 写操作，将压缩后的图片存储在一个固定的位置
 * @param {*} md5 压缩前 md5指纹
 * @param {*} imgBuffer 压缩后的 img buffer
 */
function* writeImg(imgBuffer, md5) {
    let filePath = yield new Promise(function (resolve, reject) {
        //获取md5值
        let filePath = path.resolve(__dirname, '../map', md5);
        fs.writeFile(filePath, imgBuffer, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(filePath);
            }
        });
    });
    return filePath;
}

function deImgQueue(queue, keys) {
    let reTryCount = 3;
    let uploadErrorList = [];
    return co(function* () {
        function* upload(fileInfo, reTryCount) {
            if (reTryCount < 0) {
                //超过尝试次数
                uploadErrorList.push(fileInfo.name);
                return;
            }

            // 添加缓存，防止多次走服务器 md5
            let fileMd5 = md5(fileInfo.source.source());
            try {
                if (dict[fileMd5]) {
                    //找到对应的文件流，加入到fileInfo.source._value中
                    let compressBuffer = yield new Promise(function (resolve, reject) {
                        fs.readFile(dict[fileMd5], function (err, buffer) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(buffer);
                            }
                        })
                    });
                    fileInfo.source._value = compressBuffer;
                    return;
                }
            } catch (e) {
                throw e;
            }

            try {
                let compressImg = yield new Promise((resolve, reject) => {
                    tinify.fromBuffer(fileInfo.source.source()).toBuffer((err, resultData) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(resultData);
                        }
                    })
                });
                //压缩图片成功
                fileInfo.source._value = compressImg;
                // 缓存压缩后的文件
                let filePath = yield writeImg(compressImg, fileMd5);
                appendDict[fileMd5] = filePath;
            } catch (err) {
                if (err instanceof tinify.AccountError) {
                    // Verify your API key and account limit.
                    if (!keys) {
                        //输出文件名 fileInfo.name
                        uploadErrorList.push(fileInfo.name);
                        return;
                    }
                    //tinify key 更换
                    tinify.key = _.first(keys);
                    keys = _.drop(keys);
                    yield upload(fileInfo, reTryCount);
                } else {
                    // Something else went wrong, unrelated to the Tinify API.
                    yield upload(fileInfo, reTryCount - 1);
                }
            }
        }

        for (let fileInfo of queue) {
            yield upload(fileInfo, reTryCount);
        }

        return uploadErrorList;
    });
}

/**
 * 初始化字典对象
 */
function* initDict() {
    let dictPath = path.resolve(__dirname, '../map/dict');
    yield new Promise(function (resolve, reject) {
        let rl = readline.createInterface({
            input: fs.createReadStream(dictPath)
        });
        rl.on('line', function (line) {
            //给dict对象 添加属性与对应的值
            if (line && line.indexOf(splitCode) >= 0) {
                let list = line.split(splitCode);
                dict[list[0]] = list[1];
            }
        });
        rl.on('close', function () {
            resolve(dict);
        })
    });
}

/**
 * 将appendDict内容导入到dict文件中
 */
function* appendDictFile() {
    let dictPath = path.resolve(__dirname, '../map/dict');

    function append(filePath, data) {
        return new Promise(function (resolve, reject) {
            fs.appendFile(filePath, data, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(resolve);
                }
            });
        });
    }
    for (let key in appendDict) {
        yield append(dictPath, key + splitCode + appendDict[key] + '\n');
    }
}

/**
 * 进行图片上传主操作
 * @param  {[type]} compilation     [webpack 构建对象]
 * @param  {[type]} options         [选项]
 * @return {Promise}
 */
module.exports = (compilation, options) => {
    //过滤文件尾缀名称
    let reg = new RegExp("\.(" + options.ext.join('|') + ')$', 'i');
    let keys = options.key;
    if (options.proxy) {
        //这里启用proxy 但是proxy因为建立scoket连接，最后需要有个超时的等待时间来关闭这个scoket
        tinify.proxy = options.proxy;
    }
    return co(function* () {
        //初始化字典
        yield initDict;
        let imgQueue = getImgQueue(compilation.assets, reg);
        tinify.key = _.first(keys);
        keys = _.drop(keys);
        let result = yield Promise.all([
            deImgQueue(imgQueue[0], keys),
            deImgQueue(imgQueue[1], keys),
            deImgQueue(imgQueue[2], keys)
        ]);

        //将appendDict 保存到dict文件中
        yield appendDictFile;
        return result;
    });
};