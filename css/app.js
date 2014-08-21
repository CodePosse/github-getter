var MIH = MIH || {},
    $ = jQuery || {},
    win = window || {};

MIH.FEDTest = {

  query: '',

  $el: $.noop(),

  DOS: function() {
    // Prevent DOS abuse:
    return (this.timer.count !== 1000);
  },

  DOM: function() {
    var $el = this.$el;
    return {
      $input: $el.find("#search"),
      $details: $el.find("#overlay-container"),
      $results: $el.find("#results-container ul"),
      $tmplResult: $el.find("#tmplResult").html(),
      $tmplDetail: $el.find("#tmplDetail").html()
    };
  },

  DATA: {
    search: 'https://api.github.com/legacy/repos/search/'
  },

  cache: (function(ss) {
    ss = ss || {
      setItem: function(k, v) { this[k] = v; },
      getItem: function(k) { return this[k]; }
    };
    return {
      set: function(k, v) { ss.setItem(k, JSON.stringify(v)); },
      get: function(k) { return JSON.parse(ss.getItem(k)); }
    };			
  })(win.sessionStorage),

  timer: {
    id: 0,
    count: 1000,
    start: function(cb, context) {
      var timer = this;
      console.info('Timer started', timer.count);
      timer.id = win.setInterval(function(){
        if (timer.count <= 0) {
          return timer.reset();
        }
        timer.count -= 100;
      }, 100);
      cb.call(context);
    },
    reset: function() {
      if (this.id) {
        win.clearInterval(this.id);
        this.count = 1000;
        this.id = 0;
      }
    }
  },

  getGitHubResults: function(event) {
    console.info('Event called:', 'getGitHubResults');

    if ('keyup' === event.type && 13 !== event.which) {
      /* Exit if not Enter/Return key press */ return false;			
    }

    var query = this.DOM.$input.val() || this.defaults.query,
        data = this.cache.get(query);

    if (data) {
      
      // get results from cache
      this.renderResults(data);

    } else if (!this.DOS()) {

      console.info('New search!');
      this.timer.start(function() {
        $.getJSON(
          this.DATA.search + this.query,
          this.renderResults.bind(this)
        );
      }, this);

    } else {

      console.info('else conditional');
      // Please wait message

    }

    event.preventDefault();
    this.query = query;
    return false;
  },

  renderResults: function(data) {
    var dom = this.DOM,
        cache = this.cache,
        query = this.query,
        tmpl = dom.$tmplResult,
        $results = dom.$results,
        repos = data.repositories,
        queries = cache.get('queries');

    $results.empty();
    queries.push(query);
    cache.set(query, data);
    cache.set('queries', queries);

    repos.forEach(function(v) {
      var $docfrag = $(tmpl);
      $docfrag.data('details', v);
      $docfrag.find('.name').html(v.name);
      $docfrag.find('.owner').html(v.owner);
      $results.append($docfrag);
    });

    $results.parent().show('slow');
    return $results;
  },

  getGitHubDetails: function(event) {
    console.info('Event called:', 'getGitHubDetails');
    var $dataItem = $(event.target).closest('li');
    this.renderDetails($dataItem.data('details'));
    event.preventDefault();
    return false;
  },

  renderDetails: function(data) {
    var dt, prop, dom = this.DOM,
        $tmpl = $(dom.$tmplDetail),
        $details = dom.$details.empty();

    for (prop in data) {
      if ('url' === prop) {
        data[prop] = '<a href="'+ encodeURI(data[prop]) +'" target="gh">Go to Repo</a>';
      } else if ('pushed' === prop && (dt = new Date(data[prop]))) {
        data[prop] = dt.toLocaleDateString() +' @ '+ dt.toLocaleTimeString();
      }
      $tmpl.find('.'+prop).html(data[prop]);
    }

    $details.empty().html($tmpl).show();
    return $details;
  },

  closeOverlay: function(event) {
    return $(event.target).is('a')? event : this.DOM.$details.hide();
  },

  bindEvents: function() {
    var e, arr;
    for (e in this.events) {
      arr = e.split(/^(\w+)\s/);
      if (!arr.shift() && arr.length === 2) {
        this.$el.on( arr[0], arr[1], this[this.events[e]].bind(this) );
      }
    }
  },

  events: {
    'click #results-container li': 'getGitHubDetails',
    'click #overlay-container': 'closeOverlay',
    'click #search-submit': 'getGitHubResults',
    'keyup #search': 'getGitHubResults'
  },

  init: function() {
    this.cache.set('queries', ['Joe']);
    this.defaults = { query: [''] };
    this.$el = $("#ghSearch");
    this.DOM = this.DOM();
    this.bindEvents();
  }

};

$(function() { MIH.FEDTest.init(); });
