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

    hideConfirmPopup() {
        let $confirm = $('#confirm');
        $confirm.css('opacity', '0');

        setTimeout(() => {
            $confirm.remove();
        }, 200);
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

    hidePopup() {
        let $popup = $('#popup');
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
            $leftMenuAddTop.on('click', () => { this.showPopup(() => { this.initAddPopup() }) });
            $leftMenuEditTop.on('click', () => { this.onEditTopClicked() });
            $leftMenuRemoveTop.on('click', () => { this.onRemoveTopClicked() });
            $rightMenuDocsTop.on('click', () => { this.onDocsTopClicked() });
            $rightMenuShareTop.on('click', () => { this.onShareTopClicked() });

            this.setSideMenuObserver();
            this.setInitialKeyword();
        });
    }

    initAddPopup() {
        let $popupTitle = $('#popupTopTitle');
        let $popupIcon = $('#popupTopIcon');
        let $popupContent = $('#popupContent');

        let iconURI = '../../../lib/dict/img/add.svg';
        $popupTitle.text(this.messages.wordAddition);
        $popupIcon.attr('src', iconURI);

        let $inputArea = $('<div class="popup-content-add-inputarea" id="popupAddInputArea"></div>');

        // { メッセージ名: IDの末尾, ... }
        let inputItems = { 'spell': 'Spell', 'ipa': 'IPA', 'type': 'Type' };

        for(let key in inputItems) {
            let pairID = 'popupAddInputArea' + inputItems[key];
            let $pair = $('<div class="popup-content-add-inputarea-pair" id="' + pairID + '">');
            $pair.append('<div id="' + pairID + 'Name">' + this.messages[key] + '</div>');
            $pair.append('<input id="' + pairID + 'Input">');
            $inputArea.append($pair);
            $inputArea.append('<br>');
        }

        // 最後の改行はいらないので削除
        $inputArea.find('br:last').remove();
        $popupContent.append($inputArea);

        let $popupBottom = $('#popupBottom');
        let $backButton = $('<div class="popup-button" id="popupBackButton">' + this.messages.back + '</div>');
        let $addButton = $('<div class="popup-button" id="popupAddButton">' + this.messages.add + '</div>');

        $backButton.on('click', () => {
            this.showConfirmPopup(() => {
                // Yesの場合
                this.hidePopup();
            });
        });

        $backButton.on('click', () => {
            // 単語の追加処理
        });

        $popupBottom.append($backButton);
        $popupBottom.append($addButton);
    }

    onDocsTopClicked() {
        if(this.selectedItemIndex == -1) {
            alert(this.messages.selectWords);
            return;
        }

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

        if(this.selectedItemIndex == -1) {
            alert(this.messages.selectWords);
            return;
        }

        let $linkShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareLink"></div>');
        let $twitterShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareTwitter"></div>');

        $linkShareIcon.on('click', () => {
            // ドキュメントURLをクリップボードにコピー
            this.copyToClipboard(this.dict.getDocsURI(this.selectedItemIndex));
            this.hideMenu('rightMenuShare');
            alert(this.messages.copiedToClipboard);
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

    showConfirmPopup(onYesClicked = () => {}, onNoClicked = () => {}) {
        let $confirm = $('<div class="popup" id="confirm"></div>');
        let $confirmMain = $('<div class="popup-main"></div>');

        let $confirmTop = $('<div class="popup-top"></div>');
        let $confirmTopTitle = $('<div class="popup-top-title"></div>');
        let $confirmTopIcon = $('<img class="popup-top-icon">');

        let $confirmContent = $('<div class="popup-content"></div>');
        let $confirmMessage = $('<div class="popup-content-message"></div>');

        let $confirmBottom = $('<div class="popup-bottom" id="confirmBottom"></div>');
        let $yesButton = $('<div class="popup-button" id="confirmButtonYes">Yes</div>');
        let $noButton = $('<div class="popup-button" id="confirmButtonNo">No</div>');

        $yesButton.on('click', () => {
            this.hideConfirmPopup();
            onYesClicked();
        });

        $noButton.on('click', () => {
            this.hideConfirmPopup();
            onNoClicked();
        });

        let iconURI = '../../../lib/dict/img/question.svg';
        $confirmTopIcon.attr('src', iconURI);
        $confirmTop.append($confirmTopIcon);
        $confirmMain.append($confirmTop);

        $confirmMessage.text(this.messages.closeConfirm);
        $confirmContent.append($confirmMessage);
        $confirmMain.append($confirmContent);

        // 追加する順番は No → Yes
        $confirmBottom.append($noButton);
        $confirmBottom.append($yesButton);
        $confirmMain.append($confirmBottom);

        $confirm.append($confirmMain);
        $('#body').append($confirm);
        $confirm.css('display', 'flex');

        // なぜか直後だとアニメーションされないのでtimeoutをもうける
        setTimeout(() => {
            $confirm.css('opacity', 1);
        }, 50);
    }

    showGuideMessage() {
        $('#wordListGuide').show();
    }

    showPopup(onReady = () => {}) {
        // 初期化中に表示させないためにポップアップのスタイルは display: none に設定してある
        let $popup = $('<div class="popup" id="popup"></div>');

        let $popupMain = $('<div class="popup-main"></div>');

        let $popupTop = $('<div class="popup-top"></div>');
        let $popupTopTitle = $('<div class="popup-top-title" id="popupTopTitle"></div>');
        let $popupTopIcon = $('<img class="popup-top-icon" id="popupTopIcon">');

        let $popupContent = $('<div class="popup-content" id="popupContent"></div>');

        let $popupBottom = $('<div class="popup-bottom" id="popupBottom"></div>');

        $popupTop.append($popupTopIcon);
        $popupTop.append($popupTopTitle);

        $popupMain.append($popupTop);
        $popupMain.append($popupContent);
        $popupMain.append($popupBottom);

        $popup.append($popupMain);
        $('#body').append($popup);

        onReady();
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
            alert('Please wait...');
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
