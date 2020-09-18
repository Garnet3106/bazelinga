'use strict';

const fs = require('fs');
const { resolve } = require('path');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');


class WordCommand {
    constructor(mod_bot, cmdMsg, cmdPrefix, cmdName, cmdArgs) {
        if(cmdArgs.length != 0)
            return;

        this.mod_messages = mod_bot.getModuleInstance('Messages');
        this.mod_messages.delete(cmdMsg);
        this.mod_reactions = mod_bot.getModuleInstance('Reactions');

        // 単語操作メッセージ向けにリアクションイベントを設定したか
        this.hasSetOperationReactionEvent = false;

        let embed = {
            description: 'スペリングを入力して下さい。'
        };

        this.mod_messages.send(cmdMsg.channel, {
            embed: embed
        })
            .then(spellingGuideMsg => {
                this.receiveSpelling(cmdMsg, spellingGuideMsg);
            });
    }

    receiveSpelling(cmdMsg, spellingGuideMsg) {
        this.mod_messages.reserve()
            .then(spellingMsg => {
                // 後でメッセージを消すためユーザを保持
                let cmdChannel = spellingMsg.channel;
                let cmdUser = spellingMsg.author;
                let spelling = spellingMsg.content;

                // 送信者のIDが一致しなければもう一度メッセージを待つ
                if(spellingMsg.author.id != cmdMsg.author.id) {
                    this.receiveSpelling(cmdMsg);
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

                this.sendWordOperationMessage(spelling, cmdUser, cmdChannel);
            });
    }

    setOperationReactionEvent(cmdUser, msgEmbed, spelling) {
        let eventName = this.mod_reactions.events.addReaction;
        this.mod_reactions.setEvent(eventName, (reaction, user) => {
            if(user.id != cmdUser.id)
                return;

            if(this.wordOpeMsg.id != reaction.message.id)
                return;

            let emojiName = reaction.emoji.name;

            switch(emojiName) {
                case '💬':
                this.receiveNewSpelling(cmdUser, spelling)
                    .then(spelling => {
                        msgEmbed.title = spelling;
                        this.mod_messages.send(this.wordOpeMsg.channel, {
                            embed: msgEmbed
                        })
                            .then(newWordOpeMsg => {
                                this.wordOpeMsg = newWordOpeMsg;
                                this.giveOperationReactions(this.wordOpeMsg);
                            });
                    });
                break;

                case '❌':
                this.confirmRemovingWord(spelling, this.wordOpeMsg.channel, cmdUser);
                break;

                case '✅':
                this.saveWordOperation();
                break;
            }
        });
    }

    giveOperationReactions() {
        this.mod_reactions.react(this.wordOpeMsg, '💬');
        this.mod_reactions.react(this.wordOpeMsg, '❌');
        this.mod_reactions.react(this.wordOpeMsg, '✅');
    }

    receiveNewSpelling(cmdUser, spelling) {
        return new Promise((resolve, reject) => {
            this.mod_messages.delete(this.wordOpeMsg);

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

            this.mod_messages.send(this.wordOpeMsg.channel, {
                embed: embed
            })
                .then(newSpellingGuideMsg => {
                    reserveSpellingInput(newSpellingGuideMsg);
                });
        });
    }

    confirmRemovingWord(spelling, cmdChannel, cmdUser) {
        let embed = {
            title: '単語削除',
            description: '単語を削除しますか？',
            fields: [
                {
                    name: '.yes',
                    value: '単語を削除します。',
                    inline: true
                },
                {
                    name: '.no',
                    value: '単語の削除を取り消します',
                    inline: true
                }
            ]
        };

        this.mod_messages.send(this.wordOpeMsg.channel, {
            embed: embed
        })
            .then(confirmMsg => {
                this.receiveConfirmResponce(spelling, cmdChannel, cmdUser, confirmMsg);
            });

        this.mod_messages.delete(this.wordOpeMsg);
    }

    cancelWordRemoveProcess(spelling) {
        let cmdChannel = this.wordOpeMsg.channel;
        let cmdUser = this.wordOpeMsg.author;

        let embed = {
            description: '単語の削除を取り消しました。'
        };

        this.mod_messages.send(cmdChannel, {
            embed: embed
        }, 3000);

        this.sendWordOperationMessage(spelling, cmdUser, cmdChannel);
    }

    sendWordOperationMessage(spelling, cmdUser, cmdChannel) {
        let embed = {
            title: spelling
        };

        this.mod_messages.send(cmdChannel, {
            embed: embed
        })
            .then(sentWordOpeMsg => {
                this.wordOpeMsg = sentWordOpeMsg;
                this.giveOperationReactions();

                if(!this.hasSetOperationReactionEvent) {
                    this.setOperationReactionEvent(cmdUser, embed, spelling);
                    this.hasSetOperationReactionEvent = true;
                }
            })
            .catch(err => {
                console.log(err);
            });
    }

    receiveConfirmResponce(spelling, cmdChannel, cmdUser, confirmMsg) {
        this.mod_messages.reserve()
            .then(opeMsg => {
                if(opeMsg.channel.id == cmdChannel.id
                        && opeMsg.author.id == cmdUser.id) {
                    let opeName = opeMsg.content;

                    switch(opeName) {
                        case '.yes':
                        this.mod_messages.delete(confirmMsg);
                        this.mod_messages.delete(opeMsg);
                        this.removeWord(spelling, cmdChannel);
                        // キャンセル時はreserveし続ける必要がないのでreturnする
                        return;

                        case '.no':
                        this.mod_messages.delete(confirmMsg);
                        this.mod_messages.delete(opeMsg);
                        this.cancelWordRemoveProcess(spelling);
                        break;
                    }
                }

                // 複数回受け付ける
                this.receiveConfirmResponce(spelling, cmdChannel, cmdUser, confirmMsg);
            });
    }

    removeWord(spelling, cmdChannel) {
        let embed = {
            description: '単語を削除しました。'
        };

        this.mod_messages.send(cmdChannel, {
            embed: embed
        }, 3000);
    }

    saveWordOperation() {
        let embed = {
            description: '変更を保存しました。'
        };

        this.mod_messages.send(this.wordOpeMsg.channel, {
            embed: embed
        }, 3000);

        this.mod_messages.delete(this.wordOpeMsg);
    }
}


exports.MainClass = class Baze extends Module {
    init() {
        return new Promise((resolve, reject) => {
            this.setCommandPrefix('baze');
            resolve();
        });
    }

    initSettingData() {
        
    }

    ready() {
        this.mod_settings = bot.getModuleInstance('Settings');
        this.initSettingData();

        this.mod_commands = bot.getModuleInstance('Commands');
        this.mod_commands.addCommand('word', 'word', WordCommand);

        this.mod_messages = bot.getModuleInstance('Messages');

        this.mod_reactions = bot.getModuleInstance('Reactions');
        this.mod_reactions.setReactionRemover();
    }
}
