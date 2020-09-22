/* 
 * 
 * Baze Language Dictionary
 * 
 * PLEASE CHECK THE LICENSE FOR USING SOURCES:
 *     https://bazelinga.gant.work/how_to_use.html
 * 
 * Copyright (c) 2020 Garnet3106
 * 
 */


'use strict';


class PopupManager {

    /* 翻訳入力ポップアップ */

    // 引数が指定されていない場合は初期値を割り当てます (words: 文字列配列)
    static addTranslationInputAreaPair($inputArea, type = null, className = null, words = null) {
        let $pair = $('<div class="popup-content-main-inputarea-pair"></div>');

        // 翻訳の種類
        PopupManager.addTranslationInputAreaPair_type($pair, type);

        // 翻訳のクラス
        PopupManager.addTranslationInputAreaPair_class($pair, className);

        // 翻訳の訳一覧
        PopupManager.addTranslationInputAreaPair_trans($pair, words);

        let $pairRemoveIcon = $('<img>');
        $pairRemoveIcon.attr('src', 'https://bazelinga.gant.work/lib/dict/img/remove.svg');

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

    static addTranslationInputAreaPair_class($pair, className) {
        let $pairClass = $('<select></select>');
        $pairClass.attr('name', 'class');

        for(let key in langData.classes) {
            let $option = $('<option></option>');

            $option.attr('value', key);
            $option.text(langData.classes[key]);

            $pairClass.append($option);
        }

        if(className !== null)
            $pairClass.val(className);

        $pair.append($pairClass);
    }

    static addTranslationInputAreaPair_trans($pair, words) {
        let $pairInput = $('<input>');
        $pairInput.attr('name', 'words');
        $pairInput.css('width', '250px');

        if(words !== null) {
            // wordsがundefinedでない場合は入力欄を埋める
            $pairInput.val(words.join(','));
        } else {
            // wordsがundefinedの場合は赤背景にする
            $pairInput.css('background-color', mainInterface.settings.inputErrorColor);
        }

        $pairInput.on('input', () => {
            let isTranslationValid = mainInterface.dict.isTranslationValid($pairInput.val()) === true;
            $pairInput.css('background-color', isTranslationValid ? '#ffffff' : mainInterface.settings.inputErrorColor);
        });

        $pair.append($pairInput);
    }

    static addTranslationInputAreaPair_type($pair, type) {
        let $pairType = $('<select></select>');
        $pairType.attr('name', 'type');

        for(let key in langData.types) {
            let $option = $('<option></option>');

            $option.attr('value', key);
            $option.text(langData.types[key]);

            $pairType.append($option);
        }

        if(type !== null)
            $pairType.val(type);

        $pair.append($pairType);
    }

    static getTranslationInputData($inputArea) {
        let $pairs = $inputArea.children();
        let newTranslation = [];

        $pairs.each((item_i, item) => {
            let $item = $(item);
            let translationWords = $item.children('[name=words]').val().split(',');

            translationWords.forEach((word, index) => {
                translationWords[index] = Dictionary.formatSearchKeyword(word);
            });

            // 空配列の場合は弾く
            // [ '' ] との一致判定では空配列判定ができないので注意
            if(translationWords.length == 0 || translationWords[0] === '')
                return;

            // 翻訳の種類
            let $inputType = $item.children('[name=type]');
            let translationType = $inputType.children('option:selected').eq(0).val();

            // 翻訳のクラス
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

    static showTranslationEditionPopup(popup, translation, onSaveButtonClicked = data => {}) {
        let title = langData.messages.translationEdition;
        let iconURI = 'https://bazelinga.gant.work/lib/dict/img/edit.svg';

        popup.addTopIcon(iconURI);
        popup.addTopTitle(title);

        let $main = popup.$elem.find('.popup-content-main');
        let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

        translation.forEach(item => {
            PopupManager.addTranslationInputAreaPair($inputArea, item.type, item.class, item.words);
        });

        if(translation.length == 0)
            PopupManager.addTranslationInputAreaPair($inputArea);

        $main.append($inputArea);

        // 戻るボタン
        popup.addBottomButton(langData.messages.back, () => {
            let message = langData.messages.doYouReallyCloseThePopup + '<br>' + langData.messages.theDataWillBeDiscarded;

            Popup.showConfirmation(message, () => {
                popup.hide();
            });
        });

        // 追加ボタン
        popup.addBottomButton(langData.messages.add, () => {
            PopupManager.addTranslationInputAreaPair($inputArea);
        });

        // 保存ボタン
        popup.addBottomButton(langData.messages.save, () => {
            let newTranslation = mainInterface.saveInputtedTranslationData($inputArea);

            if(newTranslation !== false) {
                translation = newTranslation;
                onSaveButtonClicked(translation);
                popup.hide();
            }
        });
    }

    /* 単語追加ポップアップ */

    static addWordAdditionBackButton(popup) {
        popup.addBottomButton(langData.messages.back, () => {
            let message = langData.messages.doYouReallyCloseThePopup + '<br>' + langData.messages.theDataWillBeDiscarded;

            Popup.showConfirmation(message, () => {
                popup.hide();
            });
        });
    }

    static addWordAdditionInputAreaPair($inputArea, name, $pairInput) {
        let $pair = $('<div class="popup-content-main-inputarea-pair">');

        let $pairName = $('<div></div>');
        $pairName.text(langData.messages[name]);
        $pair.append($pairName);

        $pairInput.attr('name', name);
        $pair.append($pairInput);

        $inputArea.append($pair);
    }

    static showWordAdditionPopup() {
        Popup.show(popup => {
            let $main = popup.$elem.find('.popup-content-main');

            let title = langData.messages.wordAddition;
            let iconURI = 'https://bazelinga.gant.work/lib/dict/img/add.svg';

            popup.addTopIcon(iconURI);
            popup.addTopTitle(title);

            let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

            let $spellingInput = $('<input>');
            // 単語追加時は入力欄が空のためデフォルトで赤背景にする (編集時は白のままで問題ない)
            $spellingInput.css('background-color', mainInterface.settings.inputErrorColor);

            $spellingInput.on('input', () => {
                let isSpellingValid = mainInterface.dict.isSpellingValid($spellingInput.val()) === true;
                let backColor = isSpellingValid ? '#ffffff' : mainInterface.settings.inputErrorColor;
                $spellingInput.css('background-color', backColor);
            });

            PopupManager.addWordAdditionInputAreaPair($inputArea, 'spelling', $spellingInput);
            $main.append($inputArea);

            let translation = [];

            // 戻るボタンを追加する
            PopupManager.addWordAdditionBackButton(popup);

            // 翻訳ボタンを追加する
            PopupManager.addWordAdditionTransButton(popup, transPopup => {
                PopupManager.showTranslationEditionPopup(transPopup, translation, data => {
                    // 翻訳を入力されたデータに更新する
                    translation = data;
                });
            });

            // 保存ボタンを追加する
            PopupManager.addWordAdditionSaveButton(popup, $inputArea, spelling => {
                translation.forEach(trans => {
                    // 辞書オブジェクトの翻訳データを更新する
                    mainInterface.dict.addTranslation(spelling, trans.class, trans.type, trans.words);
                });
            });
        });
    }

    static addWordAdditionSaveButton(popup, $inputArea, saveTransData = spelling => {}) {
        popup.addBottomButton(langData.messages.add, () => {
            let $input_spelling = $inputArea.find('[name=spelling]').eq(0);
            let spelling = Dictionary.formatSearchKeyword($input_spelling.val());
            let isSpellingValid = mainInterface.dict.isSpellingValid(spelling);

            if(isSpellingValid !== true) {
                Popup.showNotification(isSpellingValid);
                return;
            }

            // 入力された翻訳を追加
            saveTransData(spelling);

            mainInterface.updateWordList();
            popup.hide();
        });
    }

    static addWordAdditionTransButton(popup, onShowedPopup = transPopup => {}) {
        popup.addBottomButton(langData.messages.trans, () => {
            Popup.show(transPopup => {
                onShowedPopup(transPopup);
            });
        });
    }

    /* 単語編集ポップアップ */

    static addWordEditionBackButton(popup) {
        popup.addBottomButton(langData.messages.back, () => {
            let message = langData.messages.doYouReallyCloseThePopup + '<br>' + langData.messages.theDataWillBeDiscarded;

            Popup.showConfirmation(message, () => {
                popup.hide();
            });
        });
    }

    static addWordEditionInputAreaPair($inputArea, name, $pairInput) {
        let $pair = $('<div class="popup-content-main-inputarea-pair">');

        let $pairName = $('<div></div>');
        $pairName.text(langData.messages[name]);
        $pair.append($pairName);

        $pairInput.attr('name', name);
        $pair.append($pairInput);

        $inputArea.append($pair);
    };

    static showWordEditionPopup() {
        Popup.show(popup => {
            let selectedItemIndex = mainInterface.selectedItemIndex;
            let $selectedItem = $('.workarea-wordlist-item').eq(selectedItemIndex);
            let oldSpelling = $selectedItem.children('.workarea-wordlist-item-spelling').text();
            let oldTranslation = mainInterface.dict.search(oldSpelling, -1, true, true);

            let $main = popup.$elem.find('.popup-content-main');

            let title = langData.messages.wordEdition;
            let iconURI = 'https://bazelinga.gant.work/lib/dict/img/edit.svg';

            popup.addTopIcon(iconURI);
            popup.addTopTitle(title);

            let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

            let $spellingInput = $('<input>');
            $spellingInput.val(oldSpelling);

            $spellingInput.on('input', () => {
                let formattedSpelling = Dictionary.formatSearchKeyword($spellingInput.val());
                // 元のスペルと一致した場合は赤背景から除外する
                let isInputValid = oldSpelling == formattedSpelling || mainInterface.dict.isSpellingValid($spellingInput.val()) === true;
                $spellingInput.css('background-color', isInputValid ? '#ffffff' : mainInterface.settings.inputErrorColor);
            });

            PopupManager.addWordEditionInputAreaPair($inputArea, 'spelling', $spellingInput);
            $main.append($inputArea);

            let translation = oldTranslation;

            // 戻るボタンを追加する
            PopupManager.addWordEditionBackButton(popup);

            // 翻訳ボタンを追加する
            PopupManager.addWordEditionTransButton(popup, transPopup => {
                PopupManager.showTranslationEditionPopup(transPopup, translation, data => {
                    translation = data;
                });
            });

            // 保存ボタンを追加する
            PopupManager.addWordEditionSaveButton(popup, $inputArea, oldSpelling, spelling => {
                translation.forEach(trans => {
                    // 辞書オブジェクトの翻訳データを更新する
                    mainInterface.dict.addTranslation(spelling, trans.class, trans.type, trans.words);
                });
            });
        });
    }

    static addWordEditionSaveButton(popup, $inputArea, oldSpelling, saveTransData = spelling => {}) {
        popup.addBottomButton(langData.messages.save, () => {
            let message = langData.messages.doYouReallySaveTheWord;

            Popup.showConfirmation(message, () => {
                let $input_spelling = $inputArea.find('[name=spelling]').eq(0);
                let spelling = Dictionary.formatSearchKeyword($input_spelling.val());
                let isSpellingValid = mainInterface.dict.isSpellingValid(spelling);

                // 前のスペルと同じ場合はエラーから除外
                if(spelling != oldSpelling && isSpellingValid !== true) {
                    Popup.showNotification(isSpellingValid);
                    return;
                }

                mainInterface.dict.remove(oldSpelling);
                mainInterface.unselectListItem();

                saveTransData(spelling);

                mainInterface.updateWordList();
                popup.hide();
            });
        });
    }

    static addWordEditionTransButton(popup, onSaveButtonClicked = () => {}) {
        popup.addBottomButton(langData.messages.trans, () => {
            Popup.show(transPopup => {
                onSaveButtonClicked(transPopup);
            });
        });
    }

    /* ダウンロードポップアップ */

    static addDownloadSaveButton(popup) {
        let blobURI;

        // 保存ボタン
        popup.addBottomButton(langData.messages.save, $button => {
            // BlobのデフォルトでUTF-8を使用する
            let data = [ Dictionary.convertDataToString(mainInterface.dict.data) ];
            let properties = {
                type: "text/plain"
            };

            let blob = new Blob(data, properties);
            blobURI = URL.createObjectURL(blob);

            $button.attr('download', mainInterface.lang + '.txt');
            $button.attr('href', blobURI);
            $button.attr('text', 'url');
            $button.css('display', 'none');

            popup.hide();
        }, () => {
            // ブラウザによってはrevoke処理にタイムアウトを入れる必要があるかも (要検証)
            URL.revokeObjectURL(blobURI);
        }, $('<a class="popup-content-bottom-button"></a>'));
    }

    static showDownloadPopup() {
        Popup.show(popup => {
            // ブラウザがFileAPIに対応していない場合はエラーを出して弾く
            if(!Interface.isFileAPIValid()) {
                Popup.showNotification(langData.messages.thisFeatureIsNotAvailableForYourEnvironment);
                popup.hide();
                return;
            }

            let title = langData.messages.download;
            let iconURI = 'https://bazelinga.gant.work/lib/dict/img/download.svg';

            popup.addTopIcon(iconURI);
            popup.addTopTitle(title);

            let $link = $('<a></a>');
            $link.attr('href', 'https://bazelinga.gant.work/');
            // target="_blank" での脆弱性対策のためrel値を設定
            $link.attr('rel', 'noopener noreferrer');
            $link.attr('target', '_blank');
            $link.text(langData.messages.pleaseReadTheLicenseBeforeUsingTheData);
            popup.addMainMessage($link);

            // 戻るボタン
            popup.addBottomButton(langData.messages.back, () => {
                popup.hide();
            });

            // 保存ボタン
            PopupManager.addDownloadSaveButton(popup);
        });
    }

    /* 設定ポップアップ */

    static addSettingsInputAreaPair($inputArea, name, $pairInput) {
        let $pair = $('<div class="popup-content-main-inputarea-pair">');

        let $pairName = $('<div></div>');
        $pairName.css('width', '200px');
        $pairName.text(langData.messages[name]);
        $pair.append($pairName);

        $pairInput.attr('name', name);
        $pair.append($pairInput);

        $inputArea.append($pair);
    }

    static showSettingsPopup() {
        Popup.show(popup => {
            let title = langData.messages.settings;
            let iconURI = 'https://bazelinga.gant.work/lib/dict/img/settings.svg';

            popup.addTopIcon(iconURI);
            popup.addTopTitle(title);

            let $main = popup.$elem.find('.popup-content-main');
            let $inputArea = $('<div class="popup-content-main-inputarea"></div>');

            // 完全一致かどうか
            let $perfectMatch = $('<input type="checkbox">');
            $perfectMatch.prop('checked', mainInterface.settings.isPerfectMatchEnable);
            PopupManager.addSettingsInputAreaPair($inputArea, 'perfectMatching', $perfectMatch);

            // スペルのみの検索にするかどうか
            let $matchOnlySpelling = $('<input type="checkbox">');
            $matchOnlySpelling.prop('checked', mainInterface.settings.matchOnlySpelling);
            PopupManager.addSettingsInputAreaPair($inputArea, 'matchOnlySpelling', $matchOnlySpelling);

            // 検索時の単語数の制限
            let $searchResultLimit = $('<input type="text">');
            $searchResultLimit.val(mainInterface.settings.searchResultLimit);
            PopupManager.addSettingsInputAreaPair($inputArea, 'searchResultLimit', $searchResultLimit);

            $main.append($inputArea);

            // 保存ボタンを追加する
            popup.addBottomButton(langData.messages.ok, () => {
                let perfectMatch = $perfectMatch.prop('checked');
                let matchOnlySpelling = $matchOnlySpelling.prop('checked');
                let searchResultLimit = Number($searchResultLimit.val());

                let succeeded = mainInterface.saveSettings(perfectMatch, matchOnlySpelling, searchResultLimit);

                // 保存に成功した場合は閉じる
                if(succeeded)
                    popup.hide();
            });
        });
    }

    /* アップロードポップアップ */

    static saveUploadedData(popup, file) {
        Popup.showConfirmation(langData.messages.doYouReallySaveTheData, () => {
            mainInterface.dict.saveDataByFile(file, () => {
                // 成功時の処理
                Popup.showNotification(langData.messages.theDataHasSaved);
                popup.hide();
            }, error => {
                // エラー時の処理
                Popup.showNotification(langData.messages.failedToParseTheFile);
            });
        });
    };

    // ファイルドロップのイベントを設定します
    // onDropped() の第一引数にはEventオブジェクトが渡されます
    static setFileDropEvent(popup, onFileDropped = event => {}, onFileHeldUp = popup => {}, onFileDragLeft = popup => {}) {
        popup.$elem.on('dragover', event => {
            event.preventDefault();
            onFileHeldUp();
        });

        popup.$elem.on('dragenter', event => {
            event.preventDefault();
        });

        popup.$elem.on('dragleave', event => {
            onFileDragLeft();
        });

        popup.$elem.on('drop', event => {
            event.preventDefault();
            onFileDragLeft();
            onFileDropped(event);
        });
    }

    // ファイル選択のイベントを設定します
    static setFileSelectEvent(popup, onFileSelected = event => {}) {
        // アップロード用のクラス .popup-content-upload を使用する
        let $main = popup.$elem.find('.popup-content-upload');
        let $input;

        // ファイル選択に必要なinput要素を作成する
        let regenerateInputElem = () => {
            if($input !== undefined)
                $input.remove();

            // ファイルアップロード用の隠しボタン
            popup.addBottomButton('', () => {}, $button => {
                $button.css('display', 'none');
                $button.attr('type', 'file');

                // ファイルが選択された場合
                $button.on('change', event => {
                    onFileSelected(event);
                    // 同じファイルを連続で選択するとchangeイベントが発火しないので要素を作り直す
                    regenerateInputElem();
                });

                // メイン要素がクリックされた場合はinputイベントをトリガーしてファイル選択画面を開く
                $main.on('click', () => {
                    $button.click();
                });

                $input = $button;
            }, $('<input>'));
        };

        regenerateInputElem();
    }

    static showUploadPopup() {
        Popup.show(popup => {
            // ブラウザがFileAPIに対応していない場合はエラーを出して弾く
            if(!Interface.isFileAPIValid()) {
                Popup.showNotification(langData.messages.thisFeatureIsNotAvailableForYourEnvironment);
                popup.hide();
                return;
            }

            let title = langData.messages.upload;
            let iconURI = 'https://bazelinga.gant.work/lib/dict/img/upload.svg';

            popup.addTopIcon(iconURI);
            popup.addTopTitle(title);
            popup.addMainMessage(langData.messages.selectOrDropYourFile + '<br><br>[' + langData.messages.clickHereOrDropAFileAllOver + ']');

            // メイン要素を popup-content-upload に置き換える
            let $main = popup.$elem.find('.popup-content-main');
            $main.attr('class', 'popup-content-upload');

            PopupManager.setFileDropEvent(popup, event => {
                // 2つめ以降のファイルは無視する
                let file = event.dataTransfer.files[0];
                PopupManager.saveUploadedData(popup, file);
            }, () => {
                // ファイルを掴んでいるときのイベント
                $main.css('background-color', '#dddddd');
                popup.$elem.css('cursor', 'grabbing');
            }, () => {
                // ファイルのドロップが終了したときのイベント
                $main.css('background-color', '#ffffff');
                popup.$elem.css('cursor', 'auto');
            });

            // ファイル選択のイベントを設定する
            PopupManager.setFileSelectEvent(popup, event => {
                // 2つめ以降のファイルは無視する
                let file = event.target.files[0];
                PopupManager.saveUploadedData(popup, file);
            });

            // 戻るボタン
            popup.addBottomButton(langData.messages.back, () => {
                popup.hide();
            });
        });
    }

    /* 単語削除ポップアップ */

    static showRemovePopup() {
        Popup.showConfirmation(langData.messages.doYouReallyRemoveTheWord, () => {
            let $selectedItem = $('.workarea-wordlist-item').eq(mainInterface.selectedItemIndex);
            let spelling = $selectedItem.children('.workarea-wordlist-item-spelling').text();
            let searchResult = mainInterface.dict.search(spelling, -1, true, true);

            if(!Object.keys(searchResult).length) {
                Popup.showNotification(langData.messages.failedToRemoveTheWord);
                return;
            }

            mainInterface.dict.remove(spelling);
            mainInterface.unselectListItem();
            mainInterface.updateWordList();
        });
    }
}
