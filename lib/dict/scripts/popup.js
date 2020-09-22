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


class Popup {
    constructor() {
        this.$elem = null;
        this.isVisible = false;
    }

    // 引数 $button はボタンに使用される要素です (デフォルトはdiv要素)
    addBottomButton(message, onButtonClicked = $button => {}, onButtonReady = $button => {}, $button = $('<div class="popup-content-bottom-button"></div>')) {
        let $popupBottom = this.$elem.find('.popup-content-bottom');

        $button.text(message);

        $button.on('click', () => {
            onButtonClicked($button);
        })

        onButtonReady($button);
        $popupBottom.append($button);
    }

    addMainMessage(message) {
        // アップロード用のポップアップにも対応する
        let $main = this.$elem.find('.popup-content-main,.popup-content-upload');
        let $msg = $('<div class="popup-content-main-message"></div>');

        $msg.html(message);
        $main.append($msg);
    }

    addTopIcon(iconURI) {
        let $top = this.$elem.find('.popup-content-top');
        let $topIcon = $('<img class="popup-content-top-icon">');

        $topIcon.attr('src', iconURI);
        $top.append($topIcon);
    }

    addTopTitle(title) {
        let $top = this.$elem.find('.popup-content-top');
        let $topTitle = $('<div class="popup-content-top-title"></div>');

        $topTitle.text(title);
        $top.append($topTitle);
    }

    hide() {
        if(!this.isVisible)
            return;

        this.$elem.css('opacity', '0');
        this.isVisible = false;

        setTimeout(() => {
            this.$elem.remove();
        }, 200);
    }

    static show(onPopupReady = popup => {}) {
        let popup = new Popup();

        // 初期化中に表示させないためにポップアップのスタイルは display: none に設定してある
        let $elem = $('<div class="popup"></div>');
        let $content = $('<div class="popup-content"></div>');
        let $top = $('<div class="popup-content-top"></div>');
        let $main = $('<div class="popup-content-main"></div>');
        let $bottom = $('<div class="popup-content-bottom"></div>');

        $content.append($top);
        $content.append($main);
        $content.append($bottom);
        $elem.append($content);

        popup.$elem = $elem;
        popup.isVisible = true;

        onPopupReady(popup);

        $('#body').append($elem);
        $elem.css('display', 'flex');

        // 直後だとアニメーションされないのでtimeoutをもうける
        setTimeout(() => {
            $elem.css('opacity', '1');
        }, 50);
    }

    static showConfirmation(message, onYesButtonClicked = $button => {}, onNoButtonClicked = $button => {}) {
        Popup.show(popup => {
            let iconURI = 'https://bazelinga.gant.work/lib/dict/img/question.svg';
            popup.addTopIcon(iconURI);
            popup.addTopTitle(langData.messages.confirmationPopup);
            popup.addMainMessage(message);

            popup.addBottomButton(langData.messages.no, $button => {
                popup.hide();
                onNoButtonClicked($button);
            });

            popup.addBottomButton(langData.messages.yes, $button => {
                popup.hide();
                onYesButtonClicked($button);
            });
        });
    }

    static showNotification(message, onOKButtonClicked = $button => {}) {
        Popup.show(popup => {
            let iconURI = 'https://bazelinga.gant.work/lib/dict/img/notice.svg';
            popup.addTopIcon(iconURI);
            popup.addMainMessage(message);

            popup.addBottomButton(langData.messages.ok, $button => {
                popup.hide();
                onOKButtonClicked($button);
            });
        });
    }
}
