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
        let mod_settings = bot.getModuleInstance('Settings');
        console.log(mod_settings.getData(this.moduleName));
    }
}
