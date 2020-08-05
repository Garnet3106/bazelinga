'use strict';


var langData;


class Interface {
    constructor(lang) {
        this.lang = lang;

        // 選択された単語リストの項目の番号 (未選択時: -1)
        this.selectedItemIndex = -1;
        // 最後に選択された単語リストの項目のID (未選択時: 空文字)
        this.latestSelectedItemID = '';

        this.loadDataFiles();
    }

    addWordsToList(wordList) {
        let $input = $('#searchInput');
        let $list = $('#wordList');

        wordList.forEach(word => {
            word.translation.forEach(translation => {
                let wordClass = langData.classes[translation.class];

                // 要素を生成・追加
                let $elem = $('<div class="workarea-wordlist-item"></div>');
                $elem.attr('id', 'wordListItem_' + word.index + '_' + translation.index);

                let $elemSpelling = $('<div class="workarea-wordlist-item-spelling"></div>');
                let $elemType = $('<div class="workarea-wordlist-item-type"></div>');

                $elemSpelling.text(word.spelling);
                $elemType.text('[' + langData.types[translation.type] + ']');

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
            Popup.show(popup => {
                this.initWordAdditionPopup(popup);
            });
        });

        $('#leftMenuEditTop').on('click', () => {
            if(this.selectedItemIndex == -1)
                return;

            Popup.show(popup => {
                this.initWordEditionPopup(popup);
            });
        });

        $('#leftMenuRemoveTop').on('click', () => {
            if(this.selectedItemIndex == -1)
                return;

            Popup.showConfirmation(langData.messages.doYouReallyRemoveTheWord, () => {
                let $selectedItem = $('.workarea-wordlist-item').eq(this.selectedItemIndex);
                let spelling = $selectedItem.children('.workarea-wordlist-item-spelling').text();
                let searchResult = this.dict.searchSpelling(spelling);

                if(!Object.keys(searchResult).length) {
                    Popup.showNotification(langData.messages.failedToRemoveTheWord);
                    return;
                }

                this.dict.removeWord(searchResult.index);
                this.updateWordList();
            });
        });

        $('#leftMenuUploadTop').on('click', () => {
            Popup.show(popup => {
                this.initUploadPopup(popup);
            });
        });

        $('#leftMenuDownloadTop').on('click', () => {
            Popup.show(popup => {
                this.initDownloadPopup(popup);
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
                Popup.showNotification(langData.messages.copiedToTheClipboard);
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

    initDownloadPopup(popup) {
        let title = langData.messages.download;
        let iconURI = '../../../lib/dict/img/download.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);

        let $main = popup.$elem.find('.popup-content-main');
        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        let $pair = $('<div class="popup-content-main-inputarea-pair">');

        // ペア名
        let $pairName = $('<div></div>');
        $pairName.text(langData.messages.data);
        $pair.append($pairName);

        // コピペ用input
        let $pairInput = $('<input>');
        $pairInput.attr('readonly', true);

        $pairInput.on('click', () => {
            $pairInput.select();
        });

        let stringifiedData = '';

        try {
            stringifiedData = JSON.stringify(this.dict.data);
        } catch(error) {
            Popup.showConfirmation(langData.messages.failedToConvertTheJSONData);
        }

        $pairInput.val(stringifiedData);
        $pair.append($pairInput);

        $inputArea.append($pair);
        $main.append($inputArea);

        // 戻るボタン
        popup.addBottomButton(langData.messages.back, () => {
            popup.hide();
        });

        // コピーボタン
        popup.addBottomButton(langData.messages.copy, () => {
            this.copyToClipboard(stringifiedData);
            Popup.showNotification(langData.messages.copiedToTheClipboard);
            popup.hide();
        });
    }

    initUploadPopup(popup) {
        if(!window.File || !window.FileReader) {
            Popup.showNotification(langData.messages.thisFeatureIsNotAvailableForYourEnvironment);
            popup.hide();
            return;
        }

        let setDataByFile = file => {
            Popup.showConfirmation(langData.messages.doYouReallySaveTheData, () => {
                this.dict.setDataByFile(file, langData.messages, () => {
                    // 成功時の処理
                    Popup.showNotification(langData.messages.theDataHasSaved);
                    popup.hide();
                }, error => {
                    // エラー時の処理
                    Popup.showNotification(langData.messages.theDataHasSaved + '<br><br>[' + error.message + ']');
                });
            });
        };

        let title = langData.messages.upload;
        let iconURI = '../../../lib/dict/img/upload.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);
        popup.addMainMessage(langData.messages.selectOrDropYourFile + '<br><br>[' + langData.messages.clickOrDropHere + ']');

        popup.setFileDropEvent(event => {
            // ファイルは1つまで
            let file = event.dataTransfer.files[0];
            setDataByFile(file);
        });

        // 選択エリアを設定
        popup.setFileSelectEvent(event => {
            // ファイルは1つまで
            let file = event.target.files[0];
            setDataByFile(file);
        });

        // 戻るボタン
        popup.addBottomButton(langData.messages.back, () => {
            popup.hide();
        });
    }

    /* 翻訳編集用のポップアップ */
    initTranslationEditionPopup(popup, translation, onSaveButtonClicked = data => {}) {
        let title = langData.messages.translationEdition;
        let iconURI = '../../../lib/dict/img/edit.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);

        let $main = popup.$elem.find('.popup-content-main');
        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        // words → 文字列の配列
        let addInputAreaPair = (type, className, words) => {
            let $pair = $('<div class="popup-content-main-inputarea-pair"></div>');

            let $pairType = $('<select></select>');
            $pairType.attr('name', 'type');

            for(let key in langData.types) {
                let $option = $('<option></option>');

                $option.attr('value', key);
                $option.text(langData.types[key]);

                $pairType.append($option);
            }

            if(type !== undefined)
                $pairType.val(type);

            $pair.append($pairType);

            let $pairClass = $('<select></select>');
            $pairClass.attr('name', 'class');

            for(let key in langData.classes) {
                let $option = $('<option></option>');

                $option.attr('value', key);
                $option.text(langData.classes[key]);

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
                    Popup.showNotification(langData.messages.youCannotRemoveAnyMore);
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

                // [ '' ] で一致しなかったので配列の長さと最初のインデックスの値で比較
                if(translationWords.length == 0 || translationWords[0] === '')
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

        popup.addBottomButton(langData.messages.back, () => {
            let message = langData.messages.doYouReallyClose + '<br>' + langData.messages.theDataWillBeDiscarded;

            Popup.showConfirmation(message, () => {
                popup.hide();
            });
        });

        popup.addBottomButton(langData.messages.add, () => {
            addInputAreaPair();
        });

        popup.addBottomButton(langData.messages.save, () => {
            translation = getInputData();
            onSaveButtonClicked(translation);
            popup.hide();
        });
    }

    /* 単語追加用のポップアップ */
    initWordAdditionPopup(popup) {
        let $main = popup.$elem.find('.popup-content-main');

        let title = langData.messages.wordAddition;
        let iconURI = '../../../lib/dict/img/add.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);

        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        let addInputAreaPair = (name, $pairInput) => {
            let $pair = $('<div class="popup-content-main-inputarea-pair">');

            let $pairName = $('<div></div>');
            $pairName.text(langData.messages[name]);
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
        popup.addBottomButton(langData.messages.back, () => {
            let message = langData.messages.doYouReallyClose + '<br>' + langData.messages.theDataWillBeDiscarded;

            Popup.showConfirmation(message, () => {
                // Yesの場合
                popup.hide();
            });
        });

        // 翻訳ボタン
        popup.addBottomButton(langData.messages.trans, () => {
            Popup.show(translationPopup => {
                this.initTranslationEditionPopup(translationPopup, translation, data => {
                    translation = data;
                });
            });
        });

        // 追加ボタン
        popup.addBottomButton(langData.messages.add, () => {
            let $input_spelling = $inputArea.find('[name=spelling]').eq(0);
            let $input_ipa = $inputArea.find('[name=ipa]').eq(0);

            let spelling = this.formatSearchKeyword($input_spelling.val());
            let ipa = this.formatSearchKeyword($input_ipa.val());

            if(Object.keys(this.dict.searchSpelling(spelling)).length) {
                Popup.showNotification(langData.messages.theSpellingIsDuplicated);
                return;
            }

            if(spelling == '' || ipa == '') {
                Popup.showNotification(langData.messages.theInputItemLacks);
                return;
            }

            if(spelling.length > 30 || ipa.length > 30) {
                Popup.showNotification(langData.messages.theInputtedTextIsTooLong);
                return;
            }

            let invalidChars = /[^a-zA-z0-9 !?.,+*-=/_#%()\[\]{}\'"']/;

            if(spelling.match(invalidChars) || ipa.match(invalidChars)) {
                Popup.showNotification(langData.messages.theInputtedCharsAreInvalid);
                return;
            }

            if(translation.length == 0) {
                Popup.showNotification(langData.messages.theTranslationIsNotInputted);
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

        let $main = popup.$elem.find('.popup-content-main');

        let title = langData.messages.wordEdition;
        let iconURI = '../../../lib/dict/img/edit.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);

        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        let addInputAreaPair = (name, $pairInput) => {
            let $pair = $('<div class="popup-content-main-inputarea-pair">');

            let $pairName = $('<div></div>');
            $pairName.text(langData.messages[name]);
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
        popup.addBottomButton(langData.messages.back, () => {
            let message = langData.messages.doYouReallyClose + '<br>' + langData.messages.theDataWillBeDiscarded;

            Popup.showConfirmation(message, () => {
                // Yesの場合
                popup.hide();
            });
        });

        // 翻訳ボタン
        popup.addBottomButton(langData.messages.trans, () => {
            Popup.show(translationPopup => {
                this.initTranslationEditionPopup(translationPopup, translation, data => {
                    translation = data;
                });
            });
        });

        // 更新ボタン
        popup.addBottomButton(langData.messages.save, () => {
            let message = langData.messages.doYouReallySaveTheWord;

            Popup.showConfirmation(message, () => {
                let $input_spelling = $inputArea.find('[name=spelling]').eq(0);
                let $input_ipa = $inputArea.find('[name=ipa]').eq(0);

                let spelling = this.formatSearchKeyword($input_spelling.val());
                let ipa = this.formatSearchKeyword($input_ipa.val());

                if(spelling != oldWord.spelling && Object.keys(this.dict.searchSpelling(spelling)).length) {
                    Popup.showNotification(langData.messages.theSpellingIsDuplicated);
                    return;
                }

                if(spelling == '' || ipa == '') {
                    Popup.showNotification(langData.messages.theInputItemLacks);
                    return;
                }

                if(spelling.length > 30 || ipa.length > 30) {
                    Popup.showNotification(langData.messages.theInputtedTextIsTooLong);
                    return;
                }

                let invalidChars = /[^a-zA-z0-9 !?.,+*-=/_#%()\[\]{}\'"']/;

                if(spelling.match(invalidChars) || ipa.match(invalidChars)) {
                    Popup.showNotification(langData.messages.theInputtedCharsAreInvalid);
                    return;
                }

                if(translation.length == 0) {
                    Popup.showNotification(langData.messages.theTranslationIsNotInputted);
                    return;
                }

                this.dict.removeWord(oldWord.index);
                this.dict.addWord(spelling, ipa, translation);

                this.updateWordList();
                popup.hide();
            });
        });
    }

    loadDataFiles() {
        // 言語パックデータを読み込む
        let loadLangPackData = () => {
            this.langPack = new LangPack(this.lang);

            this.langPack.load(() => {
                // ロード成功時
                langData = this.langPack.getData();
                // 次のロードに移行する: 辞書データのロード
                loadDictionaryData();
            }, error => {
                // ロード失敗時
                console.log(error.message)
            });
        };

        // 辞書データを読み込む
        let loadDictionaryData = () => {
            this.dict = new Dictionary(this.lang);

            this.dict.load(() => {
                // ロード成功時
                // 次の処理に移行する: Interface.init() の実行
                this.init();
            }, error => {
                // ロード失敗時
                console.log(error.message);
            });
        };

        // ロード処理を開始
        loadLangPackData();
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
            Popup.showNotification(langData.messages.pleaseWait);
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
            this.setGuideMessage(langData.messages.theSearchResultsWillBeDisplayedHere);
            this.showGuideMessage();
            return;
        }

        let words = this.dict.search(keyword);

        if(words.length == 0) {
            this.setGuideMessage(langData.messages.theWordHasNotFound);
            this.showGuideMessage();
            return;
        }

        this.setGuideMessage(langData.messages.theSearchResultsWillBeDisplayedHere);
        this.hideGuideMessage();
        this.addWordsToList(words);
    }
}
