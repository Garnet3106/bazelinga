'use strict';

const Discord = require('discord.js');
const usage = require('usage');

const dotenv = require('dotenv');
dotenv.config();

const { Module, ModuleStatus } = require('../../module.js');


class ExitCommand {
    constructor(mod_bot, cmdMsg, cmdPrefix, cmdName, cmdArgs) {
        if(cmdMsg.author.id == '495511715425812481') {
            this.mod_bot = mod_bot;
            this.mod_messages = mod_bot.getModuleInstance('Messages');
            this.setProcessTimeout(cmdMsg);
        }
    }

    cancelProcess(cmdMsg, timeout) {
        clearTimeout(timeout);

        let embed = {
            title: 'BOT終了処理',
            description: '終了処理をキャンセルしました。'
        };

        this.mod_messages.send(cmdMsg.channel, {
            embed: embed
        }, 3000);
    }

    exitBOT(cmdMsg, forcely = false) {
        let msgDescription = forcely ? '直ちにBOTを終了しています...' : 'BOTを終了しています...';

        let embed = {
            title: 'BOT終了処理',
            description: msgDescription
        };

        // 送信に失敗した場合もBOTを終了する
        this.mod_messages.send(cmdMsg.channel, {
            embed: embed
        }, 3000)
            .finally(() => {
                setTimeout(() => {
                    this.mod_bot.log('Event', 'Exit', 'The BOT', 'Via exit command (User ID: ' + cmdMsg.author.id + ')');
                    process.exit(0);
                }, 5000);
            });
    }

    setProcessTimeout(cmdMsg) {
        let cmdChannel = cmdMsg.channel;
        let timeoutSec = 30;

        this.mod_messages.delete(cmdMsg);

        let embed = {
            title: 'BOT終了処理',
            description: timeoutSec + '秒後にBOTを終了します。',
            fields: [
                {
                    name: '.cancel',
                    value: '終了処理を取り消します。',
                    inline: true
                },
                {
                    name: '.force',
                    value: '直ちにBOTを終了します。',
                    inline: true
                }
            ],
        };

        this.mod_messages.send(cmdChannel, {
            embed: embed
        })
            .then(guideMsg => {
                let timeout = setTimeout(() => {
                    this.mod_messages.delete(guideMsg);
                    this.exitBOT(cmdMsg);
                }, timeoutSec * 1000);
        
                this.receiveOperation(cmdMsg, guideMsg, timeout);
            });
    }

    receiveOperation(cmdMsg, guideMsg, timeout) {
        this.mod_messages.reserve()
            .then(opeMsg => {
                if(opeMsg.channel.id == cmdMsg.channel.id
                        && opeMsg.author.id == cmdMsg.author.id) {
                    let opeName = opeMsg.content;

                    switch(opeName) {
                        case '.cancel':
                        this.mod_messages.delete(guideMsg);
                        this.mod_messages.delete(opeMsg);
                        this.cancelProcess(cmdMsg, opeMsg, timeout);
                        // キャンセル時はreserveし続ける必要がないのでreturnする
                        return;

                        case '.force':
                        this.mod_messages.delete(guideMsg);
                        this.mod_messages.delete(opeMsg);
                        this.exitBOT(cmdMsg, true);
                        break;
                    }
                }

                // 複数回受け付ける
                this.receiveOperation(cmdMsg, timeout);
            });
    }
}


exports.MainClass = class BOT extends Module {
    final() {}

    // モジュール名が見つからなければnullを返します
    getModuleInstance(modName) {
        return modName in this.modules ? this.modules[modName] : null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.setCommandPrefix('bot');

            this.token = process.env.ELEMBOT_DISCORD_TOKEN;
            // リアクション速度のためにrestTimeOffsetを設定
            this.client = new Discord.Client({
                restTimeOffset: 0
            });

            this.processID = process.pid;

            setInterval(() => {
                usage.lookup(this.processID, (err, result) => {
                    this.logCPUUsage(result);
                    this.logMemoryUsage(result);
                });
            }, 60000);

            this.client.login(this.token)
                .then(() => {
                    this.log('Event', 'LoggingIn', 'The BOT client');
                    resolve();
                })
                .catch(excep => {
                    this.log('Error', 'LoggingIn', 'The BOT client', excep.message);
                    reject();
                });
        });
    }

    launchBOT() {
        this.loadModules();
    }

    loadModules() {
        this.modules = {};
        let modIndex = 0;
        let modNames = Module.getModuleNames();

        this.log('Event', 'Start', 'Loading all modules');

        // ロードの制限時間を設ける (10秒)
        let timeout = setTimeout(() => {
            this.log('Error', 'NotReady', 'Any modules', 'Initialization process has been timeout.');
            this.log('Error', 'Fail', 'LoggingIn', 'Couldn\'t launch the BOT for some reason.');
        }, 10000);

        let callReadyFuncs = () => {
            // 全モジュールインスタンスのready()を呼び出す
            Object.values(this.modules).forEach(instance => {
                try {
                    instance.ready();
                } catch(e) {
                    instance.log('Error', 'Ready', 'A module source', e.message.split('\n')[0]);
                }
            });

            this.log('Event', 'GetReady', 'All modules');
            // ロードに成功した場合はタイムアウトを解除する
            clearTimeout(timeout);
        }

        // 各モジュールをロード
        modNames.forEach(name => {
            try {
                modIndex++;

                let mod = require('../' + name + '/module.js');

                // モジュール名が既に存在する場合は弾く
                if(name in this.modules)
                    return;

                // BOTモジュールの場合はthisを、そうでない場合は新たに生成したインスタンスを使用する
                let instance = name == this.moduleName ? this : new mod.MainClass();

                // モジュール名(フォルダ名)とクラス名が異なる場合はエラー
                if(name != instance.moduleName) {
                    instance.log('Error', 'Create', 'A module instance', 'Class name is diffirent from the module name.');
                    return;
                }

                instance.init()
                    .then(() => {
                        instance.moduleStatus = ModuleStatus.Initialized;
                        this.modules[name] = instance;
                        instance.log('Event', 'Create', 'A module instance');

                        // 全モジュールの読み込みが終わった場合はready()を呼び出す
                        // (もともとのモジュール数と、初期化＆追加されているモジュール数を比較する)
                        if(Object.keys(this.modules).length == modNames.length) {
                            callReadyFuncs();
                        }
                    })
                    .catch((message = '') => {
                        instance.log('Error', 'Create', 'A module instance', message);
                    });
            } catch(e) {
                // 例外メッセージは1行目のみを表示
                this.log('Error', 'Load', 'A module source (' + name + ')', e.message.split('\n')[0]);
                return;
            }
        });
    }

    logCPUUsage(usageResult) {
        let cpuUsage = usageResult.cpu;
        this.log('Status', 'CPU', 'Used: ' + cpuUsage + ' %');
    }

    logMemoryUsage(usageResult) {
        let memUsage = usageResult.memory;
        let processMemSize = Math.round(memUsage / 1024 / 1024 * 100) / 100;
        this.log('Status', 'Memory', 'Used: ' + processMemSize + ' MB');
    }

    ready() {
        this.mod_commands = this.getModuleInstance('Commands');
        this.mod_commands.addCommand('exit', 'exit', ExitCommand);
    }

    terminateBOT() {
        this.unloadModules();
    }

    unloadModules() {
        if(this.modules == undefined)
            return;

        Object.keys(this.modules).forEach(key => {
            let instance = this.modules[key];
            instance.final();
            instance.log('Event', 'Finalize', 'A module instance');
        });
    }
}
