class LangPack {
    constructor(lang) {
        this.data = {};
        this.lang = lang;
        this.ready = false;
    }

    /*
     * 設定された言語のデータを返す
     */
    getData() {
        return this.data[this.lang];
    }

    load(succeeded = () => {}, failed = (jqXHR, status, error) => {}) {
        let uri = 'http://bazelinga.gant.work/docs/lib/dict/data/langpack.json';

        let options = {
            dataType: 'json',
            timespan: 5000,
            url: uri
        };

        $.ajax(options)
            .done(data => {
                // ロード成功時
                this.data = data;
                this.ready = true;

                succeeded();
            })
            .fail((jqXHR, status, error) => {
                // ロード失敗時
                failed(jqXHR, status, error);
            });
    }
}
