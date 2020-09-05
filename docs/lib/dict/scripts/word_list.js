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


class WordList {
    // 翻訳リストをもとに単語リストに項目を追加します
    static addTranslationItems(translationList) {
        translationList.forEach(translation => {
            let $list = $('#wordList');
            let translationClass = langData.classes[translation.class];

            // 翻訳の項目全体
            let $elem = $('<div class="workarea-wordlist-item"></div>');
            $elem.attr('id', 'wordListItem_' + translation.index);

            // 翻訳のスペリング
            let $elemSpelling = $('<div class="workarea-wordlist-item-spelling"></div>');
            $elem.append($elemSpelling);

            // 翻訳の種類
            let $elemType = $('<div class="workarea-wordlist-item-type"></div>');
            $elemSpelling.text(translation.spelling);
            $elemType.text('[' + langData.types[translation.type] + ']');
            $elem.append($elemType);

            // 翻訳のクラスが 'general' 以外の場合はクラス表記を追加する
            if(translation.class != 'gen') {
                let $elemClass = $('<div class="workarea-wordlist-item-class"></div>');
                $elemClass.text('[' + translationClass + ']');
                $elem.append($elemClass);
            }

            let $elemTranslationWords = $('<div class="workarea-wordlist-item-translation"></div>');
            $elemTranslationWords.text(translation.words.join(', '));
            $elem.append($elemTranslationWords);

            WordList.initTranslationItemEvent($elem, translation);

            $list.append($elem);
        });
    }

    // 翻訳の項目のイベントを設定します
    static initTranslationItemEvent($elem, translation) {
        let $input = $('#searchInput');

        // クリックイベントを設定
        $elem.on('click', elem => {
            let $target = $(elem.target);
            let formattedKeyword = Dictionary.formatSearchKeyword($input.val());

            if($target.attr('class') != 'workarea-wordlist-item')
                $target = $target.parent();

            let index = $target.index() - 1;

            // 選択済みの項目がクリックされた場合
            if($target.attr('id') == mainInterface.latestSelectedItemID) {
                mainInterface.unselectListItem();
                return;
            }

            mainInterface.selectListItem(index);

            // キーワードが変更された場合のみ入力欄のvalueを変更
            if(formattedKeyword != translation.spelling) {
                $input.val(translation.spelling);
                // val() ではイベントが発火しないので手動で処理
                $input.trigger('input');
            }
        });
    }
}
