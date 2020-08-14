const fs = require('fs');

const { Module } = require('../../module.js');



exports.MainClass = class Settings extends Module {
    final() {}

    init() {
        return new Promise((resolve, reject) => {
            if(!this.load()) {
                reject();
                return;
            }

            resolve();
        });
    }

    // 戻り値 ... 成功した場合: true / 失敗した場合: false
    load() {
        let filePath = './modules/Settings/settings.json';

        try {
            fs.statSync(filePath);
        } catch(excep) {
            fs.writeFileSync(filePath, JSON.stringify({}));
            this.log('Event', 'Fail', 'Loading the setting file');

            return false;
        }

        this.data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        this.log('Event', 'Load', 'The setting file');

        return true;
    }
}
