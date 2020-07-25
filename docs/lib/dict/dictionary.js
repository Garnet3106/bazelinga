class Dictionary {
    constructor(lang) {
        this.lang = lang;
        this.data = {};
        this.dictDataReady = false;
        this.langDataReady = false;
        // 選択された単語リストの項目の番号 (未選択: -1)
        this.selectedItemIndex = -1;

        this.load();
    }

    load() {
        let options = {
            dataType: 'json',
            timespan: 5000,
        };

        options.url = 'http://bazelinga.gant.work/docs/lib/dict/data/' + this.lang + '.json';

        // 辞書データを読み込む
        $.ajax(options)
            .done(data => {
                this.data = data;
                this.dictDataReady = true;
            })
            .fail((jqXHR, status, err) => {
                console.log('Failed to load dictionary data file.');
            });

        options.url = 'http://bazelinga.gant.work/docs/lib/dict/langs.json';

        // 言語データを読み込む
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

    selectListItem(index) {
        let $items = $('.workarea-wordlist-item');

        if(index >= $items.length)
            return;

        // 選択する前に他の選択を解除
        this.unslectListItem();

        $items.eq(index).css('background-color', '#dddddd');
        this.selectedItemIndex = index;
    }

    unslectListItem() {
        let $items = $('.workarea-wordlist-item');
        // return回避のため事前にindexを設定
        this.selectedItemIndex = -1;

        $items.css('background-color', '#ffffff');
    }

    updateWordList() {
        let $input = $('#searchInput');
        let $wordListItem = $('.workarea-wordlist-item');

        // データの読み込みが未完了の場合はアラートを表示
        if(!this.dictDataReady || !this.langDataReady) {
            alert('Please wait...');
            // 入力された文字列を残さない
            $input.val('');
            return;
        }

        $wordListItem.remove();
        this.unslectListItem();

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

                // 要素を生成・追加
                let $elem = $('<div class="workarea-wordlist-item"></div>');
                $elem.append('<div class="workarea-wordlist-item-spell">' + word.spell + '</div>');
                $elem.append('<div class="workarea-wordlist-item-type">[' + this.getWordType(translation.type) + ']</div>');

                if(translation.class != 'general')
                    $elem.append('<div class="workarea-wordlist-item-class">[' + wordClass + ']</div>');

                $elem.append('<div class="workarea-wordlist-item-translation">' + translation.words.join(' ') + '</div>');

                // イベントを設定
                $elem.on('click', elem => {
                    let formattedKeyword = this.formatSearchKeyword($input.val());

                    // キーワードが異なる場合のみvalueを変更
                    if(formattedKeyword != word.spell) {
                        $input.val(word.spell);
                        // val() ではイベントが発火しないので手動で処理
                        $input.trigger('input');
                    } else {
                        let $item = $($(elem.target)).eq(0);

                        if($item.attr('class') != 'workarea-wordlist-item')
                            $item = $item.parent();

                        let index = $item.index();
                        this.selectListItem(index - 1);
                    }
                });

                $list.append($elem);
            });
        });
    }

    /*
     * 検索キーワードをもとにドキュメントのURIを取得する
     */
    getDocsURI() {
        let $item = $('.workarea-wordlist-item').eq(this.selectedItemIndex);
        let spell = $item.find('.workarea-wordlist-item-spell').text();
        //let dictURI = location.protocol + '://' + location.host + '/' + location.pathname;
        let dictURI = 'http://bazelinga.gant.work/docs/' + this.lang + '/dict/words/' + spell + '/';

        return dictURI;
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
