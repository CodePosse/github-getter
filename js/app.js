(function (mih, $, undefined) {
    (function (fed, $, undefined) {

        fed.GithubGetter = function (options) {

            var self = this;

            self.ui = {

                init: function () {


                    /*
                     SYSTEM PROPERTIES
                     */

                    self.ui.events = {
                        CLICK: 'click',
                        KEYUP: 'keyup',
                        REPOSITORY_SELECT: 'repositorySelect'
                    }

                    self.ui.$$loading = null;
                    Object.defineProperty(self.ui, '$loading', {
                        get: function () {
                            return this.$$loading
                        },
                        set: function (value) {
                            this.$$loading = value;
                            value ? this.$loadingContainer.show() : this.$loadingContainer.hide();
                            value ? this.$listContainer.hide() : this.$listContainer.show();
                        }
                    });

                    self.ui.$$error = null;
                    Object.defineProperty(self.ui, '$error', {
                        get: function () {
                            return this.$$error
                        },
                        set: function (value) {
                            this.$$error = value;
                            value ? this.$errorContainer.show() : this.$errorContainer.hide();
                        }
                    });


                    /*
                     DOM MANAGEMENT
                     */

                    self.ui.$rootContainer = $('.mih-fed-gitget');
                    self.ui.$listContainer = $('.list-container').hide();
                    self.ui.$detailsContainer = $('.details-container').hide();
                    self.ui.$loadingContainer = $('.loading-container').hide();
                    self.ui.$errorContainer = $('.error-container').hide();

                    self.ui.$searchInput = $('.search-input')
                        .on(self.ui.events.KEYUP, function (event) {
                            if (event.target.value.length > 5) {
                                self.ui.triggerSearch();
                            }
                        });

                    self.ui.$searchTrigger = $('.search-trigger')
                        .on(self.ui.events.CLICK, function () {
                            self.ui.triggerSearch();
                        });

                    self.ui.$rootContainer.on(self.ui.events.REPOSITORY_SELECT, function (event, args) {
                        var item = args.data;
                        var data = self.ui.renderDetails({data: item});
                        self.ui.$detailsContainer
                            .html(data)
                            .show()
                            .on(self.ui.events.CLICK, function () {
                                self.ui.$detailsContainer
                                    .html('')
                                    .hide();
                            });
                    });


                    /*
                     PUBLIC FUNCTIONS
                     */

                    self.ui.triggerSearch = function () {

                        var query = self.ui.$searchInput.val();
                        self.ui.$loading = self.service.searchRepositories(query).then(
                            function (result) {

                                self.data.cache = result = result.items; // GitHub result format

                                result = _.map(result, function (item) {
                                    item = {
                                        id: item.id,
                                        name: item.name,
                                        owner: item.owner.login,
                                        language: item.language
                                    }
                                    return item;
                                });
                                result = self.ui.renderList(result);
                                self.ui.$listContainer.html(result);

                                $('.list-item > td > button').on(self.ui.events.CLICK, self.ui.itemSelectEventHandler);
                            },
                            function (error) {
                                self.ui.$error = error;
                            })
                            .always(function () {
                                self.ui.$loading = null;
                            });
                    }

                    self.ui.itemSelectEventHandler = function (event) {
                        // HACK not good to use parentElements, but a quick fix
                        var index = event.currentTarget.parentElement.parentElement.attributes['data-index'].value;
                        index = Number(index);
                        var item = self.data.cache[index];
                        self.ui.$rootContainer.trigger(self.ui.events.REPOSITORY_SELECT, { data: item });
                    }


                    /*
                     RENDER FUNCTIONS
                     */

                    self.ui.renderList = function (items) {
                        items = _.map(items, function (item, index) {
                            item = _.extend(item, {
                                index: index
                            });
                            item = self.ui.templates.repositoryListItem({data: item});
                            return item;
                        });
                        items = items.join('');
                        items = self.ui.templates.repositoryList({data: items});
                        return items;
                    }

                    self.ui.renderDetails = function (item) {
                        item = self.ui.templates.repositoryDetails(item)
                        return item;
                    }


                    /*
                     TEMPLATING
                     */
                    _.templateSettings = {
                        interpolate: /\{\{(.+?)\}\}/g
                    };
                    self.ui.templates = {
                        repositoryList: _.template('' +
                            '<table>' +
                                '<thead>' +
                                    '<tr>' +
                                        '<th>Name</th>' +
                                        '<th>Owner</th>' +
                                        '<th>Language</th>' +
                                    '</tr>' +
                                '</thead>' +
                                '{{data}}' +
                            '</table>'),
                        repositoryListItem: _.template('' +
                            '<tr class="list-item" data-id="{{data.id}}" data-index="{{data.index}}">' +
                                '<td><span class="name">{{data.name}}</span></td>' +
                                '<td><span class="owner">{{data.owner}}</span></td>' +
                                '<td><span class="language">{{data.language}}</span></td>' +
                                '<td><button type="button">Show</button></td>' +
                            '</tr>'),
                        repositoryDetails: _.template('' +
                            '<table>' +
                                '<tr><td><span class="label name-label">Name:</span></td><td><span class="name">{{data.name}}</span></td></tr>' +
                                '<tr><td><span class="label description-label">Description:</span></td><td><span class="description">{{data.description}}</span></td></tr>' +
                                '<tr><td><span class="label url-label">URL:</span></td><td><span class="url"><a href="{{data.html_url}}" target="_blank">{{data.html_url}}</a></span></td></tr>' +
                                '<tr><td><span class="label language-label">Language:</span></td><td><span class="language">{{data.language}}</span></td></tr>' +
                                '<tr><td><span class="label watchers-label">Watchers:</span></td><td><span class="watchers">{{data.watchers}}</span></td></tr>' +
                            '</table>')
                    }
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


            self.data = {
                cache: null
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
    var gitget = new mih.fed.GithubGetter(options);
    gitget.init();
});
