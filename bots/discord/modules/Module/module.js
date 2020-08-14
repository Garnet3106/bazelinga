const fs = require('fs');
const EventEmitter = require('events');



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

        this.events = new EventEmitter();

        this.initCompleteEvent = 'initComplete';
        this.events.on(this.initCompleteEvent, event => {
            this.moduleStatus = ModuleStatus.Initialized;
            this.log('Event', 'Initialized');
        });

        this.finalCompleteEvent = 'finalComplete';
        this.events.on(this.initCompleteEvent, event => {
            this.moduleStatus = ModuleStatus.Finalized;
            this.log('Event', 'Finalized');
        });

        this.init();
    }

    fillSpaces(text, sumLen) {
        let leftSideLen = Math.ceil((sumLen - text.length) / 2);
        let rightSideLen = sumLen - text.length - leftSideLen;

        if(leftSideLen <= 0 || rightSideLen <= 0) {
            return ' ' + text + ' ';
        } else {
            return ' '.repeat(leftSideLen) + text + ' '.repeat(rightSideLen);
        }
    }

    final() {
        this.events.emit(this.finalCompleteEvent);
    }

    static getModuleNames() {
        return fs.readdirSync('./modules/');
    }

    init() {
        this.events.emit(this.initCompleteEvent);
    }

    launchBOT() {
        this.loadModules();
    }

    loadModules() {
        this.modules = {};
        let modNames = Module.getModuleNames();

        modNames.forEach(name => {
            let mod = require('../' + name + '/module.js');

            if(name == this.moduleName)
                return;

            let obj = new mod.MainClass();
            this.modules[name] = obj;
        });

        this.log('Event', 'Loaded', 'All modules')
        this.unloadModules();
    }

    log(type, action, target = '') {
        let typeWithSpaces = this.fillSpaces(type, 10);
        let modNameWithSpaces = this.fillSpaces(this.moduleName, 15);

        let statusName = 'Unknown';

        Object.keys(ModuleStatus).forEach(key => {
            if(ModuleStatus[key] == this.moduleStatus)
                statusName = key;
        });

        let modStatusWithSpaces = this.fillSpaces(statusName, 15);
        let actionWithSpaces = this.fillSpaces(action, 15);
        let targetWithSpaces = this.fillSpaces(target, 20);

        console.log(typeWithSpaces + '|' + modNameWithSpaces + '|' + modStatusWithSpaces + '|' + actionWithSpaces + '|' + targetWithSpaces + '|');
    }

    unloadModules() {
        if(this.modules == undefined)
            return;

        Object.keys(this.modules).forEach(key => {
            let obj = this.modules[key];
            obj.final();
            obj.log('Event', 'Finalized');
        });
    }
}
