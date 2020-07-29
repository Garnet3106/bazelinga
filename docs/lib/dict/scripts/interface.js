class Interface {
    constructor(lang) {
        this.lang = lang;
        this.langPack = new LangPack(lang);
        this.dict = new Dictionary(this.langPack);
        // 選択された単語リストの項目の番号 (未選択: -1)
        this.selectedItemIndex = -1;

        this.langPack.load(() => {
            // ロード成功時
            let langData = this.langPack.getData();
            this.messages = langData.messages;
            this.wordClasses = langData.classes;
            this.wordTypes = langData.types;

            this.dict.load(() => {
                // ロード成功時
                this.init();
            }, (jqXHR, status, error) => {
                // ロード失敗時
                console.log('Failed to load data file.');
            });
        }, (jqXHR, status, error) => {
            // ロード失敗時
            console.log('Failed to load data file.');
        });
    }

    addPopupBottomButton($popup, message, onClicked = () => {}) {
        let $popupBottom = $popup.find('.popup-content-bottom');
        let $button = $('<div class="popup-content-bottom-button"></div>');

        $button.text(message);

        $button.on('click', () => {
            onClicked();
        })

        $popupBottom.append($button);
    }

    addPopupMainMessage($popup, message) {
        let $main = $popup.find('.popup-content-main');
        let $msg = $('<div class="popup-content-main-message"></div>');

        $msg.text(message);
        $main.append($msg);
    }

    addPopupTopIcon($popup, iconURI) {
        let $top = $popup.find('.popup-content-top');
        let $topIcon = $('<img class="popup-content-top-icon">');

        $topIcon.attr('src', iconURI);
        $top.append($topIcon);
    }

    addPopupTopTitle($popup, title) {
        let $top = $popup.find('.popup-content-top');
        let $topTitle = $('<div class="popup-content-top-title"></div>');

        $topTitle.text(title);
        $top.append($topTitle);
    }

    addWordsToList(wordList) {
        let $input = $('#searchInput');
        let $list = $('#wordList');

        wordList.forEach(word => {
            word.translation.forEach(translation => {
                let wordClass = this.wordClasses[translation.class];

                // 要素を生成・追加
                let $elem = $('<div class="workarea-wordlist-item"></div>');
                $elem.append('<div class="workarea-wordlist-item-spell">' + word.spell + '</div>');
                $elem.append('<div class="workarea-wordlist-item-type">[' + this.wordTypes[translation.type] + ']</div>');

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
        let $clipboardText = $('<div id="clipboardText">' + text + '</div>');
        $('#body').append($clipboardText);

        // DOM要素が必要なので getElementById() を使う
        getSelection().selectAllChildren(document.getElementById('clipboardText'));
        document.execCommand('copy');

        $clipboardText.remove();
    }

    hideGuideMessage() {
        $('#wordListGuide').hide();
    }

    /*
     * id
     *   すべて → 指定なし(undefined)
     *   指定する → メニューのエレメントID
     */
    hideMenu(id) {
        let $sideMenuItems;

        // 引数をもとに対象のメニューアイテムを取り出す
        if(id === undefined) {
            $sideMenuItems = $('.workarea-sidemenu-item');
        } else {
            $sideMenuItems = $('#' + id);
        }

        $sideMenuItems.each((itemIndex, item) => {
            let parentID = $(item).parent().attr('id');
            // 除外するインデックス = TopIconのインデックス (left: 0, right: 最後のインデックス)
            let exceptIndex = 0;

            if(parentID == 'leftMenu')
                exceptIndex = $(item).children().length - 1;

            $(item).children().each((iconIndex, icon) => {
                // インデックスが除外対象であればreturn
                if(iconIndex == exceptIndex)
                    return;

                $(icon).remove();
            });
        });
    }

    hidePopup($popup) {
        $popup.css('opacity', '0');

        setTimeout(() => {
            $popup.remove();
        }, 200);
    }

    init() {
        $(() => {
            let $searchInput = $('#searchInput');
            let $leftMenuAddTop = $('#leftMenuAddTop');
            let $leftMenuEditTop = $('#leftMenuEditTop');
            let $leftMenuRemoveTop = $('#leftMenuRemoveTop');
            let $rightMenuDocsTop = $('#rightMenuDocsTop');
            let $rightMenuShareTop = $('#rightMenuShareTop');

            $searchInput.on('input', () => { this.onSearchInputClicked() });
            $leftMenuAddTop.on('click', () => { this.showPopup($popup => { this.initAddPopup($popup) }) });
            $leftMenuEditTop.on('click', () => { this.onEditTopClicked() });
            $leftMenuRemoveTop.on('click', () => { this.onRemoveTopClicked() });
            $rightMenuDocsTop.on('click', () => { this.onDocsTopClicked() });
            $rightMenuShareTop.on('click', () => { this.onShareTopClicked() });

            this.setSideMenuObserver();
            this.setInitialKeyword();
        });
    }

    initAddPopup($popup) {
        let $main = $popup.find('.popup-content-main');

        let title = this.messages.wordAddition;
        let iconURI = '../../../lib/dict/img/add.svg';

        this.addPopupTopIcon($popup, iconURI);
        this.addPopupTopTitle($popup, title);

        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        // { メッセージ名: IDの末尾, ... }
        let inputItems = { 'spell': 'Spell', 'ipa': 'IPA', 'type': 'Type' };

        for(let key in inputItems) {
            let pairID = 'popupAddInputArea' + inputItems[key];
            let $pair = $('<div class="popup-content-main-inputarea-pair" id="' + pairID + '">');
            $pair.append('<div id="' + pairID + 'Name">' + this.messages[key] + '</div>');
            $pair.append('<input id="' + pairID + 'Input">');
            $inputArea.append($pair);
            $inputArea.append('<br>');
        }

        // 最後の改行はいらないので削除
        $inputArea.find('br:last').remove();
        $main.append($inputArea);

        this.addPopupBottomButton($popup, this.messages.back, () => {
            this.showConfirmationPopup(this.messages.closeConfirm, () => {
                // Yesの場合
                this.hidePopup($popup);
            });
        });

        this.addPopupBottomButton($popup, this.messages.add, () => {
            // 単語の追加処理
        });
    }

    onDocsTopClicked() {
        if(this.selectedItemIndex == -1)
            return;

        location.href = this.dict.getDocsURI(this.selectedItemIndex);
    }

    onEditTopClicked() {}

    onRemoveTopClicked() {}

    onSearchInputClicked() {
        this.updateWordList();
    }

    onShareTopClicked() {
        let $rightMenuShare = $('#rightMenuShare');

        // アイコンがすでに表示されている場合は閉じる
        if($rightMenuShare.children().length > 1) {
            this.hideMenu('rightMenuShare');
            return;
        }

        if(this.selectedItemIndex == -1)
            return;

        let $linkShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareLink"></div>');
        let $twitterShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareTwitter"></div>');

        $linkShareIcon.on('click', () => {
            // ドキュメントURLをクリップボードにコピー
            this.copyToClipboard(this.dict.getDocsURI(this.selectedItemIndex));
            this.hideMenu('rightMenuShare');
            this.showNoticePopup(this.messages.copiedToClipboard);
        });

        $twitterShareIcon.on('click', () => {
            // Twitterのシェアリンクを新規タブで開く
            open(this.dict.getTwitterShareLink(this.selectedItemIndex));
            this.hideMenu('rightMenuShare');
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

        let $sideMenuItems = $('.workarea-sidemenu-item');
        let $sideMenuIcons = $('.workarea-sidemenu-item-icon');
        $sideMenuItems.css('background-color', '#ffffff');
        $sideMenuIcons.css('cursor', 'default');

        this.selectedItemIndex = index;
    }

    setInitialKeyword() {
        let uriHash = location.hash;

        if(uriHash == '')
            return;

        let $searchInput = $('#searchInput');
        // URIの'#'を取り除いてデコード
        let keyword = decodeURI(uriHash.substring(1));

        $searchInput.val(keyword);
        // val() ではイベントが発火しないので手動で処理
        $searchInput.trigger('input');
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

    showNoticePopup(message, onOKClicked = () => {}) {
        this.showPopup($popup => {
            let iconURI = '../../../lib/dict/img/notice.svg';
            this.addPopupTopIcon($popup, iconURI);
            this.addPopupMainMessage($popup, message);

            this.addPopupBottomButton($popup, this.messages.ok, () => {
                this.hidePopup($popup);
                onOKClicked();
            });
        });
    }

    showConfirmationPopup(message, onYesClicked = () => {}, onNoClicked = () => {}) {
        this.showPopup($popup => {
            let iconURI = '../../../lib/dict/img/question.svg';
            this.addPopupTopIcon($popup, iconURI);
            this.addPopupMainMessage($popup, message);

            this.addPopupBottomButton($popup, this.messages.no, () => {
                this.hidePopup($popup);
                onNoClicked();
            });

            this.addPopupBottomButton($popup, this.messages.yes, () => {
                this.hidePopup($popup);
                onYesClicked();
            });
        });
    }

    showGuideMessage() {
        $('#wordListGuide').show();
    }

    showPopup(onReady = $popup => {}) {
        // 初期化中に表示させないためにポップアップのスタイルは display: none に設定してある
        let $popup = $('<div class="popup"></div>');
        let $content = $('<div class="popup-content"></div>');
        let $top = $('<div class="popup-content-top"></div>');
        let $main = $('<div class="popup-content-main"></div>');
        let $bottom = $('<div class="popup-content-bottom" id="popupBottom"></div>');

        $content.append($top);
        $content.append($main);
        $content.append($bottom);
        $popup.append($content);

        onReady($popup);

        $('#body').append($popup);
        $popup.css('display', 'flex');

        // なぜか直後だとアニメーションされないのでtimeoutをもうける
        setTimeout(() => {
            $popup.css('opacity', '1');
        }, 50);
    }

    unslectListItem() {
        let $items = $('.workarea-wordlist-item');
        $items.css('background-color', '#ffffff');

        let $sideMenuItems = $('.workarea-sidemenu-item');
        let $sideMenuIcons = $('.workarea-sidemenu-item-icon');
        $sideMenuItems.css('background-color', '#dddddd');
        $sideMenuIcons.css('cursor', 'not-allowed');

        this.selectedItemIndex = -1;
    }

    updateWordList() {
        let $searchInput = $('#searchInput');
        let $wordListItem = $('.workarea-wordlist-item');

        // データの読み込みが未完了の場合はアラートを表示
        if(!this.dict.ready || !this.langPack.ready) {
            this.showNoticePopup(this.messages.pleaseWait);
            // 入力された文字列を残さない
            $searchInput.val('');
            return;
        }

        $wordListItem.remove();
        this.unslectListItem();

        let keyword = this.dict.formatSearchKeyword($searchInput.val());

        if(keyword == '') {
            this.setGuideMessage(this.messages.displayResults);
            this.showGuideMessage();
            return;
        }

        let words = this.dict.search(keyword);

        if(words.length == 0) {
            this.setGuideMessage(this.messages.wordNotFound);
            this.showGuideMessage();
            return;
        }

        this.setGuideMessage(this.messages.displayResults);
        this.hideGuideMessage();
        this.addWordsToList(words);
    }
}
