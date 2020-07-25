/*
 * 辞書検索のインタフェース周りを扱う
 */
class Interface {
    constructor(lang) {
        this.dict = new Dictionary(lang);
        this.lang = lang;

        this.dict.load(() => {
            // ロード成功時
            this.init()
        }, (jqXHR, status, error) => {
            console.log('Failed to load data file.');
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

    hideShareMenu() {
        $menuItem.children('#rightMenuShareLink').remove();
        $menuItem.children('#rightMenuShareTwitter').remove();
    }

    init() {
        $(() => {
            // 使用するエレメントを格納 (効率悪い？)
            this.$searchInput = $('#searchInput');
            this.$rightMenuDocsTop = $('#rightMenuDocsTop');
            this.$rightMenuShare = $('#rightMenuShare');
            this.$rightMenuShareTop = $('#rightMenuShareTop');

            this.$searchInput.on('input', this.onSearchKeywordChanged);
            this.$rightMenuDocsTop.on('click', this.onDocsTopClicked);
            this.$rightMenuShareTop.on('click', this.onShareTopClicked);

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

    onSearchKeywordChanged() {
        this.updateWordList();
    }

    onShareTopClicked() {
        // アイコンがすでに表示されている場合は閉じる
        if(this.$rightMenuShare.children().length > 1) {
            this.hideShareMenu();
            return;
        }

        if(this.selectedItemIndex == -1) {
            alert('単語を選択してください。');
            return;
        }

        $linkShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareLink"></div>');
        $twitterShareIcon = $('<div class="workarea-sidemenu-item-icon" id="rightMenuShareTwitter"></div>');

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

        $menuItem.append($linkShareIcon);
        $menuItem.append($twitterShareIcon);
    }

    setSideMenuObserver() {
        // サイドメニューの変更イベントを監視
        this.sideMenuObserver = new MutationObserver(event => {
            let $target = $(event[0].target);

            // 横幅をアニメーションをつけて操作する
            $target.animate({
                width: $target.children().length * 40
            }, 500);

            let options = {
                childList: true
            };

            $('.workarea-sidemenu-item').each((i, elem) => {
                this.sideMenuObserver.observe(elem, options);
            });
        });
    }
}
