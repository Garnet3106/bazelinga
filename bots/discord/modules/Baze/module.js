'use strict';

const fs = require('fs');
const { resolve } = require('path');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');


exports.MainClass = class Baze extends Module {
    cmd_word(instance, cmdMsg, cmdPrefix, cmdName, cmdArgs) {
        if(cmdArgs.length != 0)
            return;

        instance.mod_messages.delete(cmdMsg);

        let embed = {
            description: 'スペリングを入力して下さい。'
        };

        instance.mod_messages.send(cmdMsg.channel, {
            embed: embed
        })
            .then(spellingGuideMsg => {
                instance.cmd_word_receiveSpelling(cmdMsg, spellingGuideMsg);
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

                this.mod_messages.delete(spellingGuideMsg);
                this.mod_messages.delete(spellingMsg);

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
                        this.cmd_word_giveOperationReactions(wordOperationMsg);
                        this.cmd_word_setOperationReactionEvent(wordOperationMsg, cmdUser, embed, spelling);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            });
    }

    cmd_word_setOperationReactionEvent(wordOperationMsg, cmdUser, msgEmbed, spelling) {
        let eventName = this.mod_reactions.events.addReaction;
        this.mod_reactions.setEvent(eventName, (reaction, user) => {
            if(user.id != cmdUser.id)
                return;

            if(wordOperationMsg.id != reaction.message.id)
                return;

            let emojiName = reaction.emoji.name;

            switch(emojiName) {
                case '💬':
                this.cmd_word_receiveNewSpelling(wordOperationMsg, cmdUser, spelling)
                    .then(spelling => {
                        msgEmbed.title = spelling;
                        this.mod_messages.send(wordOperationMsg.channel, {
                            embed: msgEmbed
                        })
                            .then(newWordOperationMsg => {
                                wordOperationMsg = newWordOperationMsg;
                                this.cmd_word_giveOperationReactions(wordOperationMsg);
                            });
                    });
                break;

                case '❌':
                this.cmd_word_quitWordOperation(wordOperationMsg);
                break;
            }
        });
    }

    cmd_word_giveOperationReactions(wordOperationMsg) {
        this.mod_reactions.react(wordOperationMsg, '💬');
        this.mod_reactions.react(wordOperationMsg, '❌');
    }

    cmd_word_receiveNewSpelling(wordOperationMsg, cmdUser, spelling) {
        return new Promise((resolve, reject) => {
            this.mod_messages.delete(wordOperationMsg);///

            let reserveSpellingInput = newSpellingGuideMsg => {
                this.mod_messages.reserve()
                    .then(spellingMsg => {
                        if(spellingMsg.author.id != cmdUser.id)
                            return;

                        let spelling = spellingMsg.content;

                        // スペルチェック

                        this.mod_messages.delete(newSpellingGuideMsg);
                        this.mod_messages.delete(spellingMsg);
                        resolve(spelling);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            };

            let embed = {
                title: 'スペル編集',
                description: '新しいスペルを入力して下さい。\n\n(変更前: \'' + spelling + '\')'
            };

            this.mod_messages.send(wordOperationMsg.channel, {
                embed: embed
            })
                .then(newSpellingGuideMsg => {
                    reserveSpellingInput(newSpellingGuideMsg);
                });
        });
    }

    cmd_word_quitWordOperation(wordOperationMsg) {
        let embed = {
            description: '単語編集を取り消しました。'
        };

        this.mod_messages.send(wordOperationMsg.channel, {
            embed: embed
        }, 3000);

        this.mod_messages.delete(wordOperationMsg);
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
