'use strict';

const Discord = require('discord.js');

const dotenv = require('dotenv');
dotenv.config();

const { Module, ModuleStatus } = require('../../module.js');


exports.MainClass = class BOT extends Module {
    final() {}

    // モジュール名が見つからなければnullを返します
    getModuleInstance(modName) {
        return modName in this.modules ? this.modules[modName] : null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.token = process.env.ELEMBOT_DISCORD_TOKEN;
            this.client = new Discord.Client();

            this.client.login(this.token)
                .then(() => {
                    this.log('Event', 'Succeed', 'Logging in');
                })
                .catch(excep => {
                    // 非同期処理なのでreject()できない
                    this.log('Event', 'Fail', 'Logging in', excep.message);
                });

            resolve();
        });
    }

    launchBOT() {
        this.loadModules();
    }

    loadModules() {
        this.modules = {};
        let modIndex = 0;
        let modNames = Module.getModuleNames();

        modNames.forEach(name => {
            try {
                modIndex++;

                let mod = require('../' + name + '/module.js');

                // モジュール名が既に存在する場合は弾く
                if(name in this.modules)
                    return;

                // BOTモジュールの場合はthisを、そうでない場合は新たに生成したインスタンスを使用する
                let instance = name == this.moduleName ? this : new mod.MainClass();

                // モジュール名(フォルダ名)とクラス名が異なる場合はエラー
                if(name != instance.moduleName) {
                    instance.log('Event', 'Fail', 'Creating a module instance', 'Class name is diffirent from the module name.');
                    return;
                }

                instance.init()
                    .then(() => {
                        instance.moduleStatus = ModuleStatus.Initialized;
                        this.modules[name] = instance;
                        instance.log('Event', 'Create', 'A module instance');
                    })
                    .catch(() => {
                        instance.log('Event', 'Fail', 'Creating a module instance');
                    });
            } catch(e) {
                // 例外メッセージは1行目のみを表示
                this.log('Event', 'Fail', 'Loading a module source (' + name + ')', e.message.split('\n')[0]);
                return;
            }
        });

        let interval = setInterval(() => {
            let ready = false;

            Object.values(this.modules).forEach(instance => {
                if(instance.moduleStatus != ModuleStatus.Loaded) {
                    ready = true;
                }
            });

            if(ready) {
                // 全モジュールインスタンスのready()を呼び出す
                Object.values(this.modules).forEach(instance => {
                    instance.ready();
                });

                this.log('Event', 'GetReady', 'All modules');
                clearInterval(interval);
            }
        }, 200);
    }

    ready() {}

    terminateBOT() {
        this.unloadModules();
    }

    unloadModules() {
        if(this.modules == undefined)
            return;

        Object.keys(this.modules).forEach(key => {
            let instance = this.modules[key];
            instance.final();
            instance.log('Event', 'Finalize', 'A module instance');
        });
    }
}
