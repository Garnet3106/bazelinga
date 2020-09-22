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


var langData;


// サーバ上のファイルの内容をPromiseで返します
function getFileContent(url) {
    return new Promise((resolve, reject) => {
        fetch(url, {
            cache: 'no-cache',
            mode: 'cors'
        })
            .then(response => {
                if(response.status == 200) {
                    // 成功した場合はresolveにテキストを渡す
                    response.text()
                        .then(text => {
                            resolve(text);
                        });
                } else {
                    // 失敗したらrejectにエラーコードを渡す
                    reject(request.statusText);
                }
            });
    });
}


class Interface {
    // ページのロードが完了していなくても呼び出せます
    constructor(lang) {
        this.lang = lang;

        // 選択された単語リストの項目の番号 (未選択時: -1)
        this.selectedItemIndex = -1;

        // 最後に選択された単語リストの項目のID (未選択時: 空文字)
        this.latestSelectedItemID = '';

        // 選択が変更された際にスタイルを変更する項目のIDセレクタ
        this.susceptibleSideMenuItems = [
            '#leftMenuEdit',
            '#leftMenuRemove',
            '#rightMenuDocs',
            '#rightMenuShare'
        ];

        // ユーザ設定一覧
        this.settings = {
            isPerfectMatchEnable: false,
            matchOnlySpelling: false,
            searchResultLimit: 30,
            inputErrorColor: '#ffdddd'
        };

        this.loadDataFiles();
    }

    addTranslationToWordList(translationList) {
        WordList.addTranslationItems(translationList);

        if(this.latestSelectedItemID != '') {
            let $latestSelectedItem = $('#' + this.latestSelectedItemID);

            // 項目が見つからない場合は選択を解除する
            if($latestSelectedItem === undefined) {
                this.unselectListItem();
                return;
            }

            let index = $latestSelectedItem.index() - 1;

            // インデックスからは1を引かれてるので注意
            if(index >= -1 && $latestSelectedItem.length == 1)
                this.selectListItem(index);
        }
    }

    copyToClipboard(text) {
        // display: none; にすると効かなくなるので注意
        let $clipboardText = $('<div id="clipboardText"></div>');
        $clipboardText.text(text);
        $('#body').append($clipboardText);

        // 一時的に作成した要素を使ってクリップボードにコピーする
        getSelection().selectAllChildren($clipboardText.get());
        document.execCommand('copy');

        // 使用後は削除する
        $clipboardText.remove();
    }

    // サイドメニューの一部項目を選択不可にします (単語が選択解除されたときの処理)
    disableSideMenuItems() {
        let $sideMenus = $('.workarea-sidemenu');
        let $targetItems = $sideMenus.children(this.susceptibleSideMenuItems.join(','));
        let $targetItemIcons = $targetItems.children('.workarea-sidemenu-item-icon');

        // 背景色とカーソルを切り替える
        $targetItems.css('background-color', '#dddddd');
        // カーソルは項目そのものにではなくアイコン側に設定する必要がある
        $targetItemIcons.css('cursor', 'not-allowed');

        // 共有項目を閉じる
        this.collapseMenu('rightMenuShare');
    }

    // サイドメニューの全項目を選択可能にします (単語が選択解除されたときの処理)
    enableSideMenuItems() {
        let $targetItems = $('.workarea-sidemenu-item');
        let $targetItemIcons = $targetItems.children('.workarea-sidemenu-item-icon');

        // 背景色とカーソルを切り替える
        $targetItems.css('background-color', '#ffffff');
        // カーソルは項目そのものにではなくアイコン側に設定する必要がある
        $targetItemIcons.css('cursor', 'pointer');
    }

    expandShareMenu() {
        let $rightMenuShare = $('#rightMenuShare');

        // アイコンがすでに表示されている場合は閉じる
        if($rightMenuShare.children().length > 1) {
            this.collapseMenu('rightMenuShare');
            return;
        }

        if(this.selectedItemIndex == -1)
            return;

        // リンク共有アイコン
        let $linkShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareLink"></div>');
        // Twitter共有アイコン
        let $twitterShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareTwitter"></div>');

        $linkShareIcon.on('click', () => {
            // ドキュメントURLをクリップボードにコピーしてメニューを閉じる
            this.copyToClipboard(this.dict.getDocsURI(this.selectedItemIndex));
            this.collapseMenu('rightMenuShare');
            Popup.showNotification(langData.messages.copiedTheTextToTheClipboard);
        });

        $twitterShareIcon.on('click', () => {
            // Twitterのシェアリンクを新規タブで開いてメニューを閉じる
            open(this.dict.getTwitterShareLink(this.selectedItemIndex));
            this.collapseMenu('rightMenuShare');
        });

        $rightMenuShare.append($linkShareIcon);
        $rightMenuShare.append($twitterShareIcon);

        $rightMenuShare.find('.workarea-sidemenu-item-icon').css('cursor', 'pointer');
    }

    hideGuideMessage() {
        $('#wordListGuide').hide();
    }

    collapseMenu(id) {
        let $sideMenuItems;

        // 引数をもとに対象のメニューアイテムを取り出す
        if(id === undefined) {
            // idの指定がない場合はすべてのメニュー項目を対象にする
            $sideMenuItems = $('.workarea-sidemenu-item');
        } else {
            $sideMenuItems = $('#' + id);
        }

        $sideMenuItems.each((item_i, item) => {
            let $item = $(item);
            let parentID = $item.parent().attr('id');
            // 除外するインデックス = TopIconのインデックス (left: 0, right: 最後のインデックス)
            let exceptIndex = 0;

            if(parentID == 'leftMenu')
                exceptIndex = $item.children().length - 1;

            $item.children().each((icon_i, icon) => {
                let $icon = $(icon);
                // インデックスが除外対象であればreturn
                if(icon_i == exceptIndex)
                    return;

                $icon.remove();
            });
        });
    }

    init() {
        $(() => {
            this.logInitialMessages();

            $('title').text(langData.dictionary.pageTitle);
            $('#searchInput').attr('placeholder', langData.messages.searchKeyword);

            // 単語リストの初期的なガイドメッセージを設定する
            this.setGuideMessage(langData.messages.theSearchResultsWillBeDisplayedHere);
            this.showGuideMessage();

            // 各種イベントを設定する
            this.initAllEvents();

            this.disableSideMenuItems();
            this.setSideMenuObserver();
            this.setInitialKeyword();
        });
    }

    initAllEvents() {
        this.initLeftMenuEvents();
        this.initRightMenuEvents();
        this.initOtherEvents();
    }

    initLeftMenuEvents() {
        $('#leftMenuAddTop').on('click', () => {
            PopupManager.showWordAdditionPopup();
        });

        $('#leftMenuEditTop').on('click', () => {
            // 未選択の場合は弾く
            if(this.selectedItemIndex == -1)
                return;

            PopupManager.showWordEditionPopup();
        });

        $('#leftMenuRemoveTop').on('click', () => {
            // 未選択の場合は弾く
            if(this.selectedItemIndex == -1)
                return;

            PopupManager.showRemovePopup();
        });

        $('#leftMenuUploadTop').on('click', () => {
            PopupManager.showUploadPopup();
        });

        $('#leftMenuDownloadTop').on('click', () => {
            PopupManager.showDownloadPopup();
        });
    }

    initOtherEvents() {
        $('.bottomlinks-item').on('click', event => {
            // 下部リンクの項目のIDは 'bottomLinkItem_{言語名}' である必要があります
            let $target = $(event.target);
            let langName = $target.attr('id').split('_')[1];

            this.jumpToDictPage(langName);
        });

        $('#searchInput').on('input', () => {
            this.updateWordList();
        });
    }

    initRightMenuEvents() {
        $('#rightMenuDocsTop').on('click', () => {
            // 未選択の場合は弾く
            if(this.selectedItemIndex == -1)
                return;

            location.href = this.dict.getDocsURI(this.selectedItemIndex);
        });

        $('#rightMenuShareTop').on('click', () => {
            // 未選択の場合は弾く
            if(this.selectedItemIndex == -1)
                return;

            this.expandShareMenu();
        });

        $('#rightMenuSettingsTop').on('click', () => {
            PopupManager.showSettingsPopup();
        });
    }

    static isFileAPIValid() {
        return window.File && window.FileReader && window.Blob;
    }

    static isSearchResultLimitValid(searchResultLimit) {
        return !(isNaN(searchResultLimit) || searchResultLimit < -1
            || searchResultLimit === 0 || searchResultLimit === Infinity);
    }

    jumpToDictPage(langName) {
        location.href = 'https://garnet3106.github.io/native-baze-dictionary/' + langName;
    }

    // 必要なファイルをすべて読み込みます
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
                console.log(error)
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
                console.log(error);
            });
        };

        // ロード処理を開始
        loadLangPackData();
    }

    static log(message, cssProperties) {
        let propertyItems = [];

        // 連想配列のCSSプロパティを文字列に変換する
        Object.keys(cssProperties).forEach(name => {
            propertyItems.push(name + ':' + cssProperties[name]);
        });

        let strProperties = propertyItems.join(';');
        console.log('%c' + message, strProperties);
    }

    static logError(message) {
        Interface.log('[ERROR] ' + message, {
            'color': 'red'
        });
    }

    logInitialMessages() {
        Interface.log('把日辞書 検索ツール', {
            'background': 'lime',
            'border-radius': '10px',
            'color': 'royalblue',
            'font-size': '30px',
            'font-weight': 'bold',
            'margin': '15px 0',
            'padding': '5px 40px'
        });

        Interface.log('\n' + langData.orinChanAA + '\n', {
            'color': 'red',
            'font-size': '10px'
        });

        Interface.log('Mi baze linga es bon linga!', {
            'background': 'deepskyblue',
            'color': 'red',
            'border-bottom': '5px solid royalblue',
            'border-radius': '10px',
            'font-family': 'serif',
            'font-size': '30px',
            'font-weight': 'bold',
            'margin': '15px 0',
            'padding': '10px 15px'
        });

        Interface.log('Vimビーム！！！！！', {
            'background': 'linear-gradient(to right, #ff0000 0, #0000ff 33.3%, #00ffff 66.6%, #00ff00 100%)',
            'border-radius': '10px',
            'color': 'yellow',
            'font-size': '30px',
            'font-style': 'italic',
            'font-weight': 'bold',
            'margin': '15px 0',
            'padding': '20px',
            'text-align': 'center'
        });
    }

    // 設定の保存に成功した場合はtrue、そうでない場合はfalseを返します
    saveSettings(perfectMatch, matchOnlySpelling, searchResultLimit) {
        // 完全一致かどうか
        this.settings.isPerfectMatchEnable = perfectMatch;

        // スペルのみの検索にするかどうか
        this.settings.matchOnlySpelling = matchOnlySpelling;

        // 検索時の単語数の制限
        if(!Interface.isSearchResultLimitValid(searchResultLimit)) {
            Popup.showNotification(langData.messages.theInputtedNumberIsInvalid);
            return false;
        }

        this.settings.searchResultLimit = searchResultLimit;

        // 検索条件が変更された場合のために単語リストを更新する
        this.updateWordList();

        return true;
    }

    // 設定の保存に成功した場合はgetTranslationInputData()の結果を、そうでない場合はfalseを返します
    saveInputtedTranslationData($inputArea) {
        let newTranslation = PopupManager.getTranslationInputData($inputArea);

        if(newTranslation.length == 0) {
            Popup.showNotification(langData.messages.theTranslationIsNotInputted);
            return false;
        }

        // 入力が正しくない場合は弾く
        for(let transInput of $inputArea.find('input').get()) {
            let isTranslationValid = this.dict.isTranslationValid($(transInput).val());

            if(isTranslationValid !== true) {
                Popup.showNotification(isTranslationValid);
                return false;
            }
        }

        return newTranslation;
    }

    selectListItem(index) {
        let $itemList = $('.workarea-wordlist-item');

        if(index >= $itemList.length)
            return;

        let $item = $itemList.eq(index);
        let tmpLatestID = $item.attr('id');

        // 選択する前に他の選択を解除
        this.unselectListItem();

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
            let $children = $target.children();

            // 横幅をアニメーションをつけて操作する
            // transitionには初期値が必要なので div.workarea-sidemenu-item で width: 40px; にしてある
            let width = $children.length * 40;
            $target.css('width', width + 'px');
        });

        let options = {
            childList: true
        };

        $('.workarea-sidemenu-item').each((elem_i, elem) => {
            this.sideMenuObserver.observe(elem, options);
        });
    }

    showGuideMessage() {
        $('#wordListGuide').show();
    }

    unselectListItem() {
        // 選択されていた単語の背景を戻す
        let $items = $('.workarea-wordlist-item');
        $items.css('background-color', '#ffffff');

        this.disableSideMenuItems();

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
        this.unselectListItem();
        this.latestSelectedItemID = tmpLatestID;

        let keyword = Dictionary.formatSearchKeyword($searchInput.val());

        if(keyword == '') {
            this.setGuideMessage(langData.messages.theSearchResultsWillBeDisplayedHere);
            this.showGuideMessage();
            return;
        }

        let translationList = this.dict.search(keyword, this.settings.searchResultLimit, this.settings.isPerfectMatchEnable, this.settings.matchOnlySpelling);

        if(translationList.length == 0) {
            this.setGuideMessage(langData.messages.theWordHasNotFound);
            this.showGuideMessage();
            return;
        }

        //this.setGuideMessage(langData.messages.theSearchResultsWillBeDisplayedHere);
        this.hideGuideMessage();
        this.addTranslationToWordList(translationList);
    }
}
