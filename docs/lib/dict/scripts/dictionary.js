class Dictionary {
    constructor(lang) {
        this.lang = lang;
        this.data = {};
        this.dataReady = false;
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
        let spell = $item.children('.workarea-wordlist-item-spell').eq(0).text();
        let dictURI = 'http://bazelinga.gant.work/docs/' + this.lang + '/dict/words/' + spell + '/';

        return dictURI;
    }

    getTranslationClass(className) {
        let result = this.langData[this.lang]['classes'][className];

        if(result == undefined)
            return '?';

        return result;
    }

    getTwitterShareLink(index) {
        let $item = $('.workarea-wordlist-item').eq(index);
        let spell = $item.children('.workarea-wordlist-item-spell').text();

        let relatedAccount = 'Garnet3106';

        let string = 'BazeLinga \'' + spell + '\'';
        let link = 'http://bazelinga.gant.work/docs/' + this.lang + '/dict/search/#' + spell;
        let mention = '@bazelinga';
        let hashtag = '#bazelinga';

        // encodeURI() でシャープ記号がエンコードされないので手動で置換する
        let text = encodeURI(string + '\n\n' + link + '\n' + mention + ' ' + hashtag).replace(/#/g, '%23');

        return 'https://twitter.com/share?related=' + relatedAccount + '&text=' + text;
    }

    getWordType(type) {
        let result = this.langData[this.lang]['types'][type];

        if(result == undefined)
            return '?';

        return result;
    }

    load(succeeded = () => {}, failed = (jqXHR, status, error) => {}) {
        let dictDataURI = 'http://bazelinga.gant.work/docs/lib/dict/data/' + this.lang + '.json';

        this.loadJsonData(dictDataURI, data => {
            // ロード成功時
            this.data = data;
            let langDataURI = 'http://bazelinga.gant.work/docs/lib/dict/data/langs.json';

            this.loadJsonData(langDataURI, data => {
                // ロード成功時
                this.langData = data;
                this.dataReady = true;
                succeeded();
            }, (jqXHR, status, error) => {
                // ロード失敗時
                failed(jqXHR, status, error);
            });
        }, (jqXHR, status, error) => {
            // ロード失敗時
            failed(jqXHR, status, error);
        });
    }

    loadJsonData(uri, succeeded = data => {}, failed = (jqXHR, status, error) => {}) {
        let options = {
            dataType: 'json',
            timespan: 5000,
            url: uri
        };

        $.ajax(options)
            .done(succeeded)
            .fail(failed);
    }

    search(keyword) {
        let matchedWords = [];
        let loweredKeyword = keyword.toLowerCase();

        this.data.dict.forEach(word => {
            let matched = false;

            if(word.spell.includes(loweredKeyword))
                matched = true;

            // 発音記号は大文字と小文字を区別することがあるので toLowerCase() をしない
            if(word.ipa.includes(keyword))
                matched = true;

            if(matched) {
                matchedWords.push(word);
            } else {
                // word のコピーを作成する (参照渡し防止)
                let tmpWord = $.extend(true, {}, word);
                let tmpTranslation = [];

                word.translation.forEach(translation => {
                    let matchedTranslationWord = false;

                    translation.words.forEach(translationWords => {
                        if(translationWords.includes(loweredKeyword)) {
                            matchedTranslationWord = true;
                        }
                    });

                    if(matchedTranslationWord)
                        tmpTranslation.push(translation);
                });

                if(tmpTranslation.length >= 1) {
                    tmpWord.translation = tmpTranslation;
                    matchedWords.push(tmpWord);
                }
            }
        });

        return matchedWords;
    }
}
