'use strict';

const readline = require('readline');

const stdout = process.stdout;

const colors = require('colors');

const _ = require('lodash');

function clearLine() {
    readline.clearLine(stdout, 0);
    readline.cursorTo(stdout, 0, null);
}

let ide;

module.exports = {
    render: function() {
        stdout.write('/n');
        let count = 0;
        ide = setInterval(() => {
            let symbol;
            if (count % 3 === 0) {
                symbol = '.';
            } else if (count % 3 === 1) {
                symbol = '..';
            } else if (count % 3 === 2) {
                symbol = '...';
            }
            clearLine();
            stdout.write(colors.green('tinyPNG is compressing imgs ' + symbol));
            count++;
        }, 300);
    },
    stop: function() {
        clearInterval(ide);
        clearLine();
        stdout.write(colors.green('tinyPNG compress imgs done ...\n'));
    },
    renderErrorList: function(list){

        let _list = [];
        _.each(list,(val) => {
            _list = _.concat(_list,val);
        });

        if(_list.length === 0){
            return;
        }

        _.each(_list,(name) => {
            console.log(colors.yellow('tinyPNG compress img error: ' + name));
        });
    }
};
