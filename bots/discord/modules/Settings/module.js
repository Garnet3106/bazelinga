'use strict';

const fs = require('fs');

const { bot } = require('../../main.js');
const { Module, ModuleStatus } = require('../../module.js');
const { threadId } = require('worker_threads');



exports.MainClass = class Settings extends Module {
    final() {
        this.saveDataFinally();
    }

    // モジュール名が見つからなければ自動で値を初期化します。
    // モジュールごとの設定データを取得する際にはできるだけこの関数を使用するようにしてください。
    getData(modName) {
        if(!(modName in this.data))
            this.data[modName] = {}

        return this.data[modName];
    }

    init() {
        return new Promise((resolve, reject) => {
            this.setCommandPrefix('set');

            this.dataFileData = './modules/Settings/settings.json';

            this.load()
                .then(() => {
                    resolve();
                })
                .catch(() => {
                    reject('Failed to load the setting file.');
                    return;
                });
        });
    }

    // 戻り値 ... 成功した場合: true / 失敗した場合: false
    load() {
        return new Promise((resolve, reject) => {
            try {
                fs.statSync(this.dataFileData);
            } catch(excep) {
                if(excep.code == 'ENOENT') {
                    // ファイルが見つからない場合は作成してログを出す
                    fs.writeFileSync(this.dataFileData, JSON.stringify({}));
                    this.log('Error', 'Create', 'The setting file');
                } else {
                    // その他のエラーの場合はエラーログを出してrejectする
                    this.log('Error', 'Load', 'The setting file', excep.message);
                    reject();
                }
            }

            let source = fs.readFileSync(this.dataFileData, 'utf-8');
            this.data = JSON.parse(source);
            this.log('Event', 'Load', 'The setting file');

            resolve();
        });
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
