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

        this.commandFunctions = {};
        this.commandTypes = {};

        this.commands = {};
    }

    addCommand(name, type, func) {
        this.commandFunctions[type] = func;
        this.commandTypes[name] = type;
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

    getCommandFunction(cmdType) {
        return this.commandFunctions[cmdType];
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

    proceedCommand(modInstance, message, cmdPrefix, cmdName, cmdArgs, disableLoop = false) {
        let cmdType = this.getCommandType(cmdName);
        let cmdFunc = this.getCommandFunction(cmdType);

        if(!disableLoop && typeof(cmdFunc) !== 'function') {
            this.proceedCommand(message, cmdPrefix, 'help', cmdArgs, true);
            return;
        }

        cmdFunc(modInstance, message, cmdPrefix, cmdName, cmdArgs);
    }

    ready() {}

    removePrefix() {
        this.prefix = null;
    }

    // モジュール読み込み完了後に呼び出します
    setCommandEvent(modInstance, mod_commands) {
        mod_commands.setEvent(this.mod_commands.events.receiveCommand, (message, cmdPrefix, cmdName, cmdArgs) => {
            this.proceedCommand(modInstance, message, cmdPrefix, cmdName, cmdArgs);
        });
    }

    setEvent(name, callback) {
        this.eventEmitter.on(name, callback);
    }

    setOnceEvent(name, callback) {
        this.eventEmitter.once(name, callback);
    }

    setPrefix(prefix) {
        if(prefix.match(/^[]/)) {
            this.log('Error', 'Set', 'Prefix', 'Contains invalid character.');
            return;
        }

        this.prefix = prefix;
        this.log('Event', 'Set', 'Prefix', 'Changed to \'' + prefix +'\'');
    }
}
