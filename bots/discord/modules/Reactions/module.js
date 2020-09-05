'use strict';

const fs = require('fs');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');


exports.MainClass = class Reactions extends Module {
    init() {
        return new Promise((resolve, reject) => {
            this.setPrefix('react');

            this.events = this.getEnumArray([
                'addReaction'
            ]);

            resolve();
        });
    }

    initSettingData() {
        
    }

    proceedCommand(message, cmdPrefix, cmdName, cmdArgs) {
        
    }

    ready() {
        bot.client.on('messageReactionAdd', (reaction, user) => {
            this.emitEvent(this.events.addReaction, reaction, user);
        });

        this.mod_settings = bot.getModuleInstance('Settings');
        this.initSettingData();

        this.mod_messages = bot.getModuleInstance('Messages');

        this.mod_commands = bot.getModuleInstance('Commands');
        this.mod_commands.setEvent(this.mod_commands.events.receiveCommand, (message, cmdPrefix, cmdName, cmdArgs) => {
            this.proceedCommand(message, cmdPrefix, cmdName, cmdArgs);
        });
    }

    setReactionRemover(modName = '', cmdName = '') {
        this.setEvent(this.events.addReaction, (reaction, user) => {
            if(user.bot)
                return;

            reaction.remove();
        });
    }
}
