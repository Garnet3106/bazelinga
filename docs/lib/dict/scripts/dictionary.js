'use strict';


class Dictionary {
    constructor(lang) {
        this.data = {};
        this.lang = lang;
        this.ready = false;
    }

    addTranslation(spelling, translationClass, translationType, translationWords) {
        let translation = {};

        translation.spelling = spelling;
        translation.class = translationClass;
        translation.type = translationType;
        translation.words = translationWords;

        this.data.push(translation);
    }

    static convertDataToString(data) {
        let words = {};

        data.forEach(trans => {
            let spelling = trans.spelling;
            let transClass = trans.class;
            let transType = trans.type;
            let transWords = trans.words;

            // スペルが見つからない場合は初期化する
            if(!(spelling in words))
                words[spelling] = {};

            // 翻訳のクラスが見つからない場合は初期化する
            if(!(transClass in words[spelling]))
                words[spelling][transClass] = [];

            // '種類|訳1,訳2...' の部分を追加する
            words[spelling][transClass].push([ transType, transWords.join(',') ]);
        });

        let result = '';
        result += langData.dictionary.licenseGuideMessage + '\n';

        for(let spelling in words) {
            let transClasses = words[spelling];
            result += '\n#' + spelling + '\n';

            for(let transClassName in transClasses) {
                let transList = transClasses[transClassName];
                result += '\n@' + transClassName + '\n';

                transList.forEach(transItem => {
                    result += transItem.join('|') + '\n';
                });
            }
        }

        return result;
    }

    static formatSearchKeyword(keyword) {
        keyword = keyword.replace(/　/g, ' ');
        keyword = keyword.replace(/^ +/g, '');
        keyword = keyword.replace(/ {2,}/g, ' ');
        keyword = keyword.replace(/ +$/g, '');

        keyword = keyword.toLowerCase();

        return keyword;
    }

    getDocsURI(index) {
        let $item = $('.workarea-wordlist-item').eq(index);
        let spelling = $item.children('.workarea-wordlist-item-spelling').eq(0).text();
        let dictURI = 'http://bazelinga.gant.work/docs/' + this.lang + '/dict/words/' + spelling + '/';

        return dictURI;
    }

    getTwitterShareLink(index) {
        let $item = $('.workarea-wordlist-item').eq(index);
        let spelling = $item.children('.workarea-wordlist-item-spelling').text();

        let relatedAccount = 'Garnet3106';

        let string = 'BazeLinga \'' + spelling + '\'';
        let link = 'http://bazelinga.gant.work/docs/' + this.lang + '/dict/search/#' + spelling;
        let mention = '@bazelinga';
        let hashtag = '#bazelinga';

        // encodeURI() でシャープ記号がエンコードされないので手動で置換する
        let text = encodeURI(string + '\n\n' + link + '\n' + mention + ' ' + hashtag).replace(/#/g, '%23');

        return 'https://twitter.com/share?related=' + relatedAccount + '&text=' + text;
    }

    // スペルに使用するテキストが有効かどうかを判断する (無効の場合はエラーメッセージを返す)
    isSpellingValid(inputtedText) {
        let formattedInput = Dictionary.formatSearchKeyword(inputtedText);
        let searchResult = this.searchSpelling(formattedInput);

        if(formattedInput == '')
            return langData.messages.theInputItemLacks;

        if(formattedInput.length > 30)
            return langData.messages.theInputtedTextIsTooLong;

        if(formattedInput.match(/[#@|\n]/))
            return langData.messages.theInputtedCharsAreInvalid;

        if(Object.keys(searchResult).length)
            return langData.messages.theSpellingIsDuplicated;

        return true;
    }

    // 翻訳に使用するテキストが有効かどうかを判断する (無効の場合はエラーメッセージを返す)
    isTranslationValid(inputtedText) {
        let formattedInput = Dictionary.formatSearchKeyword(inputtedText);

        if(formattedInput == '')
            return langData.messages.theInputItemLacks;

        if(formattedInput.length > 50)
            return langData.messages.theInputtedTextIsTooLong;

        if(formattedInput.match(/[#@|\n]/))
            return langData.messages.theInputtedCharsAreInvalid;

        return true;
    }

    load(succeeded = () => {}, failed = error => {}) {
        let uri = 'http://bazelinga.gant.work/docs/lib/dict/data/' + this.lang + '/words.txt';

        let options = {
            timespan: 5000,
            url: uri
        };

        $.ajax(options)
            .done(data => {
                // ロード成功時
                this.data = Dictionary.parseToData(data);
                this.ready = true;

                succeeded();
            })
            .fail(error => {
                // ロード失敗時
                failed(error);
            });
    }

    static parseToData(text) {
        let translation = [];
        let lines = text.split('\n');

        let latestSpell = '';
        let latestClass = '';

        for(let line_i = 0; line_i < lines.length; line_i++) {
            // 空行またはコメントアウトの場合は飛ばす
            if(lines[line_i] == '' || lines[line_i].startsWith(';'))
                continue;

                if(lines[line_i].startsWith('#')) {
                // スペルを設定する
                latestSpell = lines[line_i].substring(1);
                continue;
            }

            if(lines[line_i].startsWith('@')) {
                if(latestSpell == '')
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

            translation.push({
                class: latestClass,
                spelling: latestSpell,
                type: elems[0],
                words: elems[1].split(',')
            });
        }

        return translation;
    }

    removeAllTranslation(translation) {
        translation.forEach((trans, index) => {
            // 削除時は要素数が減っていくのでインデックスを1つずつ減らしていく
            this.removeTranslation(trans.index - index);
        });
    }

    removeTranslation(index) {
        this.data.splice(index, 1);
    }

    search(keyword) {
        let matchedTranslation = [];

        this.data.forEach((translation, translationIndex) => {
            let matched = false;

            if(translation.spelling.includes(keyword))
                matched = true;

            translation.words.forEach(word => {
                if(word.includes(keyword)) {
                    matched = true;
                }
            });

            if(matched) {
                // 翻訳のコピーを作成する (参照渡し防止)
                let tmpTranslation = $.extend(true, {}, translation);
                // コピーした翻訳にインデックスを追加する
                tmpTranslation.index = translationIndex;
                matchedTranslation.push(tmpTranslation);
            }
        });

        return matchedTranslation;
    }

    searchSpelling(spelling) {
        let searchResult = this.search(spelling);
        let matchedTranslation = [];

        searchResult.forEach(translation => {
            if(spelling == translation.spelling) {
                matchedTranslation.push(translation);
            }
        });

        return matchedTranslation;
    }

    setDataByFile(file, messages, onLoaded = () => {}, onErrored = error => {}) {
        // 文字列などがドロップされた際は undefined が渡されるので弾く
        // プレーンテキスト形式でなければ弾く
        if(file === undefined || file.type != 'text/plain') {
            Popup.showNotification(messages.thisFileTypeIsNotSupported);
            return;
        }

        // BlobのデフォルトでUTF-8を使用する
        let properties = {
            type: "text/plain"
        };

        let blob = new Blob([ file ], properties);

        blob.text()
            .then(text => {
                // 読み込みが成功したらデータをパースする
                this.data = Dictionary.parseToData(text);
                onLoaded();
            })
            .catch(error => {
                onErrored(error);
            });
    }
}
