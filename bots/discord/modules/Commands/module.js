'use strict';

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');



exports.MainClass = class Commands extends Module {
    init() {
        return new Promise((resolve, reject) => {
            this.prefix = 'cmd';

            this.events = this.getEnumArray([
                'receiveCommand'
            ]);

            resolve();
        });
    }

    proceedMessage(message) {
        let dividedMsg = message.content.split(' ');

        let cmdElems = dividedMsg[0].split('.');

        if(cmdElems.length != 2)
            return;

        let cmdPrefix = cmdElems[0];
        let cmdName = cmdElems[1];

        let cmdArgs = dividedMsg.splice(1);

        this.emitEvent(this.events.receiveCommand, message, cmdPrefix, cmdName, cmdArgs);
    }

    ready() {
        let mod_messages = bot.getModuleInstance('Messages');
        mod_messages.setEvent(mod_messages.events.receiveMessage, message => {
            this.proceedMessage(message);
        });
    }
}
