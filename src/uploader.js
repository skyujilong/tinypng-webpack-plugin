'use strict';
const co = require('co');
const thunkify = require('thunkify');
const _ = require('lodash');


function getImgQueue(list,reg){
    let queue = [];

    _.each(list,function(val,key){
        if(reg.exec(key)){
            //val RawSource 对象
            queue.push(val);
        }
    });

    return queue;
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

    return co(function * () {
        let imgQueue = getImgQueue(compilation.assets,reg);
        //TODO 获取文件地址
        //TODO 读取文件内容，之后进行上传操作
    });
};
