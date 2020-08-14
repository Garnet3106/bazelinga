const ModuleStatus = {
    Unknown: 0,
    Loaded: 1,
    Initialized: 2,
    Ready: 3,
    Finalized: 4
};



exports.ModuleStatus = ModuleStatus;

exports.MainClass = class Module {
    constructor() {
        this.moduleName = this.constructor.name;
        this.moduleStatus = ModuleStatus.Loaded;
    }

    static fillSpaces(text, sumLen) {
        let leftSideLen = Math.ceil((sumLen - text.length) / 2);
        let rightSideLen = sumLen - text.length - leftSideLen;

        if(leftSideLen <= 0 || rightSideLen <= 0) {
            return ' ' + text + ' ';
        } else {
            return ' '.repeat(leftSideLen) + text + ' '.repeat(rightSideLen);
        }
    }

    final() {}

    init() {}

    log(type, action, target = '') {
        let typeWithSpaces = Module.fillSpaces(type, 10);
        let modNameWithSpaces = Module.fillSpaces(this.moduleName, 15);

        let statusName = 'Unknown';

        Object.keys(ModuleStatus).forEach(key => {
            if(ModuleStatus[key] == this.moduleStatus)
                statusName = key;
        });

        let modStatusWithSpaces = Module.fillSpaces(statusName, 15);
        let actionWithSpaces = Module.fillSpaces(action, 15);
        let targetWithSpaces = Module.fillSpaces(target, 20);

        console.log(typeWithSpaces + '|' + modNameWithSpaces + '|' + modStatusWithSpaces + '|' + actionWithSpaces + '|' + targetWithSpaces + '|');
    }
}
