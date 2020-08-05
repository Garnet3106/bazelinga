'use strict';


class Popup {
    constructor() {
        this.$elem = null;
        this.isVisible = false;
    }

    addBottomButton(message, onButtonClicked = $button => {}, onButtonReady = $button => {}) {
        let $popupBottom = this.$elem.find('.popup-content-bottom');
        let $button = $('<div class="popup-content-bottom-button"></div>');

        $button.text(message);

        $button.on('click', () => {
            onButtonClicked($button);
        })

        onButtonReady($button);
        $popupBottom.append($button);
    }

    addMainMessage(message) {
        let $main = this.$elem.find('.popup-content-main');
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

    // onDropped() の第一引数には event.originalEvent が渡されます
    setFileDropEvent(onFileDropped = event => {}) {
        this.$elem.on('dragover', event => {
            event.originalEvent.preventDefault();
        });

        this.$elem.on('dragenter', event => {
            event.originalEvent.preventDefault();
        });

        this.$elem.on('drop', event => {
            event.originalEvent.preventDefault();
            onFileDropped(event.originalEvent);
        });
    }

    setFileSelectEvent(onFileSelected = event => {}) {
        let $popupBottom = this.$elem.find('.popup-content-bottom');
        let $input = $('<input class="popup-content-bottom-button-file">');

        $input.attr('type', 'file');
        $input.css('display', 'none');
        $popupBottom.append($input);

        this.$elem.find('.popup-content-main').on('click', () => {
            $input.trigger('click');
        });

        // ファイルが選択された場合
        this.$elem.on('change', event => {
            onFileSelected(event.originalEvent);
        });
    }

    static show(onReady = popup => {}) {
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

        onReady(popup);

        $('#body').append($elem);
        $elem.css('display', 'flex');

        // 直後だとアニメーションされないのでtimeoutをもうける
        setTimeout(() => {
            $elem.css('opacity', '1');
        }, 50);
    }

    static showConfirmation(message, onYesButtonClicked = $button => {}, onNoButtonClicked = $button => {}) {
        Popup.show(popup => {
            let iconURI = '../../../lib/dict/img/question.svg';
            popup.addTopIcon(iconURI);
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
            let iconURI = '../../../lib/dict/img/notice.svg';
            popup.addTopIcon(iconURI);
            popup.addMainMessage(message);

            popup.addBottomButton(langData.messages.ok, $button => {
                popup.hide();
                onOKButtonClicked($button);
            });
        });
    }
}
