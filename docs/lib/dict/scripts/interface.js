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

    addWordsToList(wordList) {
        let $input = $('#searchInput');
        let $list = $('#wordList');

        wordList.forEach(word => {
            word.translation.forEach(translation => {
                let wordClass = this.translationClasses[translation.class];

                // 要素を生成・追加
                let $elem = $('<div class="workarea-wordlist-item"></div>');
                $elem.attr('id', 'wordListItem_' + word.index + '_' + translation.index);

                let $elemSpelling = $('<div class="workarea-wordlist-item-spelling"></div>');
                let $elemType = $('<div class="workarea-wordlist-item-type"></div>');

                $elemSpelling.text(word.spelling);
                $elemType.text('[' + this.translationTypes[translation.type] + ']');

                $elem.append($elemSpelling);
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
                    if(formattedKeyword != word.spelling) {
                        $input.val(word.spelling);
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

    init() {
        $(() => {
            this.initEvents();
            this.setSideMenuObserver();
            this.setInitialKeyword();
        });
    }

    initEvents() {
        $('#searchInput').on('input', () => {
            this.updateWordList();
        });

        $('#leftMenuAddTop').on('click', () => {
            let popup = new Popup(this.messages);

            popup.show(() => {
                this.initWordAdditionPopup(popup);
            });
        });

        $('#leftMenuEditTop').on('click', () => {
            if(this.selectedItemIndex == -1)
                return;

            let popup = new Popup(this.messages);

            popup.show(() => {
                this.initWordEditionPopup(popup);
            });
        });

        $('#leftMenuRemoveTop').on('click', () => {
            if(this.selectedItemIndex == -1)
                return;

            (new Popup(this.messages)).showConfirmation(this.messages.doYouReallyRemoveTheWord, () => {
                let $selectedItem = $('.workarea-wordlist-item').eq(this.selectedItemIndex);
                let spelling = $selectedItem.children('.workarea-wordlist-item-spelling').text();
                let searchResult = this.dict.searchSpelling(spelling);

                if(!Object.keys(searchResult).length) {
                    (new Popup(this.messages)).showNotification(this.messages.failedToRemoveTheWord);
                    return;
                }

                this.dict.removeWord(searchResult.index);
                this.updateWordList();
            });
        });

        $('#leftMenuUploadTop').on('click', () => {
            let popup = new Popup(this.messages);

            popup.show(() => {
                this.initUploadPopup(popup);
            });
        });

        $('#rightMenuDocsTop').on('click', () => {
            if(this.selectedItemIndex == -1)
                return;

            location.href = this.dict.getDocsURI(this.selectedItemIndex);
        });

        $('#rightMenuShareTop').on('click', () => {
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
                (new Popup(this.messages)).showNotification(this.messages.copiedToTheClipboard);
            });

            $twitterShareIcon.on('click', () => {
                // Twitterのシェアリンクを新規タブで開く
                open(this.dict.getTwitterShareLink(this.selectedItemIndex));
                this.hideMenu('rightMenuShare');
            });

            $rightMenuShare.append($linkShareIcon);
            $rightMenuShare.append($twitterShareIcon);

            $rightMenuShare.find('.workarea-sidemenu-item-icon').css('cursor', 'pointer');
        });
    }

    initUploadPopup(popup) {
        let title = this.messages.upload;
        let iconURI = '../../../lib/dict/img/download.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);

        let $main = popup.$popup.find('.popup-content-main');
        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        let $pair = $('<div class="popup-content-main-inputarea-pair">');

        let $pairName = $('<div></div>');
        $pairName.text(this.messages.jsonData);
        $pair.append($pairName);

        let $pairInput = $('<input>')
        $pairInput.attr('name', name);
        $pair.append($pairInput);

        $inputArea.append($pair);
        $main.append($inputArea);

        // 戻るボタン
        popup.addBottomButton(this.messages.back, () => {
            let message = this.messages.doYouReallyClose + '<br>' + this.messages.theDataWillBeDiscarded;

            (new Popup(this.messages)).showConfirmation(message, () => {
                popup.hide();
            });
        });

        // 保存ボタン
        popup.addBottomButton(this.messages.save, () => {
            // 入力されたJSONデータをパースしてデータを更新
            let jsonData;

            try {
                jsonData = JSON.parse($pairInput.val());
            } catch(error) {
                let jsonErrorMessage = this.messages.failedToParseTheJSONData + '<br><br>[' + error.message + ']';
                (new Popup(this.messages)).showNotification(jsonErrorMessage);
                return;
            }

            let message = this.messages.doYouReallySaveTheWord;

            (new Popup(this.messages)).showConfirmation(message, () => {
                this.dict.data = jsonData;
                popup.hide();
            });
        });
    }

    /* 翻訳編集用のポップアップ */
    initTranslationEditionPopup(popup, translation, onSaveButtonClicked = data => {}) {
        let title = this.messages.translationEdition;
        let iconURI = '../../../lib/dict/img/edit.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);

        let $main = popup.$popup.find('.popup-content-main');
        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        // words → 文字列の配列
        let addInputAreaPair = (type, className, words) => {
            let $pair = $('<div class="popup-content-main-inputarea-pair"></div>');

            let $pairType = $('<select></select>');
            $pairType.attr('name', 'type');

            for(let key in this.translationTypes) {
                let $option = $('<option></option>');

                $option.attr('value', key);
                $option.text(this.translationTypes[key]);

                $pairType.append($option);
            }

            if(type !== undefined)
                $pairType.val(type);

            $pair.append($pairType);

            let $pairClass = $('<select></select>');
            $pairClass.attr('name', 'class');

            for(let key in this.translationClasses) {
                let $option = $('<option></option>');

                $option.attr('value', key);
                $option.text(this.translationClasses[key]);

                $pairClass.append($option);
            }

            if(className !== undefined)
                $pairClass.val(className);

            $pair.append($pairClass);

            let $pairInput = $('<input>');
            $pairInput.attr('name', 'words');
            $pairInput.css('width', '250px');

            if(words !== undefined)
                $pairInput.val(words.join(','));

            $pair.append($pairInput);

            let $pairRemoveIcon = $('<img>');
            $pairRemoveIcon.attr('src', '../../../lib/dict/img/remove.svg');

            $pairRemoveIcon.on('click', event => {
                let $parent = $(event.target).parent();

                if($parent.parent().children().length < 2) {
                    (new Popup(this.messages)).showNotification(this.messages.youCannotRemoveAnyMore);
                } else {
                    $parent.remove();
                }
            });

            $pair.append($pairRemoveIcon);

            $inputArea.append($pair);
        };

        let getInputData = () => {
            let $pairs = $inputArea.children();
            let newTranslation = [];

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

                newTranslation.push({
                    type: translationType,
                    class: translationClass,
                    words: translationWords
                });
            });

            return newTranslation;
        };

        translation.forEach(item => {
            addInputAreaPair(item.type, item.class, item.words);
        });

        if(translation.length == 0)
            addInputAreaPair();

        $main.append($inputArea);

        popup.addBottomButton(this.messages.back, () => {
            let message = this.messages.doYouReallyClose + '<br>' + this.messages.theDataWillBeDiscarded;

            (new Popup(this.messages)).showConfirmation(message, () => {
                popup.hide();
            });
        });

        popup.addBottomButton(this.messages.add, () => {
            addInputAreaPair();
        });

        popup.addBottomButton(this.messages.save, () => {
            translation = getInputData();
            onSaveButtonClicked(translation);
            popup.hide();
        });
    }

    /* 単語追加用のポップアップ */
    initWordAdditionPopup(popup) {
        let $main = popup.$popup.find('.popup-content-main');

        let title = this.messages.wordAddition;
        let iconURI = '../../../lib/dict/img/add.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);

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

        let $spellingInput = $('<input>');

        $spellingInput.on('input', () => {
            let formattedSpelling = this.formatSearchKeyword($spellingInput.val());
            let searchResult = this.dict.searchSpelling(formattedSpelling);
            let backColor = '#ffffff';

            if(Object.keys(searchResult).length)
                backColor = '#ffdddd';

            $spellingInput.css('background-color', backColor);
        });

        addInputAreaPair('spelling', $spellingInput);
        addInputAreaPair('ipa', $('<input>'));

        $main.append($inputArea);

        let translation = [];

        // 戻るボタン
        popup.addBottomButton(this.messages.back, () => {
            let message = this.messages.doYouReallyClose + '<br>' + this.messages.theDataWillBeDiscarded;

            (new Popup(this.messages)).showConfirmation(message, () => {
                // Yesの場合
                popup.hide();
            });
        });

        // 翻訳ボタン
        popup.addBottomButton(this.messages.trans, () => {
            let translationPopup = new Popup(this.messages);

            translationPopup.show(() => {
                this.initTranslationEditionPopup(translationPopup, translation, data => {
                    translation = data;
                });
            });
        });

        // 追加ボタン
        popup.addBottomButton(this.messages.add, () => {
            let $input_spelling = $inputArea.find('[name=spelling]').eq(0);
            let $input_ipa = $inputArea.find('[name=ipa]').eq(0);

            let spelling = this.formatSearchKeyword($input_spelling.val());
            let ipa = this.formatSearchKeyword($input_ipa.val());

            if(Object.keys(this.dict.searchSpelling(spelling)).length) {
                (new Popup(this.messages)).showNotification(this.messages.theSpellingIsDuplicated);
                return;
            }

            if(spelling == '' || ipa == '') {
                (new Popup(this.messages)).showNotification(this.messages.theInputItemLacks);
                return;
            }

            if(spelling.length > 30 || ipa.length > 30) {
                (new Popup(this.messages)).showNotification(this.messages.theInputtedTextIsTooLong);
                return;
            }

            let invalidChars = /[^a-zA-z0-9 !?.,+*-=/_#%()\[\]{}\'"']/;

            if(spelling.match(invalidChars) || ipa.match(invalidChars)) {
                (new Popup(this.messages)).showNotification(this.messages.theInputtedCharsAreInvalid);
                return;
            }

            if(translation.length == 0) {
                (new Popup(this.messages)).showNotification(this.messages.theTranslationIsNotInputted);
                return;
            }

            this.dict.addWord(spelling, ipa, translation);

            this.updateWordList();
            popup.hide();
        });
    }

    /* 単語編集用のポップアップ */
    initWordEditionPopup(popup) {
        let $selectedItem = $('.workarea-wordlist-item').eq(this.selectedItemIndex);
        let oldWordSpelling = $selectedItem.children('.workarea-wordlist-item-spelling').text();
        let oldWord = this.dict.searchSpelling(oldWordSpelling);

        let $main = popup.$popup.find('.popup-content-main');

        let title = this.messages.wordEdition;
        let iconURI = '../../../lib/dict/img/edit.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);

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

        let $spellingInput = $('<input>');
        $spellingInput.val(oldWord.spelling);

        $spellingInput.on('input', () => {
            let formattedSpelling = this.formatSearchKeyword($spellingInput.val());
            let searchResult = this.dict.searchSpelling(formattedSpelling);
            let backColor = '#ffffff';

            if(oldWord.spelling != formattedSpelling && Object.keys(searchResult).length)
                backColor = '#ffdddd';

            $spellingInput.css('background-color', backColor);
        });

        addInputAreaPair('spelling', $spellingInput);

        let $ipaInput = $('<input>');
        $ipaInput.val(oldWord.ipa);

        addInputAreaPair('ipa', $ipaInput);

        $main.append($inputArea);

        let translation = oldWord.translation;

        // 戻るボタン
        popup.addBottomButton(this.messages.back, () => {
            let message = this.messages.doYouReallyClose + '<br>' + this.messages.theDataWillBeDiscarded;

            (new Popup(this.messages)).showConfirmation(message, () => {
                // Yesの場合
                popup.hide();
            });
        });

        // 翻訳ボタン
        popup.addBottomButton(this.messages.trans, () => {
            let translationPopup = new Popup(this.messages);

            translationPopup.show(() => {
                this.initTranslationEditionPopup(translationPopup, translation, data => {
                    translation = data;
                });
            });
        });

        // 更新ボタン
        popup.addBottomButton(this.messages.save, () => {
            let message = this.messages.doYouReallySaveTheWord;

            (new Popup(this.messages)).showConfirmation(message, () => {
                let $input_spelling = $inputArea.find('[name=spelling]').eq(0);
                let $input_ipa = $inputArea.find('[name=ipa]').eq(0);

                let spelling = this.formatSearchKeyword($input_spelling.val());
                let ipa = this.formatSearchKeyword($input_ipa.val());

                if(spelling != oldWord.spelling && Object.keys(this.dict.searchSpelling(spelling)).length) {
                    (new Popup(this.messages)).showNotification(this.messages.theSpellingIsDuplicated);
                    return;
                }

                if(spelling == '' || ipa == '') {
                    (new Popup(this.messages)).showNotification(this.messages.theInputItemLacks);
                    return;
                }

                if(spelling.length > 30 || ipa.length > 30) {
                    (new Popup(this.messages)).showNotification(this.messages.theInputtedTextIsTooLong);
                    return;
                }

                let invalidChars = /[^a-zA-z0-9 !?.,+*-=/_#%()\[\]{}\'"']/;

                if(spelling.match(invalidChars) || ipa.match(invalidChars)) {
                    (new Popup(this.messages)).showNotification(this.messages.theInputtedCharsAreInvalid);
                    return;
                }

                if(translation.length == 0) {
                    (new Popup(this.messages)).showNotification(this.messages.theTranslationIsNotInputted);
                    return;
                }

                this.dict.removeWord(oldWord.index);
                this.dict.addWord(spelling, ipa, translation);

                this.updateWordList();
                popup.hide();
            });
        });
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

    showGuideMessage() {
        $('#wordListGuide').show();
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
            (new Popup(this.messages)).showNotification(this.messages.pleaseWait);
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
            this.setGuideMessage(this.messages.theSearchResultsWillBeDisplayedHere);
            this.showGuideMessage();
            return;
        }

        let words = this.dict.search(keyword);

        if(words.length == 0) {
            this.setGuideMessage(this.messages.theWordHasNotFound);
            this.showGuideMessage();
            return;
        }

        this.setGuideMessage(this.messages.theSearchResultsWillBeDisplayedHere);
        this.hideGuideMessage();
        this.addWordsToList(words);
    }
}
