'use strict';

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');



exports.MainClass = class TwitterBOT extends Module {
    init() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    ready() {
        console.log(bot.getModuleInstance('Settings'));
    }
}
