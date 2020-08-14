const Discord = require('discord.js');

const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');

const ModulePack = require('../../module.js');
const Module = ModulePack.MainClass;
const ModuleStatus = ModulePack.ModuleStatus;



exports.MainClass = class BOT extends Module {
    final() {}

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
        let modNames = Module.getModuleNames();

        modNames.forEach(name => {
            let mod = require('../' + name + '/module.js');

            // モジュール名が既に存在する場合は弾く
            if(name in this.modules)
                return;

            // BOTモジュールの場合はthisを、そうでない場合は新たに生成したインスタンスを使用する
            let instance = name == this.moduleName ? this : new mod.MainClass();

            instance.init()
                .then(() => {
                    instance.moduleStatus = ModuleStatus.Initialized;
                    this.log('Event', 'Create', 'A module instance');
                })
                .catch(() => {
                    this.log('Event', 'Fail', 'Creating a module instance');
                });

            this.modules[name] = instance;
        });

        this.log('Event', 'GetReady', 'All modules')
    }

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
