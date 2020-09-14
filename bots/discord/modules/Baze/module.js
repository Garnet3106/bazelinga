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
        })
            .then(spellingGuideMsg => {
                instance.cmd_word_receiveSpelling(message, spellingGuideMsg);
            });
    }

    cmd_word_receiveSpelling(cmdMsg, spellingGuideMsg) {
        this.mod_messages.reserve()
            .then(spellingMsg => {
                // 後でメッセージを消すためユーザを保持
                let cmdUser = spellingMsg.author;
                let spelling = spellingMsg.content;

                // 送信者のIDが一致しなければもう一度メッセージを待つ
                if(spellingMsg.author.id != cmdMsg.author.id) {
                    this.cmd_word_receiveSpelling(cmdMsg);
                    return;
                }

                cmdMsg.delete();
                spellingGuideMsg.delete();
                spellingMsg.delete();

                // キャンセルの場合はreturn
                if(spellingMsg.content == 'cancel')
                    return;

                if(false) { //スペルチェックを後で入れる
                    let embed = {
                        title: spelling,
                        description: 'スペルが無効です。'
                    };

                    this.mod_messages.send({
                        embed: embed
                    })

                    return;
                }

                let embed = {
                    title: spelling
                };

                this.mod_messages.send(cmdMsg.channel, {
                    embed: embed
                })
                    .then(wordOperationMsg => {
                        this.cmd_word_setOperationReactions(wordOperationMsg, cmdUser);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            });
    }

    cmd_word_setOperationReactions(wordOperationMsg, cmdUser) {
        wordOperationMsg.react('💬');
        wordOperationMsg.react('❌');

        let eventName = this.mod_reactions.events.addReaction;
        this.mod_reactions.setEvent(eventName, (reaction, user) => {
            if(user.id != cmdUser.id)
                return;

            let emojiName = reaction.emoji.name;

            switch(emojiName) {
                case '💬':
                
                break;

                case '❌':
                let embed = {
                    description: '単語編集を取り消しました。'
                };

                this.mod_messages.send(wordOperationMsg.channel, {
                    embed: embed
                }, 3000);

                wordOperationMsg.delete();
                break;
            }
        });
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
