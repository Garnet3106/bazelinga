const fs = require('fs');

const Module = require('../../module.js').MainClass;



exports.MainClass = class Settings extends Module {
    final() {}

    init() {
        return new Promise((resolve, reject) => {
            if(!this.load()) {
                reject('Failed to load a setting file');
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
            this.log('Event', 'Created', 'Setting file');

            return false;
        }

        this.data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        this.log('Event', 'Loaded', 'Setting file');

        return true;
    }
}
