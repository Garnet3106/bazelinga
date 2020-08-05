class Popup {
    constructor(langPackMessages) {
        this.$popup = null;
        this.isVisible = false;
        this.messages = langPackMessages;
    }

    addBottomButton(message, onClicked = () => {}, onReady = $button => {}) {
        let $popupBottom = this.$popup.find('.popup-content-bottom');
        let $button = $('<div class="popup-content-bottom-button"></div>');

        $button.text(message);

        $button.on('click', () => {
            onClicked();
        })

        onReady($button);
        $popupBottom.append($button);
    }

    addBottomFileButton(message, onClicked = () => {}, onReady = $input => {}) {
        let $popupBottom = this.$popup.find('.popup-content-bottom');
        let $input = $('<input class="popup-content-bottom-button-file">');

        $input.attr('type', 'file');
        $input.css('display', 'none');
        $input.on('click', onClicked);

        this.addBottomButton(message, () => {
            $input.trigger('click');
        });

        onReady($input);

        $popupBottom.append($input);
    }

    addMainMessage(message) {
        let $main = this.$popup.find('.popup-content-main');
        let $msg = $('<div class="popup-content-main-message"></div>');

        $msg.html(message);
        $main.append($msg);
    }

    addTopIcon(iconURI) {
        let $top = this.$popup.find('.popup-content-top');
        let $topIcon = $('<img class="popup-content-top-icon">');

        $topIcon.attr('src', iconURI);
        $top.append($topIcon);
    }

    addTopTitle(title) {
        let $top = this.$popup.find('.popup-content-top');
        let $topTitle = $('<div class="popup-content-top-title"></div>');

        $topTitle.text(title);
        $top.append($topTitle);
    }

    hide() {
        if(!this.isVisible)
            return;

        this.$popup.css('opacity', '0');
        this.isVisible = false;

        setTimeout(() => {
            this.$popup.remove();
        }, 200);
    }

    setFileDropEvent(onDropped = event => {}) {
        this.$popup.on('dragover', event => {
            event.originalEvent.preventDefault();
        });

        this.$popup.on('dragenter', event => {
            event.originalEvent.preventDefault();
        });

        this.$popup.on('drop', event => {
            onDropped(event);
        });
    }

    show(onReady = () => {}) {
        if(this.isVisible)
            return;

        // 初期化中に表示させないためにポップアップのスタイルは display: none に設定してある
        this.$popup = $('<div class="popup"></div>');
        let $content = $('<div class="popup-content"></div>');
        let $top = $('<div class="popup-content-top"></div>');
        let $main = $('<div class="popup-content-main"></div>');
        let $bottom = $('<div class="popup-content-bottom"></div>');

        $content.append($top);
        $content.append($main);
        $content.append($bottom);

        this.$popup.append($content);

        this.isVisible = true;
        onReady();

        $('#body').append(this.$popup);
        this.$popup.css('display', 'flex');

        // なぜか直後だとアニメーションされないのでtimeoutをもうける
        setTimeout(() => {
            this.$popup.css('opacity', '1');
        }, 50);
    }

    showNotification(message, onOKClicked = () => {}) {
        this.show(() => {
            let iconURI = '../../../lib/dict/img/notice.svg';
            this.addTopIcon(iconURI);
            this.addMainMessage(message);

            this.addBottomButton(this.messages.ok, () => {
                this.hide();
                onOKClicked();
            });
        });
    }

    showConfirmation(message, onYesClicked = () => {}, onNoClicked = () => {}) {
        this.show(() => {
            let iconURI = '../../../lib/dict/img/question.svg';
            this.addTopIcon(iconURI);
            this.addMainMessage(message);

            this.addBottomButton(this.messages.no, () => {
                this.hide();
                onNoClicked();
            });

            this.addBottomButton(this.messages.yes, () => {
                this.hide();
                onYesClicked();
            });
        });
    }
}
