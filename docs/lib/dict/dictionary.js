class Dictionary {
    constructor(lang) {
        this.lang = lang;
        this.data = {};
        this.dictDataReady = false;
        this.langDataReady = false;

        this.load();
    }

    load() {
        let options = {
            dataType: 'json',
            timespan: 5000,
        };

        options.url = 'http://bazelinga.gant.work/docs/lib/dict/data/' + this.lang + '.json';

        // 辞書データを読み込み
        $.ajax(options)
            .done(data => {
                this.data = data;
                this.dictDataReady = true;
            })
            .fail((jqXHR, status, err) => {
                console.log('Failed to load dictionary data file.');
            });

        options.url = 'http://bazelinga.gant.work/docs/lib/dict/langs.json';

        // 言語データを読み込み
        $.ajax(options)
            .done(data => {
                this.langData = data;
                this.langDataReady = true;
            })
            .fail((jqXHR, status, err) => {
                console.log('Failed to load lang data file.');
            });
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

    updateWordList() {
        let $input = $('#searchInput');
        let $wordList = $('#wordList');
        let $wordListItem = $('.workarea-wordlist-item');

        if(!this.dictDataReady || !this.langDataReady) {
            alert('Please wait...');
            $input.val('');
            return;
        }

        $wordListItem.remove();
        let guideMsgs = this.langData[this.lang].guides;
        let keyword = this.formatSearchKeyword($input.val());

        if(keyword == '') {
            this.setGuideMessage(guideMsgs.displayResults, true);
            return;
        }

        let words = this.search(keyword);

        if(words.length == 0) {
            this.setGuideMessage(guideMsgs.wordNotFound, true);
            return;
        }

        this.setGuideMessage(guideMsgs.displayResults, false);
        this.addWordsToList(words);
    }

    addWordsToList(wordList) {
        let $input = $('#searchInput');
        let $list = $('#wordList');

        wordList.forEach(word => {
            word.translation.forEach(translation => {
                let wordClass = this.getTranslationClass(translation.class);

                // 単語リストに要素を追加
                let $elem = $('<div class="workarea-wordlist-item"></div>');
                $elem.append('<div class="workarea-wordlist-item-spell">' + word.spell + '</div>');
                $elem.append('<div class="workarea-wordlist-item-type">[' + this.getWordType(translation.type) + ']</div>');

                if(translation.class != 'general')
                    $elem.append('<div class="workarea-wordlist-item-class">[' + wordClass + ']</div>');

                $elem.append('<div class="workarea-wordlist-item-translation">' + translation.words.join(' ') + '</div>');

                // クリック時のスペル検索機能
                $elem.on('click', () => {
                    $input.val(word.spell);
                    // val() ではイベントが発火しないので手動で処理
                    $input.trigger('input');
                });

                $list.append($elem);
            });
        });
    }

    getTranslationClass(className) {
        let result = this.langData[this.lang]['classes'][className];

        if(result == undefined)
            return '?';

        return result;
    }

    getWordType(type) {
        let result = this.langData[this.lang]['types'][type];

        if(result == undefined)
            return '?';

        return result;
    }

    /*
     * 検索キーワードをフォーマットする
     * - - - - - - - - - -
     * keyword: フォーマットされる前のキーワード文字列
     * - - - - - - - - - -
     */
    formatSearchKeyword(keyword) {
        keyword = keyword.replace(/　/g, ' ');
        keyword = keyword.replace(/^ +/g, '');
        keyword = keyword.replace(/ {2,}/g, ' ');
        keyword = keyword.replace(/ +$/g, '');

        return keyword;
    }

    /*
     * ガイドメッセージを変更する
     * - - - - - - - - - -
     * showElem: setGuideVisible() に渡す値
     * - - - - - - - - - -
     */
    setGuideMessage(message, showElem = -1) {
        $('#wordListGuide').text(message);
        this.setGuideVisible(showElem);
    }

    /*
     * ガイドメッセージの表示/非表示を変更する
     * - - - - - - - - - -
     * showElem: ガイドメッセージを表示するかどうか
     *     true: 表示する
     *     false: 隠す
     *     その他: 変更しない (-1を推奨)
     * - - - - - - - - - -
     */
    setGuideVisible(showElem) {
        let $listGuide = $('#wordListGuide');

        if(showElem === true) {
            $listGuide.show();
        } else if(showElem === false) {
            $listGuide.hide();
        }
    }
}
