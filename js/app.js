(function (mih, $, undefined) {
    (function (fed, $, undefined) {

        fed.Test = function (options) {

            var self = this;

            self.ui = {

                init: function () {

                    self.ui.$searchInput = $('.search-input')
                        .on('keyup', function (event) {
                            if (event.target.value.length > 5) {
                                self.ui.triggerSearch();
                            }
                        });

                    self.ui.$searchTrigger = $('.search-trigger')
                        .on('click', function () {
                            self.ui.triggerSearch();
                        });

                    self.ui.$listContainer = $('.list-container');
                    self.ui.$itemContainer = $('.item-container');
                    self.ui.$loadingContainer = $('.loading-container').hide();
                    self.ui.$errorContainer = $('.error-container').hide();

                    self.ui.triggerSearch = function () {
                        var query = self.ui.$searchInput.val();
                        self.ui.$loading = self.service.searchRepositories(query).then(
                            function (result) {
                                result = result.items; // GitHub result format
                                result = _.map(result, function (item) {
                                    return {
                                        name: item.name,
                                        owner: item.owner.login
                                    }
                                });
                                result = JSON.stringify(result);
                                self.ui.$listContainer.text(result);
                            },
                            function (error) {
                                self.ui.$error = error;
                            })
                            .always(function () {
                                self.ui.$loading = null;
                            });
                    }

                    self.ui.$$loading = null;
                    Object.defineProperty(self.ui, '$loading', {
                        get:function() { return this.$$loading },
                        set:function(value) {
                            this.$$loading = value;
                            value ? this.$loadingContainer.show() : this.$loadingContainer.hide();
                        }
                    });

                    self.ui.$$error = null;
                    Object.defineProperty(self.ui, '$error', {
                        get:function() { return this.$$error },
                        set:function(value) {
                            this.$$error = value;
                            value ? this.$errorContainer.show() : this.$errorContainer.hide();
                        }
                    });
                }
            }

            self.service = {
                searchRepositories: function (query) {
                    var q = $.Deferred();
                    var settings = {
                        url: options.api.baseUrl + '/search/repositories',
                        type: 'GET',
                        data: { q: query },
                        success: function (data) {
                            q.resolve(data);
                        },
                        error: function (error) {
                            q.reject(error);
                        }
                    }
                    $.ajax(settings);
                    return q;
                }
            }

            self.init = function () {
                self.ui.init();
            }
        }

    }(mih.fed = mih.fed || {}, jQuery));
}(window.mih = window.mih || {}, jQuery));

$(document).ready(function () {
    var options = {
        api: {
            baseUrl: 'https://api.github.com'
        }
    }
    var test = new mih.fed.Test(options);
    test.init();
});
