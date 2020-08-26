let $targetLangList = document.getElementsByClassName('language-list')[1];
let $targetLangListItems = $targetLangList.getElementsByClassName('language_list_section')[1].getElementsByClassName('language_list_item_wrapper');
let $targetLangListButton = document.getElementsByClassName('tlid-open-target-language-list')[0];


function closeTargetLangList() {
    if(isTargetLangListOpened()) {
        $targetLangListButton.click();
    }
}

function getTranslationResult() {
    let $translationResultWrapper = document.getElementsByClassName('tlid-translation');

    if($translationResultWrapper === undefined)
        return '';

    $translationResult = $translationResultWrapper[0].getElementsByTagName('span')[0];

    if($translationResult === undefined)
        return '';

    return $translationResult.innerText;
}

function isTargetLangListOpened() {
    return $targetLangList.style.display != 'none';
}

function openTargetLangList() {
    if(!isTargetLangListOpened()) {
        $targetLangListButton.click();
    }
}

function printResult(array) {
    let output = Object.values(array).sort();
    console.log(output.join('\n'));
}

function setTargetLangListItem(index) {
    let $item = $targetLangListItems[index]

    if($item === undefined)
        return '';

    $item.click()
    return $item.className.slice(-2);
}

// 指定された言語の言語コード(2文字)を返します
function switchTargetLang(index) {
    openTargetLangList();
    return setTargetLangListItem(index);
}


closeTargetLangList();

let result = [];

let index = 0;
let latestLangCode = '';

let interval = setInterval(() => {
    if(index > 0)
        result[latestLangCode] = getTranslationResult();

    if(index > 108) {
        closeTargetLangList();
        clearInterval(interval);
        printResult(result);
    }

    latestLangCode = switchTargetLang(index);

    index++;
}, 800);
