'use strict';

const fs = require('fs');
const { resolve } = require('path');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');


class WordCommand {
    constructor(mod_bot, cmdMsg, cmdPrefix, cmdName, cmdArgs) {
        this.mod_messages = mod_bot.getModuleInstance('Messages');
        this.mod_messages.delete(cmdMsg);
        this.mod_reactions = mod_bot.getModuleInstance('Reactions');

        this.spelling = '';
        // 単語操作メッセージ向けにリアクションイベントを設定したか
        this.hasSetOperationReactionEvent = false;

        this.cmdMsg = cmdMsg;
        this.cmdChannel = cmdMsg.channel;
        this.cmdUser = cmdMsg.author;

        this.mod_messages.send(this.cmdChannel, {
            embed: {
                description: 'スペリングを入力して下さい。'
            }
        })
            .then(spellingGuideMsg => {
                this.spellingGuideMsg = spellingGuideMsg;
                this.receiveSpelling();
            });
    }

    cancelSpellingInput() {
        this.mod_messages.send(this.cmdChannel, {
            embed: {
                title: '単語編集',
                description: '単語編集をキャンセルしました。'
            }
        }, 3000);
    }

    receiveSpelling() {
        this.mod_messages.reserve()
            .then(spellingMsg => {
                // 送信者のIDが一致しなければもう一度メッセージを待つ
                if(spellingMsg.author.id != this.cmdUser.id) {
                    this.receiveSpelling();
                    return;
                }

                this.mod_messages.delete(this.spellingGuideMsg);
                this.mod_messages.delete(spellingMsg);

                this.spelling = spellingMsg.content;

                switch(this.spelling) {
                    case '.cancel':
                    cancelSpellingInput();
                    return;
                }

                if(false) { //スペルチェックを後で入れる
                    let embed = {
                        title: this.spelling,
                        description: 'スペルが無効です。'
                    };

                    this.mod_messages.send({
                        embed: embed
                    });

                    return;
                }

                this.sendWordOperationMessage();
            });
    }

    setOperationReactionEvent() {
        let eventName = this.mod_reactions.events.addReaction;
        this.mod_reactions.setEvent(eventName, (reaction, user) => {
            if(user.id != this.cmdUser.id)
                return;

            if(this.wordOpeMsg.id != reaction.message.id)
                return;

            let emojiName = reaction.emoji.name;

            switch(emojiName) {
                case '💬':
                this.receiveNewSpelling()
                    .then(newSpelling => {
                        this.spelling = newSpelling;
                        this.sendWordOperationMessage();
                    });
                break;

                case '📝':
                this.showTranslationEditor();
                break;

                case '❌':
                this.confirmWordRemovation();
                break;

                case '✅':
                this.saveWordOperation();
                break;
            }
        });
    }

    showTranslationEditor() {
        this.mod_messages.send(this.cmdChannel, {
            embed: {
                title: '翻訳編集',
                description: '操作コマンドを入力してください。',
                fields: [
                    {
                        name: '.<番号>',
                        value: '指定した番号の翻訳を追加/編集します。',
                        inline: true
                    },
                    {
                        name: '.',
                        value: 'a',
                        inline: true
                    }
                ]
            }
        })
            .then(transEditMsg => {
                this.transEditMsg = transEditMsg;
                this.receiveConfirmationResponce();
            });

        this.mod_messages.delete(this.wordOpeMsg);
    }

    reactToOperationMessage() {
        let reactEmojis = [ '💬', '📝', '❌', '✅' ];

        reactEmojis.forEach(emoji => {
            this.mod_reactions.react(this.wordOpeMsg, emoji);
        });
    }

    receiveNewSpelling() {
        return new Promise((resolve, reject) => {
            this.mod_messages.delete(this.wordOpeMsg);

            let reserveSpellingInput = newSpellingGuideMsg => {
                this.mod_messages.reserve()
                    .then(spellingMsg => {
                        if(spellingMsg.author.id != this.cmdUser.id)
                            return;

                        let newSpelling = spellingMsg.content;

                        // スペルチェック

                        this.mod_messages.delete(newSpellingGuideMsg);
                        this.mod_messages.delete(spellingMsg);
                        resolve(newSpelling);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            };

            this.mod_messages.send(this.wordOpeMsg.channel, {
                embed: {
                    title: 'スペル編集',
                    description: '新しいスペルを入力して下さい。\n\n(変更前: \'' + this.spelling + '\')'
                }
            })
                .then(newSpellingGuideMsg => {
                    reserveSpellingInput(newSpellingGuideMsg);
                });
        });
    }

    confirmWordRemovation() {
        this.mod_messages.send(this.cmdChannel, {
            embed: {
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
            }
        })
            .then(confirmMsg => {
                this.removationConfirmMsg = confirmMsg;
                this.receiveConfirmationResponce();
            });

        this.mod_messages.delete(this.wordOpeMsg);
    }

    cancelWordRemoveProcess() {
        this.mod_messages.send(this.cmdChannel, {
            embed: {
                description: '単語の削除を取り消しました。'
            }
        }, 3000);

        this.sendWordOperationMessage();
    }

    sendWordOperationMessage() {
        this.mod_messages.send(this.cmdChannel, {
            embed: {
                title: this.spelling
            }
        })
            .then(sentWordOpeMsg => {
                this.wordOpeMsg = sentWordOpeMsg;
                this.reactToOperationMessage();

                if(!this.hasSetOperationReactionEvent) {
                    this.setOperationReactionEvent();
                    this.hasSetOperationReactionEvent = true;
                }
            })
            .catch(err => {
                console.log(err);
            });
    }

    receiveConfirmationResponce() {
        this.mod_messages.reserve()
            .then(opeMsg => {
                if(opeMsg.channel.id == this.cmdChannel.id
                        && opeMsg.author.id == this.cmdUser.id) {
                    let opeName = opeMsg.content;

                    switch(opeName) {
                        case '.yes':
                        this.mod_messages.delete(this.removationConfirmMsg);
                        this.mod_messages.delete(opeMsg);
                        this.removeWord();
                        return;

                        case '.no':
                        this.mod_messages.delete(this.removationConfirmMsg);
                        this.mod_messages.delete(opeMsg);
                        this.cancelWordRemoveProcess();
                        return;
                    }
                }

                // 関係のないメッセージの場合は複数回受け付ける
                this.receiveConfirmationResponce();
            });
    }

    removeWord() {
        this.mod_messages.send(this.cmdChannel, {
            embed: {
                description: '単語を削除しました。'
            }
        }, 3000);
    }

    saveWordOperation() {
        this.mod_messages.send(this.cmdChannel, {
            embed: {
                description: '変更を保存しました。'
            }
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
