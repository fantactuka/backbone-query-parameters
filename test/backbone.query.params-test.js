$(function() {

  var router = null,
      fakeLocation = null,
      lastRoute = null,
      lastArgs = [];

  function onRoute(router, route, args) {
    lastRoute = route;
    lastArgs = args;
  }

  function navigate(route) {
    Backbone.history.navigate(route, {trigger: true});
    Backbone.history.checkUrl();
  }

  var FakeLocation = function(href) {
    this.replace(href);
  };

  _.extend(FakeLocation.prototype, {
    replace: function(href) {
      _.extend(this, _.pick($('<a></a>', {href: href})[0],
          'href',
          'hash',
          'host',
          'search',
          'fragment',
          'pathname',
          'protocol'
      ));
      // In IE, anchor.pathname does not contain a leading slash though
      // window.location.pathname does.
      if (!/^\//.test(this.pathname)) this.pathname = '/' + this.pathname;
    },

    toString: function() {
      return this.href;
    }
  });

  var Router = Backbone.Router.extend({

    count: 0,

    routes: {
      "noCallback": "noCallback",
      "counter": "counter",
      "search/:query": "search",
      "search/:query/p:page": "search",
      "contacts": "contacts",
      "contacts/new": "newContact",
      "contacts/:id": "loadContact",
      "optional(/:item)": "optionalItem",
      "named/optional/(y:z)": "namedOptional",
      "splat/*args/end": "splat",
      "*first/complex-:part/*rest": "complex",
      "*anything": "anything"
    },

    initialize: function(options) {
      this.testing = options.testing;
      this.route('implicit', 'implicit');
    },

    counter: function() {
      this.count++;
    },

    implicit: function() {
      this.count++;
    },

    search: function(query, page, queryParams) {
      this.query = query;
      this.page = page;
      this.queryParams = queryParams;
    },

    contacts: function() {
      this.contact = 'index';
    },

    newContact: function() {
      this.contact = 'new';
    },

    loadContact: function() {
      this.contact = 'load';
    },

    optionalItem: function(arg) {
      this.arg = arg != void 0 ? arg : null;
    },

    splat: function(args) {
      this.args = args;
    },

    complex: function(first, part, rest) {
      this.first = first;
      this.part = part;
      this.rest = rest;
    },

    anything: function(whatever) {
      this.anything = whatever;
    },

    namedOptional: function(z) {
      this.z = z;
    }
  });


  module("Backbone.QueryParams", {
    setup: function() {
      fakeLocation = new FakeLocation('http://example.com');
      Backbone.history = _.extend(new Backbone.History, {location: fakeLocation});
      router = new Router({testing: 101});
      Backbone.history.interval = 9;
      Backbone.history.start({pushState: false});
      lastRoute = null;
      lastArgs = [];
      Backbone.history.on('route', onRoute);
    },

    teardown: function() {
      Backbone.history.stop();
      Backbone.history.off('route', onRoute);
    }
  });

  test("Route callback gets passed DECODED values.", 3, function() {
    navigate('has%2Fslash/complex-has%23hash/has%20space');
    strictEqual(router.first, 'has/slash');
    strictEqual(router.part, 'has#hash');
    strictEqual(router.rest, 'has space');
  });

  test("routes (two part - encoded reserved char)", 2, function() {
    navigate('search/nyc/pa%2Fb');
    equal(router.query, 'nyc');
    equal(router.page, 'a/b');
  });

  test("routes (two part - query params)", 3, function() {
    navigate('search/nyc/p10?a=b');
    equal(router.query, 'nyc');
    equal(router.page, '10');
    equal(router.queryParams.a, 'b');
  });

  test("named parameters (defined statically)", 1, function() {
    Backbone.Router.QueryParams.namedParams = true;
    navigate('search/nyc/p10?a=b');
    deepEqual(router.query, { query: 'nyc', page: '10', a: 'b' });
    Backbone.Router.QueryParams.namedParams = false;
  });

  test("named parameters (defined on router instance)", 1, function() {
    var NewRouter = Router.extend({
      namedParams: true
    });

    var router = new NewRouter({});

    navigate('search/nyc/p10?a=b');
    deepEqual(router.query, { query: 'nyc', page: '10', a: 'b' });
  });

  test("default object -> query parser", 9, function() {
    var toQuery = Backbone.Router.QueryParams.stringify,
        params;

    params = {"foo": "bar", "baz": 42, "quux": "All your base are belong to us"};
    equal(toQuery(params), "foo=bar&baz=42&quux=All+your+base+are+belong+to+us", "simple");

    params = {"string": "foo", "null": null, "undefined": undefined};
    equal(toQuery(params), "string=foo&null=&undefined=", "handle nulls and undefineds properly");

    params = {"someName": [1, 2, 3], "regularThing": "blah" };
    equal(toQuery(params), "someName%5B%5D=1&someName%5B%5D=2&someName%5B%5D=3&regularThing=blah", "with array");

    params = {"foo": ["a", "b", "c"]};
    equal(toQuery(params), "foo%5B%5D=a&foo%5B%5D=b&foo%5B%5D=c", "with array of strings");

    params = {"foo": ["baz", 42, "All your base are belong to us"] };
    equal(toQuery(params), "foo%5B%5D=baz&foo%5B%5D=42&foo%5B%5D=All+your+base+are+belong+to+us", "more array");

    params = {"foo": { "bar": "baz", "beep": 42, "quux": "All your base are belong to us" } };
    equal(toQuery(params), "foo%5Bbar%5D=baz&foo%5Bbeep%5D=42&foo%5Bquux%5D=All+your+base+are+belong+to+us", "even more arrays");

    params = { a: [1, 2], b: { c: 3, d: [4, 5], e: { x: [6], y: 7, z: [8, 9] }, f: true, g: false, h: undefined }, i: [10, 11], j: true, k: false, l: [undefined, 0], m: "cowboy hat?" };
    equal(decodeURIComponent(toQuery(params)), "a[]=1&a[]=2&b[c]=3&b[d][]=4&b[d][]=5&b[e][x][]=6&b[e][y]=7&b[e][z][]=8&b[e][z][]=9&b[f]=true&b[g]=false&b[h]=&i[]=10&i[]=11&j=true&k=false&l[]=&l[]=0&m=cowboy+hat?", "huge structure");

    params = { "a": [ 0, [ 1, 2 ], [ 3, [ 4, 5 ], [ 6 ] ], { "b": [ 7, [ 8, 9 ], [ { "c": 10, "d": 11 } ], [ [ 12 ] ], [ [ [ 13 ] ] ], { "e": { "f": { "g": [ 14, [ 15 ] ] } } }, 16 ] }, 17 ] };
   	equal(decodeURIComponent(toQuery(params)), "a[]=0&a[1][]=1&a[1][]=2&a[2][]=3&a[2][1][]=4&a[2][1][]=5&a[2][2][]=6&a[3][b][]=7&a[3][b][1][]=8&a[3][b][1][]=9&a[3][b][2][0][c]=10&a[3][b][2][0][d]=11&a[3][b][3][0][]=12&a[3][b][4][0][0][]=13&a[3][b][5][e][f][g][]=14&a[3][b][5][e][f][g][1][]=15&a[3][b][]=16&a[]=17", "nested arrays" );

    equal(decodeURIComponent(toQuery({ "a": [1, 2, 3], "b[]": [4, 5, 6], "c[d]": [7, 8, 9], "e": { "f": [10], "g": [11, 12], "h": 13 } })), "a[]=1&a[]=2&a[]=3&b[]=4&b[]=5&b[]=6&c[d][]=7&c[d][]=8&c[d][]=9&e[f][]=10&e[g][]=11&e[g][]=12&e[h]=13", "Make sure params are not double-encoded.");
  });

  test("default query -> object parser", 8, function() {
    var parse = Backbone.Router.QueryParams.parse,
        query;

    query = "foo=bar&baz=42&quux=All+your+base+are+belong+to+us";
    deepEqual(parse(query), {"foo": "bar", "baz": "42", "quux": "All your base are belong to us"}, "simple");

    query = "string=foo&null=&undefined=";
    deepEqual(parse(query), {"string": "foo", "null": "", "undefined": ""}, "handle nulls and undefineds properly");

    query = "someName%5B%5D=1&someName%5B%5D=2&someName%5B%5D=3&regularThing=blah";
    deepEqual(parse(query), {"someName": ["1", "2", "3"], "regularThing": "blah" }, "with array");

    query = "foo%5B%5D=a&foo%5B%5D=b&foo%5B%5D=c";
    deepEqual(parse(query), {"foo": ["a", "b", "c"]}, "with array of strings");

    query = "foo%5B%5D=baz&foo%5B%5D=42&foo%5B%5D=All+your+base+are+belong+to+us";
    deepEqual(parse(query), {"foo": ["baz", "42", "All your base are belong to us"] }, "more array");

    query = "foo%5Bbar%5D=baz&foo%5Bbeep%5D=42&foo%5Bquux%5D=All+your+base+are+belong+to+us";
    deepEqual(parse(query), {"foo": { "bar": "baz", "beep": "42", "quux": "All your base are belong to us" } }, "even more arrays");

    query = "a[]=1&a[]=2&b[c]=3&b[d][]=4&b[d][]=5&b[e][x][]=6&b[e][y]=7&b[e][z][]=8&b[e][z][]=9&b[f]=true&b[g]=false&b[h]=&i[]=10&i[]=11&j=true&k=false&l[]=&l[]=0&m=cowboy+hat?";
    deepEqual(parse(query, true), { a: [1, 2], b: { c: 3, d: [4, 5], e: { x: [6], y: 7, z: [8, 9] }, f: true, g: false, h: "" }, i: [10, 11], j: true, k: false, l: ["", 0], m: "cowboy hat?" }, "huge structure coerced");

    query = "a[]=0&a[1][]=1&a[1][]=2&a[2][]=3&a[2][1][]=4&a[2][1][]=5&a[2][2][]=6&a[3][b][]=7&a[3][b][1][]=8&a[3][b][1][]=9&a[3][b][2][0][c]=10&a[3][b][2][0][d]=11&a[3][b][3][0][]=12&a[3][b][4][0][0][]=13&a[3][b][5][e][f][g][]=14&a[3][b][5][e][f][g][1][]=15&a[3][b][]=16&a[]=17";
    deepEqual(parse(query, true), { "a": [ 0, [ 1, 2 ], [ 3, [ 4, 5 ], [ 6 ] ], { "b": [ 7, [ 8, 9 ], [ { "c": 10, "d": 11 } ], [ [ 12 ] ], [ [ [ 13 ] ] ], { "e": { "f": { "g": [ 14, [ 15 ] ] } } }, 16 ] }, 17 ] }, "nested arrays coerced" );
  });
});
