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
                    this.log('Event', 'LoggingIn', 'The BOT client');
                    resolve();
                })
                .catch(excep => {
                    this.log('Error', 'LoggingIn', 'The BOT client', excep.message);
                    reject();
                });
        });
    }

    launchBOT() {
        this.loadModules();
    }

    loadModules() {
        this.modules = {};
        let modIndex = 0;
        let modNames = Module.getModuleNames();

        this.log('Event', 'Start', 'Loading all modules');

        // ロードの制限時間を設ける (10秒)
        let timeout = setTimeout(() => {
            this.log('Error', 'NotReady', 'Any modules', 'Initialization process has been timeout.');
        }, 10000);

        let callReadyFuncs = () => {
            // 全モジュールインスタンスのready()を呼び出す
            Object.values(this.modules).forEach(instance => {
                try {
                    instance.ready();
                } catch(e) {
                    instance.log('Error', 'Ready', 'A module source', e.message.split('\n')[0]);
                }
            });

            this.log('Event', 'GetReady', 'All modules');
            // ロードに成功した場合はタイムアウトを解除する
            clearTimeout(timeout);
        }

        // 各モジュールをロード
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
                    instance.log('Error', 'Create', 'A module instance', 'Class name is diffirent from the module name.');
                    return;
                }

                instance.init()
                    .then(() => {
                        instance.moduleStatus = ModuleStatus.Initialized;
                        this.modules[name] = instance;
                        instance.log('Event', 'Create', 'A module instance');

                        // 全モジュールの読み込みが終わった場合はready()を呼び出す
                        // (もともとのモジュール数と、初期化＆追加されているモジュール数を比較する)
                        if(Object.keys(this.modules).length == modNames.length) {
                            callReadyFuncs();
                        }
                    })
                    .catch((message = '') => {
                        instance.log('Error', 'Create', 'A module instance', message);
                    });
            } catch(e) {
                // 例外メッセージは1行目のみを表示
                this.log('Error', 'Load', 'A module source (' + name + ')', e.message.split('\n')[0]);
                return;
            }
        });
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
