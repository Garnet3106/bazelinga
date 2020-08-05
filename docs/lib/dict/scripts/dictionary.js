'use strict';


class Dictionary {
    constructor(lang) {
        this.data = {};
        this.lang = lang;
        this.ready = false;
    }

    addWord(spelling, ipa, translation) {
        let word = {};

        word.spelling = spelling;
        word.ipa = ipa;
        word.translation = translation;

        this.data.dict.push(word);
    }

    formatSearchKeyword(keyword) {
        keyword = keyword.replace(/　/g, ' ');
        keyword = keyword.replace(/^ +/g, '');
        keyword = keyword.replace(/ {2,}/g, ' ');
        keyword = keyword.replace(/ +$/g, '');

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

    load(succeeded = () => {}, failed = error => {}) {
        let uri = 'http://bazelinga.gant.work/docs/lib/dict/data/' + this.lang + '.json';

        let options = {
            dataType: 'json',
            timespan: 5000,
            url: uri
        };

        $.ajax(options)
            .done(data => {
                // ロード成功時
                this.data = data;
                this.ready = true;

                succeeded();
            })
            .fail(error => {
                // ロード失敗時
                failed(error);
            });
    }

    removeWord(wordIndex) {
        this.data.dict.splice(wordIndex, 1);
    }

    search(keyword) {
        let matchedWords = [];
        let loweredKeyword = keyword.toLowerCase();

        this.data.dict.forEach((word, wordIndex) => {
            let matched = false;

            if(word.spelling.includes(loweredKeyword))
                matched = true;

            // 発音記号は大文字と小文字を区別することがあるので toLowerCase() をしない
            if(word.ipa.includes(keyword))
                matched = true;

            // word のコピーを作成する (参照渡し防止)
            let tmpWord = $.extend(true, {}, word);
            let tmpTranslationList = [];

            tmpWord.index = wordIndex;

            word.translation.forEach((translation, translationIndex) => {
                // スペルなどがマッチしていた場合はデフォルトでtrue
                let matchedTranslationWord = matched;

                if(!matchedTranslationWord) {
                    translation.words.forEach(translationWords => {
                        if(translationWords.includes(loweredKeyword)) {
                            matchedTranslationWord = true;
                        }
                    });
                }

                if(matchedTranslationWord) {
                    let tmpTranslation = $.extend(true, {}, translation);
                    tmpTranslation.index = translationIndex;
                    tmpTranslationList.push(tmpTranslation);
                }
            });

            if(tmpTranslationList.length != 0) {
                tmpWord.translation = tmpTranslationList;
                matchedWords.push(tmpWord);
            }
        });

        return matchedWords;
    }

    searchSpelling(spelling) {
        let searchResult = this.search(spelling);
        let matchedWord = {};

        searchResult.forEach(word => {
            if(spelling == word.spelling) {
                matchedWord = word;
            }
        });

        return matchedWord;
    }

    setDataByFile(file, messages, onLoaded, onErrored) {
        // JSON形式でなければ弾く
        if(file.type != 'application/json') {
            Popup.showNotification(messages.thisFileTypeIsNotSupported);
            return;
        }

        // BlobのデフォルトでUTF-8を使用する
        var properties = {
            type: "application/json"
        };

        let blob = new Blob([ file ], properties);

        blob.text()
            .then(text => {
                // 読み込みが成功したらJSONをパースする
                let jsonData;

                try {
                    jsonData = JSON.parse(text);
                } catch(error) {
                    let jsonErrorMessage = langData.messages.failedToConvertTheJSONData + '<br>[' + error.message + ']';
                    Popup.showNotification(jsonErrorMessage);
                    return;
                }

                this.data = jsonData;
                onLoaded();
            })
            .catch(error => {
                onErrored(error);
            });
    }
}
