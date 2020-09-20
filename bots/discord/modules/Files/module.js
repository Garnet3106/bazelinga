'use strict';

const fs = require('fs');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');


exports.MainClass = class Files extends Module {
    init() {
        return new Promise((resolve, reject) => {
            this.setCommandPrefix('file');
            // 使用中のFileインスタンスの配列
            this.files = {};
            resolve();
        });
    }

    load(filePath, defaultContent = '') {
        return new File(this, filePath, defaultContent);
    }

    ready() {
        this.mod_settings = bot.getModuleInstance('Settings');
        this.mod_commands = bot.getModuleInstance('Commands');
        //this.mod_commands.addCommand('word', 'word', WordCommand);
        this.mod_messages = bot.getModuleInstance('Messages');
        this.mod_reactions = bot.getModuleInstance('Reactions');
    }
}


class File {
    constructor(modInstance, filePath, defaultContent = '') {
        this.filePath = filePath;
        this.modInstance = modInstance;

        if(!this.exists())
            this.createSync(defaultContent);
    }

    append() {
        return new Promise((resolve, reject) => {
            fs.appendFile(this.filePath, content, {
                encoding: 'utf-8'
            }, err => {
                if(err) {
                    this.modInstance.log('Error', 'Append', 'A file: \'' + this.filePath + '\'', err.message);
                    reject(err);
                    return;
                }

                this.modInstance.log('Event', 'Append', 'A file: \'' + this.filePath + '\'');
                resolve();
            });
        });
    }

    createSync(defaultContent = '') {
        this.writeSync(defaultContent);
    }

    delete() {}

    exists() {
        try {
            fs.statSync(this.filePath);
        } catch(excep) {
            return excep.code != 'ENOENT';
        }

        return true;
    }

    read() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filePath, {
                encoding: 'utf-8'
            }, (err, data) => {
                if(err) {
                    this.modInstance.log('Error', 'Read', 'File: \'' + this.filePath + '\'', err.message);
                    reject(err);
                    return;
                }

                this.modInstance.log('Event', 'Read', 'File: \'' + this.filePath + '\'');
                resolve(data);
            });
        });
    }

    write(content) {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.filePath, content, {
                encoding: 'utf-8'
            }, err => {
                if(err) {
                    this.modInstance.log('Error', 'Write', 'A file: \'' + this.filePath + '\'', err.message);
                    reject(err);
                    return;
                }

                this.modInstance.log('Event', 'Write', 'A file: \'' + this.filePath + '\'');
                resolve();
            });
        });
    }

    writeSync(content) {
        fs.writeFileSync(this.filePath, content); 
        this.modInstance.log('Event', 'Write', 'A file: \'' + this.filePath + '\'');
    }
}
