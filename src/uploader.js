'use strict';
const co = require('co');
const thunkify = require('thunkify');
const _ = require('lodash');

/**
 * 进行图片上传主操作
 * @param  {[type]} targetImgDir [description]
 * @param  {[type]} compilation  [description]
 * @return {[type]}              [description]
 */
module.exports = (targetImgDir, compilation) => {
    return co(function * () {
        //TODO 获取文件地址
        //TODO 读取文件内容，之后进行上传操作
    });
};
