class Interface {
    constructor(lang) {
        this.lang = lang;
        this.langPack = new LangPack(lang);
        this.dict = new Dictionary(this.langPack);
        // 選択された単語リストの項目の番号 (未選択時: -1)
        this.selectedItemIndex = -1;
        // 最後に選択された単語リストの項目のID (未選択時: 空文字)
        this.latestSelectedItemID = '';

        this.langPack.load(() => {
            // ロード成功時
            let langData = this.langPack.getData();
            this.messages = langData.messages;
            this.translationClasses = langData.classes;
            this.translationTypes = langData.types;

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
                let wordClass = this.translationClasses[translation.class];

                // 要素を生成・追加
                let $elem = $('<div class="workarea-wordlist-item"></div>');
                $elem.attr('id', 'wordListItem_' + word.index + '_' + translation.index);

                let $elemSpell = $('<div class="workarea-wordlist-item-spell"></div>');
                let $elemType = $('<div class="workarea-wordlist-item-type"></div>');

                $elemSpell.text(word.spell);
                $elemType.text('[' + this.translationTypes[translation.type] + ']');

                $elem.append($elemSpell);
                $elem.append($elemType);

                if(translation.class != 'general') {
                    let $elemClass = $('<div class="workarea-wordlist-item-class"></div>');
                    $elemClass.text('[' + wordClass + ']');
                    $elem.append($elemClass);
                }

                let $elemTranslation = $('<div class="workarea-wordlist-item-translation"></div>');
                $elemTranslation.text(translation.words.join(', '));
                $elem.append($elemTranslation);

                // クリックイベントを設定
                $elem.on('click', elem => {
                    let $target = $(elem.target);
                    let formattedKeyword = this.formatSearchKeyword($input.val());

                    let $item = $target.eq(0);

                    if($item.attr('class') != 'workarea-wordlist-item')
                        $item = $item.parent();

                    let index = $item.index() - 1;

                    // 選択済みの項目がクリックされた場合
                    if($item.attr('id') == this.latestSelectedItemID) {
                        this.unslectListItem();
                        return;
                    }

                    this.selectListItem(index);

                    // キーワードが変更された場合のみ入力欄のvalueを変更
                    if(formattedKeyword != word.spell) {
                        $input.val(word.spell);
                        // val() ではイベントが発火しないので手動で処理
                        $input.trigger('input');
                    }
                });

                $list.append($elem);
            });
        });

        if(this.latestSelectedItemID != '') {
            let $latestSelectedItem = $('#' + this.latestSelectedItemID);
            let index = $latestSelectedItem.index() - 1;

            // インデックスからは1を引かれてるので注意
            if(index >= -1 && $latestSelectedItem.length == 1) {
                this.selectListItem(index);
            }
        }
    }

    copyToClipboard(text) {
        let $clipboardText = $('<div id="clipboardText">' + text + '</div>');
        $('#body').append($clipboardText);

        // DOM要素が必要なので getElementById() を使う
        getSelection().selectAllChildren(document.getElementById('clipboardText'));
        document.execCommand('copy');

        $clipboardText.remove();
    }

    formatSearchKeyword(keyword) {
        return this.dict.formatSearchKeyword(keyword);
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
            this.initEvents();
            this.setSideMenuObserver();
            this.setInitialKeyword();

            let $leftMenuAddTop = $('#leftMenuAdd').children('.workarea-sidemenu-item-icon');
            $leftMenuAddTop.css('cursor', 'pointer');
        });
    }

    initEvents() {
        $('#searchInput').on('input', () => {
            this.onSearchKeywordInput();
        });

        $('#leftMenuAddTop').on('click', () => {
            this.showPopup($popup => {
                this.initAddPopup($popup);
            });
        });

        $('#leftMenuEditTop').on('click', () => {
            this.onEditTopClicked();
        });

        $('#leftMenuRemoveTop').on('click', () => {
            this.onRemoveTopClicked();
        });

        $('#rightMenuDocsTop').on('click', () => {
            this.onDocsTopClicked();
        });

        $('#rightMenuShareTop').on('click', () => {
            this.onShareTopClicked();
        });
    }

    initAddPopup($popup) {
        let $main = $popup.find('.popup-content-main');

        let title = this.messages.wordAddition;
        let iconURI = '../../../lib/dict/img/add.svg';

        this.addPopupTopIcon($popup, iconURI);
        this.addPopupTopTitle($popup, title);

        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        let addInputAreaPair = (name, $pairInput) => {
            let $pair = $('<div class="popup-content-main-inputarea-pair">');

            let $pairName = $('<div></div>');
            $pairName.text(this.messages[name]);
            $pair.append($pairName);

            $pairInput.attr('name', name);
            $pair.append($pairInput);

            $inputArea.append($pair);
        };

        let $spellInput = $('<input>');

        $spellInput.on('input', () => {
            let formattedSpell = this.formatSearchKeyword($spellInput.val());
            let searchResult = this.dict.searchSpell(formattedSpell);
            let backColor = '#ffffff';

            if(Object.keys(searchResult).length)
                backColor = '#ffdddd';

            $spellInput.css('background-color', backColor);
        });

        addInputAreaPair('spell', $spellInput);
        addInputAreaPair('ipa', $('<input>'));

        $main.append($inputArea);

        let translation = [];

        // 戻るボタン
        this.addPopupBottomButton($popup, this.messages.back, () => {
            this.showConfirmationPopup(this.messages.closeConfirm, () => {
                // Yesの場合
                this.hidePopup($popup);
            });
        });

        // 翻訳ボタン
        this.addPopupBottomButton($popup, this.messages.trans, () => {
            this.showPopup($popup => {
                this.initAddPopup_translationPopup($popup, data => {
                    translation = data;
                });
            });
        });

        // 追加ボタン
        this.addPopupBottomButton($popup, this.messages.add, () => {
            let $input_spell = $inputArea.find('[name=spell]').eq(0);
            let $input_ipa = $inputArea.find('[name=ipa]').eq(0);

            let spell = this.formatSearchKeyword($input_spell.val());
            let ipa = this.formatSearchKeyword($input_ipa.val());

            if(Object.keys(this.dict.searchSpell(spell)).length) {
                this.showNoticePopup(this.messages.spellIsDuplicated);
                return;
            }

            if(spell == '' || ipa == '') {
                this.showNoticePopup(this.messages.inputItemLacks);
                return;
            }

            if(translation.length == 0) {
                this.showNoticePopup(this.messages.translationNotInputted);
                return;
            }

            this.dict.addWord(spell, ipa, translation);

            this.showNoticePopup(this.messages.wordHasAdded, () => {
                this.hidePopup($popup);
            });
        });
    }

    initAddPopup_translationPopup($popup, onSaveButtonClicked = () => {}) {
        let title = this.messages.translationEditing;
        let iconURI = '../../../lib/dict/img/edit.svg';

        this.addPopupTopIcon($popup, iconURI);
        this.addPopupTopTitle($popup, title);

        let $main = $popup.find('.popup-content-main');
        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        let addInputAreaPair = () => {
            let $pair = $('<div class="popup-content-main-inputarea-pair"></div>');

            let $pairType = $('<select></select>');
            $pairType.attr('name', 'type');

            for(let key in this.translationTypes) {
                let $option = $('<option></option>');

                $option.attr('value', key);
                $option.text(this.translationTypes[key]);

                $pairType.append($option);
            }

            $pair.append($pairType);

            let $pairClass = $('<select></select>');
            $pairClass.attr('name', 'class');

            for(let key in this.translationClasses) {
                let $option = $('<option></option>');

                $option.attr('value', key);
                $option.text(this.translationClasses[key]);

                $pairClass.append($option);
            }

            $pair.append($pairClass);

            let $pairInput = $('<input>');
            $pairInput.attr('name', 'words');
            $pairInput.css('width', '200px');
            $pair.append($pairInput);

            let $pairRemoveIcon = $('<img>');
            $pairRemoveIcon.attr('src', '../../../lib/dict/img/remove.svg');

            $pairRemoveIcon.on('click', event => {
                let $parent = $(event.target).parent();

                if($parent.parent().children().length < 2) {
                    this.showNoticePopup(this.messages.cannotRemoveAnyMore);
                } else {
                    $parent.remove();
                }
            });

            $pair.append($pairRemoveIcon);

            $inputArea.append($pair);
        };

        let getInputData = () => {
            let $pairs = $inputArea.children();
            let translation = [];

            $pairs.each((i, elem) => {
                let $item = $(elem);

                let translationWords = $item.children('[name=words]').val().split(',');

                translationWords.forEach((word, index) => {
                    translationWords[index] = this.formatSearchKeyword(word);
                });

                if(translationWords == [ '' ])
                    return;

                let $inputType = $item.children('[name=type]');
                let translationType = $inputType.children('option:selected').eq(0).val();

                let $inputClass = $item.children('[name=class]');
                let translationClass = $inputClass.children('option:selected').eq(0).val();

                translation.push({
                    type: translationType,
                    class: translationClass,
                    words: translationWords
                });
            });

            return translation;
        };

        addInputAreaPair();
        $main.append($inputArea);

        this.addPopupBottomButton($popup, this.messages.back, () => {
            this.showConfirmationPopup(this.messages.closeConfirm, () => {
                this.hidePopup($popup);
            });
        });

        this.addPopupBottomButton($popup, this.messages.add, () => {
            addInputAreaPair();
        });

        this.addPopupBottomButton($popup, this.messages.save, () => {
            this.showNoticePopup(this.messages.translationHasSaved, () => {
                let inputData = getInputData();
                onSaveButtonClicked(inputData);
                this.hidePopup($popup);
            });
        });
    }

    onDocsTopClicked() {
        if(this.selectedItemIndex == -1)
            return;

        location.href = this.dict.getDocsURI(this.selectedItemIndex);
    }

    onEditTopClicked() {}

    onRemoveTopClicked() {}

    onSearchKeywordInput() {
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

        $rightMenuShare.find('.workarea-sidemenu-item-icon').css('cursor', 'pointer');
    }

    selectListItem(index) {
        let $itemList = $('.workarea-wordlist-item');

        if(index >= $itemList.length)
            return;

        let $item = $itemList.eq(index);
        let tmpLatestID = $item.attr('id');

        // 選択する前に他の選択を解除
        this.unslectListItem();

        // 選択解除前だと背景色がリセットされる
        $item.css('background-color', '#dddddd');

        let $sideMenuItems = $('.workarea-sidemenu-item');
        let $sideMenuIcons = $('.workarea-sidemenu-item-icon');
        $sideMenuItems.css('background-color', '#ffffff');
        $sideMenuIcons.css('cursor', 'pointer');

        this.selectedItemIndex = index;

        // 選択解除でlatestSelectedItemIDが初期化されるため保持
        this.latestSelectedItemID = tmpLatestID;
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
        let $bottom = $('<div class="popup-content-bottom"></div>');

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

        this.hideMenu('rightMenuShare');

        let $sideMenuItems = $('.workarea-sidemenu-item');
        let $sideMenuIcons = $('.workarea-sidemenu-item-icon');

        $sideMenuItems.css('background-color', '#dddddd');
        $sideMenuIcons.css('cursor', 'not-allowed');

        let $leftMenu = $('#leftMenuAdd');
        let $leftMenuAddTop = $leftMenu.children('.workarea-sidemenu-item-icon');

        $leftMenuAddTop.css('cursor', 'pointer');

        this.selectedItemIndex = -1;
        this.latestSelectedItemID = '';
    }

    updateWordList() {
        let $searchInput = $('#searchInput');
        let $wordListItems = $('.workarea-wordlist-item');

        // データの読み込みが未完了の場合はアラートを表示
        if(!this.dict.ready || !this.langPack.ready) {
            this.showNoticePopup(this.messages.pleaseWait);
            // 入力された文字列を残さない
            $searchInput.val('');
            return;
        }

        $wordListItems.remove();

        // 選択解除でlatestSelectedItemIDが初期化されるため保持
        let tmpLatestID = this.latestSelectedItemID;
        this.unslectListItem();
        this.latestSelectedItemID = tmpLatestID;

        let keyword = this.formatSearchKeyword($searchInput.val());

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
