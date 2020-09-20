'use strict';

const fs = require('fs');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');
const { setegid } = require('process');


exports.MainClass = class Reactions extends Module {
    init() {
        return new Promise((resolve, reject) => {
            this.setCommandPrefix('react');

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

    react(message, emojiName) {
        if(message.deleted)
            return;

            console.log('a');
        message.react(emojiName)
            .catch(err => {
                this.log('Notice', 'Fail', 'Reaction', err);
            });
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

    removeReaction(reaction, user) {
        if(reaction.message.deleted)
            return;

        if(user.bot)
            return;

        reaction.users.remove(user)
            .catch(err => {
                this.log('Notice', 'Fail', 'Reaction', err);
            });
    }

    setReactionRemover(messageID = '', removeOnce = false, ignoreBOT = true) {
        let eventName = this.events.addReaction;

        let callback = (reaction, user) => {
            // 削除が1度のみかつメッセージIDが異なる場合はもう一度待つ
            if(removeOnce && messageID != '' && messageID != reaction.message.id) {
                setReactionEvent();
                return;
            }

            this.removeReaction(reaction, user);
        };

        let setReactionEvent = () => {
            if(removeOnce) {
                this.setOnceEvent(eventName, callback);
            } else {
                this.setEvent(eventName, callback);
            }
        };

        setReactionEvent();
    }
}
