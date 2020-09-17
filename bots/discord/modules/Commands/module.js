'use strict';

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');



exports.MainClass = class Commands extends Module {
    addCommand(cmdName, cmdType, cmdClass) {
        this.commandTypes[cmdName] = cmdType;
        this.commandClasses[cmdType] = cmdClass;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.commandClasses = {};
            this.commandTypes = {};

            this.setCommandPrefix('cmd');

            this.events = this.getEnumArray([
                'receiveCommand'
            ]);

            resolve();
        });
    }

    createCommandInstance(message, cmdPrefix, cmdName, cmdArgs, disableLoop = false) {
        let cmdType = this.getCommandType(cmdName);
        let classObj = this.getCommandClass(cmdType);

        if(typeof(classObj) !== 'function') {
            if(!disableLoop)
                return this.createCommandInstance(message, cmdPrefix, 'help', cmdArgs, true);

            return;
        }

        //this.emitEvent(this.events.receiveCommand, message, cmdPrefix, cmdName, cmdArgs);
        return new classObj(bot, message, cmdPrefix, cmdName, cmdArgs);
    }

    proceedMessage(message) {
        let dividedMsg = message.content.split(' ');

        let cmdElems = dividedMsg[0].split('.');

        if(cmdElems.length != 2)
            return;

        let cmdPrefix = cmdElems[0];
        let cmdName = cmdElems[1];
        let cmdArgs = dividedMsg.splice(1);

        this.createCommandInstance(message, cmdPrefix, cmdName, cmdArgs);
    }

    ready() {
        this.mod_messages = bot.getModuleInstance('Messages');
        this.mod_messages.setEvent(this.mod_messages.events.receiveMessage, message => {
            this.proceedMessage(message);
        });
    }
}
