/* 
 * 
 * Baze Language Dictionary
 * 
 * PLEASE CHECK THE LICENSE FOR USING SOURCES:
 *     https://bazelinga.gant.work/how_to_use.html
 * 
 * Copyright (c) 2020 Garnet3106
 * 
 */


'use strict';


class LangPack {
    constructor(lang) {
        this.data = {};
        this.lang = lang;
        this.ready = false;
    }

    // 設定された言語のデータを返す
    getData() {
        return this.data[this.lang];
    }

    load(succeeded = () => {}, failed = error => {}) {
        let uri = 'http://bazelinga.gant.work/lib/dict/data/langpack.json';

        getFileContent(uri)
            .then(data => {
                // ロード成功時
                try {
                    this.data = JSON.parse(data);
                    this.ready = true;

                    succeeded();
                } catch(excep) {
                    console.log(excep);
                }
            })
            .catch(error => {
                // ロード失敗時
                failed(error);
            });
    }
}
