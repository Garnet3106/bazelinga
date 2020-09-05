'use strict';

const fs = require('fs');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');


exports.MainClass = class Dictionary extends Module {
    init() {
        return new Promise((resolve, reject) => {
            this.setPrefix('dict');
            resolve();
        });
    }

    initSettingData() {
        
    }

    proceedCommand(message, cmdPrefix, cmdName, cmdArgs) {
        switch(cmdName) {
            case 'edit': {
                if(cmdArgs.length != 1)
                    return;

                let spelling = cmdArgs[0];

                // スペルチェック

                let embed = {
                    title: '単語編集: ' + spelling
                };

                message.channel.send({
                    embed: embed
                })
                    .then(sentMessage => {
                        sentMessage.react('✍️');
                        sentMessage.react('🎫');
                    });
            } break;

            case '': {

            } break;
        }
    }

    ready() {
        this.mod_settings = bot.getModuleInstance('Settings');
        this.initSettingData();

        this.mod_messages = bot.getModuleInstance('Messages');

        this.mod_commands = bot.getModuleInstance('Commands');
        this.mod_commands.setEvent(this.mod_commands.events.receiveCommand, (message, cmdPrefix, cmdName, cmdArgs) => {
            this.proceedCommand(message, cmdPrefix, cmdName, cmdArgs);
        });

        this.mod_reactions = bot.getModuleInstance('Reactions');
        this.mod_reactions.setReactionRemover();
    }
}
