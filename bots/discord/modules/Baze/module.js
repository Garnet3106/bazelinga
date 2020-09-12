'use strict';

const fs = require('fs');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');


exports.MainClass = class Baze extends Module {
    cmd_word(instance, message, cmdPrefix, cmdName, cmdArgs) {
        if(cmdArgs.length != 0)
        return;

    let embed = {
        description: 'スペリングを入力して下さい。'
    };

    instance.mod_messages.send(message.channel, {
        embed: embed
    });

    instance.mod_messages.reserve()
        .then(receivedMessage => {

        });

    /*let spelling = cmdArgs[0];

    // スペルチェック

    let embed = {
        title: '単語編集: ' + spelling
    };

    this.mod_messages.send(message.channel, {
        embed: embed
    })
        .then(sentMessage => {
            sentMessage.react('✍️');
            sentMessage.react('🎫');
        });*/
    }

    init() {
        return new Promise((resolve, reject) => {
            this.setPrefix('baze');

            this.addCommand('word', 'word', this.cmd_word);

            resolve();
        });
    }

    initSettingData() {
        
    }

    ready() {
        this.mod_settings = bot.getModuleInstance('Settings');
        this.initSettingData();

        this.mod_commands = bot.getModuleInstance('Commands');
        this.setCommandEvent(this, this.mod_commands);

        this.mod_messages = bot.getModuleInstance('Messages');

        this.mod_reactions = bot.getModuleInstance('Reactions');
        this.mod_reactions.setReactionRemover();
    }
}
