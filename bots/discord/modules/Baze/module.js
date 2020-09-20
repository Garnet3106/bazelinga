'use strict';

const { resolve } = require('path');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');


class WordCommand {
    constructor(mod_bot, cmdMsg, cmdPrefix, cmdName, cmdArgs) {
        this.mod_messages = mod_bot.getModuleInstance('Messages');
        this.mod_messages.delete(cmdMsg);
        this.mod_reactions = mod_bot.getModuleInstance('Reactions');

        this.mod_baze = mod_bot.getModuleInstance('Baze');
        this.dictData = this.mod_baze.dictData;

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
                this.receiveOriginalSpelling();
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

    receiveOriginalSpelling() {
        this.mod_messages.reserve()
            .then(spellingMsg => {
                // 送信者のIDが一致しなければもう一度メッセージを待つ
                if(spellingMsg.author.id != this.cmdUser.id) {
                    this.receiveOriginalSpelling();
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

                // 変更前のスペル
                this.originalSpelling = this.spelling;

                if(this.dictData.existsWord(this.spelling)) {
                    this.wordData = this.dictData.getWord(this.spelling);
                } else {
                    this.wordData = DictionaryData.getNewWordObject(this.spelling);
                }

                this.sendWordOperationMessage();
            });
    }

    setOperationReactionEvent() {
        let eventName = this.mod_reactions.events.addReaction;
        this.mod_reactions.setEvent(eventName, (reaction, user) => {
            if(this.cmdUser.id != user.id)
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

                case '❓':
                this.showHelpMessage();
                break;
            }
        });
    }

    showHelpMessage() {
        this.mod_messages.send(this.cmdChannel, {
            embed: {
                title: '単語編集ヘルプ',
                description: '操作用リアクションの一覧です。\n\n(:arrow_backward: で戻る)',
                fields: [
                    {
                        name: '💬',
                        value: 'スペル編集',
                        inline: true
                    },
                    {
                        name: '📝',
                        value: '翻訳編集',
                        inline: true
                    },
                    {
                        name: '❌',
                        value: '単語削除',
                        inline: true
                    },
                    {
                        name: '✅',
                        value: '編集保存',
                        inline: true
                    },
                    {
                        name: '❓',
                        value: 'ヘルプ表示',
                        inline: true
                    }
                ]
            }
        })
            .then(helpMsg => {
                this.setHelpMessageReactions(helpMsg);
            });

        this.mod_messages.delete(this.wordOpeMsg);
    }

    setHelpMessageReactions(helpMsg) {
        this.mod_reactions.react(helpMsg, '◀');

        let eventName = this.mod_reactions.events.addReaction;
        this.mod_reactions.setEvent(eventName, (reaction, user) => {
            if(this.cmdUser.id != user.id)
                return;

            if(helpMsg.id != reaction.message.id)
                return;

            let emojiName = reaction.emoji.name;

            switch(emojiName) {
                case '◀':
                this.mod_messages.delete(helpMsg);
                this.sendWordOperationMessage();
                return;
            }

            this.setHelpMessageReactions(helpMsg);
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
        let reactEmojis = [ '💬', '📝', '❌', '✅', '❓' ];
        let count = 0;

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

                        this.wordData = DictionaryData.getNewWordObject(newSpelling);

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
                        this.saveWordOperation();
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
        this.isWordRemoved = true;

        this.mod_messages.send(this.cmdChannel, {
            embed: {
                description: '単語を削除しました。'
            }
        }, 3000);
    }

    saveWordOperation() {
        this.dictData.removeWord(this.originalSpelling);

        if(!this.isWordRemoved)
            this.dictData.addWord(this.spelling, this.wordData);

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

    ready() {
        this.mod_settings = bot.getModuleInstance('Settings');
        //this.initSettingData();

        this.mod_commands = bot.getModuleInstance('Commands');
        this.mod_commands.addCommand('word', 'word', WordCommand);

        this.mod_messages = bot.getModuleInstance('Messages');

        this.mod_reactions = bot.getModuleInstance('Reactions');
        this.mod_reactions.setReactionRemover();

        this.mod_files = bot.getModuleInstance('Files');
        this.initDictionaryFile();
    }

    initDictionaryFile() {
        this.dictFilePath = './modules/BOT/dict.txt';
        this.dictFile = this.mod_files.load(this.dictFilePath, '');

        DictionaryData.getFromFile(this, this.dictFile)
            .then(dictData => {
                this.dictData = dictData;
            });
    }
}


class DictionaryData {
    constructor(textData) {
        this.textData = textData;
        this.objData = this.toObject();
    }

    addWord(spelling, wordData) {
        this.objData.words[spelling] = wordData;
    }

    existsWord(spelling) {
        return spelling in this.objData.words;
    }

    static getFromFile(modInstance, dictFile) {
        return new Promise((resolve, reject) => {
            dictFile.read()
                .then(textData => {
                    try {
                        resolve(new DictionaryData(textData));
                    } catch(excep) {
                        modInstance.log('Error', 'Init', 'The dictionary data', excep.message);
                        reject(excep);
                    }
                })
                .catch(err => {
                    modInstance.log('Error', 'Init', 'The dictionary data', err.messge);
                    reject(err);
                });
        });
    }

    toObject() {
        let words = {};
        let lines = this.textData.split('\n');

        let latestSpelling = '';
        let latestClass = '';

        for(let line_i = 0; line_i < lines.length; line_i++) {
            // 空行またはコメントアウトの場合は飛ばす
            if(lines[line_i] == '' || lines[line_i].startsWith(';'))
                continue;

                if(lines[line_i].startsWith('#')) {
                // スペルを設定する
                latestSpelling = lines[line_i].substring(1);
                continue;
            }

            if(lines[line_i].startsWith('@')) {
                if(latestSpelling == '')
                    continue;

                // クラスを設定する
                latestClass = lines[line_i].substring(1);
                continue;
            }

            if(latestClass == '')
                continue;

            let elems = lines[line_i].split('|');

            // データの数が不正な場合は飛ばす
            if(elems.length != 2)
                continue;

            if(!(latestSpelling in words))
                words[latestSpelling] = DictionaryData.getNewWordObject(latestSpelling);

            words[latestSpelling].translation.push({
                class: latestClass,
                type: elems[0],
                words: elems[1].split(',')
            });
        }

        return { words: words };
    }

    static getIPANotation(spelling) {
        return '[' + spelling + ']';
    }

    static getNewWordObject(spelling) {
        return {
            ipa: DictionaryData.getIPANotation(spelling),
            spelling: spelling,
            translation: []
        };
    }

    getWord(spelling) {
        return this.objData.words[spelling];
    }

    removeWord(spelling) {
        delete this.objData.words[spelling];
    }
}
