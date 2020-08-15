'use strict';

const fs = require('fs');

const { bot } = require('../../main.js');
const { Module, ModuleStatus } = require('../../module.js');
const { threadId } = require('worker_threads');



exports.MainClass = class Settings extends Module {
    final() {
        this.saveDataFinally();
    }

    getData(modName) {
        return this.data[modName];
    }

    init() {
        return new Promise((resolve, reject) => {
            this.dataFileData = './modules/Settings/settings.json';

            if(!this.load()) {
                reject('Failed to load the setting file.');
                return;
            }

            resolve();
        });
    }

    // 戻り値 ... 成功した場合: true / 失敗した場合: false
    load() {
        try {
            fs.statSync(this.dataFileData);
        } catch(excep) {
            fs.writeFileSync(this.dataFileData, JSON.stringify({}));
            this.log('Error', 'Load', 'The setting file', excep.message);

            return false;
        }

        let source = fs.readFileSync(this.dataFileData, 'utf-8');
        this.data = JSON.parse(source);
        this.log('Event', 'Load', 'The setting file');

        return true;
    }

    ready() {
        let modNames = Module.getModuleNames();

        // 各モジュールの設定データを初期化
        modNames.forEach(name => {
            if(!(name in Object.keys(this.data))) {
                this.data[name] = {};
            }
        });
    }

    // 終了時にファイルを保存します
    saveDataFinally() {
        let source = JSON.stringify(this.data);

        fs.writeFile(this.dataFileData, source, error => {
            if(error) {
                this.log('Error', 'Save', 'The setting file');
            } else {
                this.log('Event', 'Save', 'The setting file');
            }

            this.moduleStatus = ModuleStatus.Finalized;
        });
    }
}
