/*
 * 辞書検索のインタフェース周りを扱う
 */
class Interface {
    constructor(lang) {
        this.dict = new Dictionary(lang);
        this.lang = lang;
        // 選択された単語リストの項目の番号 (未選択: -1)
        this.selectedItemIndex = -1;

        this.dict.load(() => {
            // ロード成功時
            this.init();
        }, (jqXHR, status, error) => {
            console.log('Failed to load data file.');
        });
    }

    addWordsToList(wordList) {
        let $input = $('#searchInput');
        let $list = $('#wordList');

        wordList.forEach(word => {
            word.translation.forEach(translation => {
                let wordClass = this.dict.getTranslationClass(translation.class);

                // 要素を生成・追加
                let $elem = $('<div class="workarea-wordlist-item"></div>');
                $elem.append('<div class="workarea-wordlist-item-spell">' + word.spell + '</div>');
                $elem.append('<div class="workarea-wordlist-item-type">[' + this.dict.getWordType(translation.type) + ']</div>');

                if(translation.class != 'general')
                    $elem.append('<div class="workarea-wordlist-item-class">[' + wordClass + ']</div>');

                $elem.append('<div class="workarea-wordlist-item-translation">' + translation.words.join(' ') + '</div>');

                // イベントを設定
                $elem.on('click', elem => {
                    let formattedKeyword = this.dict.formatSearchKeyword($input.val());

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

    copyToClipboard(text) {
        $clipboardText = $('<div id="clipboardText">' + text + '</div>');
        $('#body').append($clipboardText);
        // DOM要素が必要なので getElementById() を使う
        getSelection().selectAllChildren(document.getElementById('clipboardText'));
        document.execCommand('copy');
        $clipboardText.remove();
    }

    hideGuideMessage() {
        $('#wordListGuide').hide();
    }

    hideShareMenu() {
        let $rightMenuShare = $('#rightMenuShare');
        $rightMenuShare.children('#rightMenuShareLink').remove();
        $rightMenuShare.children('#rightMenuShareTwitter').remove();
    }

    init() {
        $(() => {
            let $searchInput = $('#searchInput');
            let $rightMenuDocsTop = $('#rightMenuDocsTop');
            let $rightMenuShareTop = $('#rightMenuShareTop');

            $searchInput.on('input', () => { this.onSearchInputClicked() });
            $rightMenuDocsTop.on('click', () => { this.onDocsTopClicked() });
            $rightMenuShareTop.on('click', () => { this.onShareTopClicked() });

            this.setSideMenuObserver();
        });
    }

    onDocsTopClicked() {
        if(this.dict.selectedItemIndex == -1) {
            alert('単語を選択してください。');
            return;
        }

        location.href = this.dict.getDocsURI();
    }

    onSearchInputClicked() {
        this.updateWordList();
    }

    onShareTopClicked() {
        let $rightMenuShare = $('#rightMenuShare');

        // アイコンがすでに表示されている場合は閉じる
        if($rightMenuShare.children().length > 1) {
            this.hideShareMenu();
            return;
        }

        if(this.selectedItemIndex == -1) {
            alert('単語を選択してください。');
            return;
        }

        let $linkShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareLink"></div>');
        let $twitterShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareTwitter"></div>');

        $linkShareIcon.on('click', () => {
            // ドキュメントURLをクリップボードにコピー
            this.copyToClipboard(this.getDocsURI());
            this.hideShareMenu();
            alert('クリップボードにコピーしました。');
        });

        $twitterShareIcon.on('click', () => {
            // Twitterのシェアリンクを新規タブで開く
            open(this.getTwitterShareLink());
            this.hideShareMenu();
        });

        $rightMenuShare.append($linkShareIcon);
        $rightMenuShare.append($twitterShareIcon);
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

    setGuideMessage(message) {
        $('#wordListGuide').text(message);
    }

    setSideMenuObserver() {
        // サイドメニューの変更イベントを監視
        this.sideMenuObserver = new MutationObserver(event => {
            let $target = $(event[0].target);

            // 横幅をアニメーションをつけて操作する
            $target.animate({
                width: $target.children().length * 40
            }, 500);
        });

        let options = {
            childList: true
        };

        $('.workarea-sidemenu-item').each((i, elem) => {
            this.sideMenuObserver.observe(elem, options);
        });
    }

    showGuideMessage() {
        $('#wordListGuide').show();
    }

    unslectListItem() {
        let $items = $('.workarea-wordlist-item');
        $items.css('background-color', '#ffffff');

        this.selectedItemIndex = -1;
    }

    updateWordList() {
        let $searchInput = $('#searchInput');
        let $wordListItem = $('.workarea-wordlist-item');

        // データの読み込みが未完了の場合はアラートを表示
        if(!this.dict.dataReady) {
            alert('Please wait...');
            // 入力された文字列を残さない
            $searchInput.val('');
            return;
        }

        $wordListItem.remove();
        this.unslectListItem();

        let guideMsgs = this.dict.langData[this.lang].guides;
        let keyword = this.dict.formatSearchKeyword($searchInput.val());

        if(keyword == '') {
            this.setGuideMessage(guideMsgs.displayResults);
            this.showGuideMessage();
            return;
        }

        let words = this.dict.search(keyword);

        if(words.length == 0) {
            this.setGuideMessage(guideMsgs.wordNotFound);
            this.showGuideMessage();
            return;
        }

        this.setGuideMessage(guideMsgs.displayResults);
        this.hideGuideMessage();
        this.addWordsToList(words);
    }
}
