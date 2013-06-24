//$(document).ready(function() {
//
//  var router = null;
//  var location = null;
//  var lastRoute = null;
//  var lastArgs = [];
//
//  function onRoute(router, route, args) {
//    lastRoute = route;
//    lastArgs = args;
//  }
//
//  var Location = function(href) {
//    this.replace(href);
//  };
//
//  _.extend(Location.prototype, {
//
//    replace: function(href) {
//      _.extend(this, _.pick($('<a></a>', {href: href})[0],
//        'href',
//        'hash',
//        'host',
//        'search',
//        'fragment',
//        'pathname',
//        'protocol'
//      ));
//      // In IE, anchor.pathname does not contain a leading slash though
//      // window.location.pathname does.
//      if (!/^\//.test(this.pathname)) this.pathname = '/' + this.pathname;
//    },
//
//    toString: function() {
//      return this.href;
//    }
//
//  });
//
//  module("Backbone.QueryParams", {
//
//    setup: function() {
//      location = new Location('http://example.com');
//      Backbone.history = _.extend(new Backbone.History, {location: location});
//      router = new Router({testing: 101});
//      Backbone.history.interval = 9;
//      Backbone.history.start({pushState: false});
//      lastRoute = null;
//      lastArgs = [];
//      Backbone.history.on('route', onRoute);
//    },
//
//    teardown: function() {
//      Backbone.history.stop();
//      Backbone.history.off('route', onRoute);
//    }
//
//  });
//
//  var Router = Backbone.Router.extend({
//
//    count: 0,
//
//    routes: {
//      "noCallback":                 "noCallback",
//      "counter":                    "counter",
//      "search/:query":              "search",
//      "search/:query/p:page":       "search",
//      "contacts":                   "contacts",
//      "contacts/new":               "newContact",
//      "contacts/:id":               "loadContact",
//      "optional(/:item)":           "optionalItem",
//      "named/optional/(y:z)":       "namedOptional",
//      "splat/*args/end":            "splat",
//      "*first/complex-:part/*rest": "complex",
//      ":entity?*args":              "query",
//      "*anything":                  "anything"
//    },
//
//    initialize : function(options) {
//      this.testing = options.testing;
//      this.route('implicit', 'implicit');
//    },
//
//    counter: function() {
//      this.count++;
//    },
//
//    implicit: function() {
//      this.count++;
//    },
//
//    search : function(query, page, queryParams) {
//      this.query = query;
//      this.page = page;
//      this.queryParams = queryParams;
//    },
//
//    contacts: function(){
//      this.contact = 'index';
//    },
//
//    newContact: function(){
//      this.contact = 'new';
//    },
//
//    loadContact: function(){
//      this.contact = 'load';
//    },
//
//    optionalItem: function(arg){
//      this.arg = arg != void 0 ? arg : null;
//    },
//
//    splat: function(args) {
//      this.args = args;
//    },
//
//    complex: function(first, part, rest) {
//      this.first = first;
//      this.part = part;
//      this.rest = rest;
//    },
//
//    query: function(entity, args) {
//      this.entity    = entity;
//      this.queryArgs = args;
//    },
//
//    anything: function(whatever) {
//      this.anything = whatever;
//    },
//
//    namedOptional: function(z) {
//      this.z = z;
//    }
//
//  });
//
//  test("Route callback gets passed DECODED values.", 3, function() {
//    var route = 'has%2Fslash/complex-has%23hash/has%20space';
//    Backbone.history.navigate(route, {trigger: true});
//    strictEqual(router.first, 'has/slash');
//    strictEqual(router.part, 'has#hash');
//    strictEqual(router.rest, 'has space');
//  });
//
//  test("routes (two part - encoded reserved char)", 2, function() {
//    var route = 'search/nyc/pa%2Fb';
//    Backbone.history.navigate(route, {trigger: true});
//    Backbone.history.checkUrl();
//    equal(router.query, 'nyc');
//    equal(router.page, 'a/b');
//  });
//
//  test("routes (two part - query params)", 3, function() {
//    var route = 'search/nyc/p10?a=b';
//    Backbone.history.navigate(route, {trigger: true});
//    Backbone.history.checkUrl();
//    equal(router.query, 'nyc');
//    equal(router.page, '10');
//    equal(router.queryParams.a, 'b');
//  });
//
//  test("routes (two part - query params - hash and list - location)", 12, function() {
//    var route = 'search/nyc/p10?a=b&a2=x&a2=y&a3=x&a3=y&a3=z&b.c=d&b.d=e&b.e.f=g&array1=|a&array2=a|b&array3=|c|d&array4=|e%7C';
//    Backbone.history.navigate(route, {trigger: true});
//    Backbone.history.checkUrl();
//    equal(router.query, 'nyc');
//    equal(router.page, '10');
//    equal(router.queryParams.a, 'b');
//    deepEqual(router.queryParams.a2, ['x', 'y']);
//    deepEqual(router.queryParams.a3, ['x', 'y', 'z']);
//    equal(router.queryParams.b.c, 'd');
//    equal(router.queryParams.b.d, 'e');
//    equal(router.queryParams.b.e.f, 'g');
//    deepEqual(router.queryParams.array1, ['a']);
//    deepEqual(router.queryParams.array2, ['a', 'b']);
//    deepEqual(router.queryParams.array3, ['c', 'd']);
//    deepEqual(router.queryParams.array4, ['e|']);
//  });
//
//  test("routes (two part - query params)", 3, function() {
//    var route = 'search/nyc/p10?a=b';
//    Backbone.history.navigate(route, {trigger: true});
//    Backbone.history.checkUrl();
//    equal(router.query, 'nyc');
//    equal(router.page, '10');
//    equal(router.queryParams.a, 'b');
//  });
//
//  test("routes (two part - query params - hash and list - navigate)", 10, function() {
//    var route = router.toFragment('search/nyc/p10', {
//      a:'l', b:{c: 'n', d:'m', e:{f: 'o'}}, array1:['p'], array2:['q', 'r'], array3:['s','t','|'], array4:[5, 6, 8, 9]
//    });
//    Backbone.history.navigate(route, {trigger: true});
//    Backbone.history.checkUrl();
//    equal(router.query, 'nyc');
//    equal(router.page, '10');
//    equal(router.queryParams.a, 'l');
//    equal(router.queryParams.b.c, 'n');
//    equal(router.queryParams.b.d, 'm');
//    equal(router.queryParams.b.e.f, 'o');
//    deepEqual(router.queryParams.array1, ['p']);
//    deepEqual(router.queryParams.array2, ['q', 'r']);
//    deepEqual(router.queryParams.array3, ['s','t','|']);
//    deepEqual(router.queryParams.array4, ['5', '6', '8', '9']);
//  });
//
//  test("routes (decoding with 2 repeated values)", 3, function() {
//    var route = 'search/nyc/p10?f.foo.bar=foo%20%2B%20bar&f.foo.bar=hello%20qux';
//    Backbone.history.navigate(route, {trigger: true});
//    Backbone.history.checkUrl();
//    equal(router.query, 'nyc');
//    equal(router.page, '10');
//    deepEqual(router.queryParams.f.foo.bar, ['foo + bar', 'hello qux']);
//  });
//
//  test("routes (decoding with 3 repeated values)", 3, function() {
//    var route = 'search/nyc/p10?f.foo.bar=foo%20%2B%20bar&f.foo.bar=hello%20qux&f.foo.bar=baz%20baz';
//    Backbone.history.navigate(route, {trigger: true});
//    Backbone.history.checkUrl();
//    equal(router.query, 'nyc');
//    equal(router.page, '10');
//    deepEqual(router.queryParams.f.foo.bar, ['foo + bar', 'hello qux', 'baz baz']);
//  });
//
//  test("named parameters (defined statically)", 3, function() {
//    Backbone.Router.namedParameters = true;
//    var route = 'search/nyc/p10?a=b';
//    Backbone.history.navigate(route, {trigger: true});
//    Backbone.history.checkUrl();
//    // only 1 param in this case populated with query parameters and route vars keyd with their associated name
//    var data = router.query;
//    equal(data.query, 'nyc');
//    equal(data.page, '10');
//    equal(data.a, 'b');
//    Backbone.Router.namedParameters = false;
//  });
//
//  test("named parameters (defined on router instance)", 3, function() {
//    var Router = Backbone.Router.extend({
//      namedParameters: true,
//      routes: {
//        "search2/:query/p:page":       "search"
//      },
//      search : function(query, page, queryParams) {
//        this.query = query;
//        this.page = page;
//        this.queryParams = queryParams;
//      }
//    });
//    var router = new Router();
//    var route = 'search2/nyc/p10?a=b';
//    Backbone.history.navigate(route, {trigger: true});
//    Backbone.history.checkUrl();
//    // only 1 param in this case populated with query parameters and route vars keyd with their associated name
//    var data = router.query;
//    equal(data.query, 'nyc');
//    equal(data.page, '10');
//    equal(data.a, 'b');
//  });
//});

$(function() {

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

  test("default query -> parser", 8, function() {
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
