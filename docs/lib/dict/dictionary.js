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
        let $list = $('#wordList');
        let $listItem = $('.wordlist-item');
        let $listGuide = $('#wordListGuide');

        if(!this.dictDataReady || !this.langDataReady) {
            alert('しばらくお待ち下さい...');
            $input.val('');
            return false;
        }

        $listItem.remove();
        let keyword = $input.val();

        // 余分な全角/半角スペースを削除
        keyword = keyword.replace(/　/g, ' ');
        keyword = keyword.replace(/^ +/g, '');
        keyword = keyword.replace(/ {2,}/g, ' ');
        keyword = keyword.replace(/ +$/g, '');

        if(keyword == '') {
            this.setGuideMessage('ここに検索結果が表示されます。', true);
            return true;
        }

        let wordList = this.search(keyword);

        if(wordList.length == 0) {
            this.setGuideMessage('単語が見つかりませんでした。', true);
            return;
        }

        this.setGuideMessage('ここに検索結果が表示されます。', false);

        wordList.forEach(word => {
            word.translation.forEach(translation => {
                let wordClass = this.getTranslationClass(translation.class);

                // 単語リストに要素を追加
                let elem = $('<div class="wordlist-item"></div>');
                elem.append('<div class="wordlist-item-spell">' + word.spell + '</div>');
                elem.append('<div class="wordlist-item-type">[' + this.getWordType(translation.type) + ']</div>');

                if(translation.class != 'general')
                    elem.append('<div class="wordlist-item-class">[' + wordClass + ']</div>');

                elem.append('<div class="wordlist-item-translation">' + translation.words.join(' ') + '</div>');

                // クリック時のスペル検索機能
                elem.on('click', () => {
                    let input = $input;
                    input.val(word.spell);
                    // val() ではイベントが発火しないので手動で処理
                    input.trigger('input');
                });

                $list.append(elem);
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
