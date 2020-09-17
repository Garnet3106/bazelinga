'use strict';

const fs = require('fs');
const { EventEmitter } = require('events');

require('date-utils');



const ModuleStatus = {
    Unknown: 0,
    Loaded: 1,
    Initialized: 2,
    Ready: 3,
    Finalized: 4
};



exports.ModuleStatus = ModuleStatus;

exports.Module = class Module {
    constructor() {
        this.moduleName = this.constructor.name;
        this.moduleStatus = ModuleStatus.Loaded;

        this.events = {};
        this.eventEmitter = new EventEmitter();

        this.prefix = null;

        this.commands = {};
    }

    emitEvent(name, ...args) {
        this.eventEmitter.emit(name, ...args);
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

    getCommandClass(cmdType) {
        return this.commandClasses[cmdType];
    }

    getCommandType(cmdType) {
        return this.commandTypes[cmdType];
    }

    getEnumArray(array) {
        let result = {};

        array.forEach((value, index) => {
            result[value] = index;
        });

        return result;
    }

    static getModuleNames() {
        return fs.readdirSync('./modules/');
    }

    static getCommandPrefix() {
        return this.prefix;
    }

    static getTimeString(date) {
        return date.toFormat('HH24:MM:SS');
    }

    init() {}

    static joinLogItems(items) {
        let result = '|';

        items.forEach((data) => {
            // data[0] → メッセージ / data[1] → 長さ
            result += Module.fillSpaces(data[0], data[1]) + '|';
        });

        return result;
    }

    log(type, action, target, message = '-') {
        let statusName = 'Unknown';

        Object.keys(ModuleStatus).forEach(key => {
            if(ModuleStatus[key] == this.moduleStatus)
                statusName = key;
        });

        let items = [
            [ Module.getTimeString(new Date()), 10 ],
            [ type, 10 ],
            [ this.moduleName, 15 ],
            [ statusName, 15 ],
            [ action, 15 ],
            [ target, 40 ],
            [ message, 50 ],
        ];

        let line = Module.joinLogItems(items);
        console.log(line);
    }

    removePrefix() {
        this.prefix = null;
    }

    setEvent(name, callback) {
        this.eventEmitter.on(name, callback);
    }

    setOnceEvent(name, callback) {
        this.eventEmitter.once(name, callback);
    }

    setCommandPrefix(prefix) {
        if(prefix.match(/^[]/)) {
            this.log('Error', 'Set', 'Prefix', 'Contains invalid character.');
            return;
        }

        this.prefix = prefix;
        this.log('Event', 'Set', 'Prefix', 'Changed to \'' + prefix +'\'');
    }
}
