class Dictionary {
    constructor(langPack) {
        this.data = {};
        this.lang = langPack.lang;
        this.langPack = langPack;
        this.ready = false;
    }

    addWord(spell, ipa, translation) {
        let word = {};

        word.spell = spell;
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
        let spell = $item.children('.workarea-wordlist-item-spell').eq(0).text();
        let dictURI = 'http://bazelinga.gant.work/docs/' + this.lang + '/dict/words/' + spell + '/';

        return dictURI;
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

    load(succeeded = () => {}, failed = (jqXHR, status, error) => {}) {
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
            .fail((jqXHR, status, error) => {
                // ロード失敗時
                failed(jqXHR, status, error);
            });
    }

    search(keyword) {
        let matchedWords = [];
        let loweredKeyword = keyword.toLowerCase();

        this.data.dict.forEach((word, wordIndex) => {
            let matched = false;

            if(word.spell.includes(loweredKeyword))
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
}
