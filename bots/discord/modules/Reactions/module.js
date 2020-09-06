'use strict';

const fs = require('fs');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');
const { setegid } = require('process');


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

    setReactionRemover(messageID = '', removeOnce = false, ignoreBOT = true) {
        let eventName = this.events.addReaction;

        let callback = (reaction, user) => {
            if(user.bot)
                return;

            if(messageID != '' && messageID != reaction.message.id) {
                if(removeOnce)
                    setEvent();

                return;
            }

            reaction.users.remove(user);
        };

        let setEvent = () => {
            if(removeOnce) {
                this.setOnceEvent(eventName, callback);
            } else {
                this.setEvent(eventName, callback);
            }
        };

        setEvent();
    }
}
