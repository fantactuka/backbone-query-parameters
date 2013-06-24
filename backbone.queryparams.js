(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'underscore'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('backbone'), require('underscore'));
  } else {
    factory(window.Backbone, window._);
  }
})(function(Backbone, _) {

  var queryParamRE = /^\?(.*)/,
      optionalParamRE = /\((.*?)\)/g,
      namedParamRE = /(\(\?)?:\w+/g,
      splatParamRE = /\*\w+/g,
      escapeRE = /[\-{}\[\]+?.,\\\^$|#\s]/g,
      queryStripRE = /(\?.*)$/,
      fragmentStripRE = /^([^\?]*)/,
      queryStringRE = /(\?)[\w-]+=/i,
      namesPatternRE = /[\:\*]([^\:\?\/]+)/g,
      routeStripperRE = /^[#\/]|\s+$/g,
      slashStripperRE = /\/$/;

  var getFragment = function(fragment, forcePushState) {
    if (fragment == null) {
      if (this._hasPushState || !this._wantsHashChange || forcePushState) {
        fragment = this.location.pathname;
        var root = this.root.replace(slashStripperRE, '');
        var search = this.location.search;
        if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        if (search) fragment += search;
      } else {
        fragment = this.getHash();
      }
    }
    return fragment.replace(routeStripperRE, '');
  };

  _.extend(Backbone.History.prototype, {
    getFragment: function(fragment, forcePushState) {
      var excludeQueryString = (this._wantsHashChange && this._wantsPushState && !this._hasPushState);
      var _fragment = getFragment.apply(this, arguments);
      if (fragment == null && !queryStringRE.test(_fragment)) {
        _fragment += this.location.search;
      } else if (excludeQueryString) {
        _fragment = _fragment.replace(queryStripRE, '');
      }
      return _fragment;
    },

    // this will not perform custom query param serialization specific to the router
    // but will return a map of key/value pairs (the value is a string or array)
    getQueryParameters: function(fragment, forcePushState) {
      fragment = getFragment.apply(this, arguments);
      // if no query string exists, this will still be the original fragment
      var queryString = fragment.replace(fragmentStripRE, '');
      var match = queryString.match(queryParamRE);
      if (match) {
        queryString = match[1];
        return QueryParams.parse(queryString);
      } else {
        // no values
        return {};
      }
    }
  });

  _.extend(Backbone.Router.prototype, {
    initialize: function(options) {
      this.encodedSplatParts = options && options.encodedSplatParts;
    },

    getFragment: function(fragment, forcePushState, excludeQueryString) {
      fragment = getFragment.apply(this, arguments);
      if (excludeQueryString) {
        fragment = fragment.replace(queryStripRE, '');
      }
      return fragment;
    },

    _routeToRegExp: function(route) {
      var splatMatch = (splatParamRE.exec(route) || {index: -1}),
          namedMatch = (namedParamRE.exec(route) || {index: -1}),
          paramNames = route.match(namesPatternRE) || [];

      route = route.replace(escapeRE, '\\$&')
          .replace(optionalParamRE, '(?:$1)?')
          .replace(namedParamRE, function(match, optional) {
            return optional ? match : '([^\\/\\?]+)';
          })
          .replace(splatParamRE, '([^\?]*?)');
      route += '([\?]{1}.*)?';
      var rtn = new RegExp('^' + route + '$');

      // use the rtn value to hold some parameter data
      if (splatMatch.index >= 0) {
        // there is a splat
        if (namedMatch >= 0) {
          // negative value will indicate there is a splat match before any named matches
          rtn.splatMatch = splatMatch.index - namedMatch.index;
        } else {
          rtn.splatMatch = -1;
        }
      }
      rtn.paramNames = _.map(paramNames, function(name) {
        return name.substring(1);
      });
      rtn.namedParameters = this.namedParameters;

      return rtn;
    },

    /**
     * Given a route, and a URL fragment that it matches, return the array of
     * extracted parameters.
     */
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1),
          namedParams = {};
      if (params.length > 0 && _.isUndefined(params[params.length - 1])) {
        // remove potential invalid data from query params match
        params.splice(params.length - 1, 1);
      }

      // do we have an additional query string?
      var match = params.length && params[params.length - 1] && params[params.length - 1].match(queryParamRE);
      if (match) {
        var queryString = match[1];
        var data = {};
        if (queryString) {
          data = QueryParams.parse(queryString);
        }
        params[params.length - 1] = data;
        _.extend(namedParams, data);
      }

      // decode params
      var length = params.length;
      if (route.splatMatch && this.encodedSplatParts) {
        if (route.splatMatch < 0) {
          // splat param is first
          return params;
        } else {
          length = length - 1;
        }
      }

      for (var i = 0; i < length; i++) {
        if (_.isString(params[i])) {
          params[i] = decodeURIComponent(params[i]);
          if (route.paramNames.length >= i - 1) {
            namedParams[route.paramNames[i]] = params[i];
          }
        }
      }

      return (QueryParams.namedParams || route.namedParams) ? [namedParams] : params;
    },

    /**
     * Return the route fragment with queryParameters serialized to query parameter string
     */
    toFragment: function(route, queryParameters) {
      if (queryParameters) {
        if (!_.isString(queryParameters)) {
          queryParameters = QueryParams.stringify(queryParameters);
        }
        if (queryParameters) {
          route += '?' + queryParameters;
        }
      }
      return route;
    }
  });

  /**
   * Default parsers. Equivalent of $.param & $.unparam cleaned from `traditional` $.param option since it's useless
   * In case alternative parse/stringify options are required by the project just override public options, e.g.:
   *
   *    Backbone.Router.QueryParams.stringify = function(object) {
   *      return JSON.stringify(object);
   *    };
   *
   *    Backbone.Router.QueryParams.parse = function(query) {
   *      return JSON.parse(query);
   *    };
   *
   * By default `parse` does not coerce types, but there's optional param that could be overridden to true, e.g.:
   *
   *    var parse = Backbone.Router.QueryParams.parse;
   *
   *    Backbone.Router.QueryParams.parse = function(query) {
   *      return parse(query, true);
   *    };
   *
   */
  var QueryParams = Backbone.Router.QueryParams = {

    namedParams: false,

    stringify: function(object) {
      var result = [],
          add = function(key, value) {
            value = _.isFunction(value) ? value() : (value == null ? "" : value);
            result[result.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
          };

      _.each(object, function(value, key) {
        buildParams(key, value, add);
      });

      return result.join("&").replace(/%20/g, "+");
    },

    parse: function(params, coerce) {
      var obj = {},
          types = { 'true': !0, 'false': !1, 'null': null };

      // If passed nothing
      params = params || '';

      // Iterate over all name=value pairs.
      _.each(params.replace(/\+/g, ' ').split('&'), function(value) {
        var param = value.split('='),
            key = decodeURIComponent(param[0]),
            val,
            cur = obj,
            i = 0,

        // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
        // into its component parts.
            keys = key.split(']['),
            keysLast = keys.length - 1;

        // If the first keys part contains [ and the last ends with ], then []
        // are correctly balanced.
        if (/\[/.test(keys[0]) && /\]$/.test(keys[ keysLast ])) {
          // Remove the trailing ] from the last keys part.
          keys[ keysLast ] = keys[ keysLast ].replace(/\]$/, '');

          // Split first keys part into two parts on the [ and add them back onto
          // the beginning of the keys array.
          keys = keys.shift().split('[').concat(keys);

          keysLast = keys.length - 1;
        } else {
          // Basic 'foo' style key.
          keysLast = 0;
        }

        // Are we dealing with a name=value pair, or just a name?
        if (param.length === 2) {
          val = decodeURIComponent(param[1]);

          // Coerce values.
          if (coerce) {
            val = val && !isNaN(val) ? +val               // number
                : val === 'undefined' ? undefined         // undefined
                : types[val] !== undefined ? types[val]   // true, false, null
                : val;                                    // string
          }

          if (keysLast) {
            // Complex key, build deep object structure based on a few rules:
            // * The 'cur' pointer starts at the object top-level.
            // * [] = array push (n is set to array length), [n] = array if n is
            //   numeric, otherwise object.
            // * If at the last keys part, set the value.
            // * For each keys part, if the current level is undefined create an
            //   object or array based on the type of the next keys part.
            // * Move the 'cur' pointer to the next level.
            // * Rinse & repeat.
            for (; i <= keysLast; i++) {
              key = keys[i] === '' ? cur.length : keys[i];
              cur = cur[key] = i < keysLast
                  ? cur[key] || ( keys[i + 1] && isNaN(keys[i + 1]) ? {} : [] )
                  : val;
            }

          } else {
            // Simple key, even simpler rules, since only scalars and shallow
            // arrays are allowed.

            if (_.isArray(obj[key])) {
              // val is already an array, so push on the next value.
              obj[key].push(val);

            } else if (obj[key] !== undefined) {
              // val isn't an array, but since a second value has been specified,
              // convert val into an array.
              obj[key] = [ obj[key], val ];

            } else {
              // val is a scalar.
              obj[key] = val;
            }
          }

        } else if (key) {
          // No value was defined, so set something meaningful.
          obj[key] = coerce ? undefined : '';
        }
      });

      return obj;
    }
  };

  function buildParams(prefix, object, add) {
    if (_.isArray(object)) {
      _.each(object, function(value, i) {
        if ((/\[\]$/).test(prefix)) {
          add(prefix, value);
        } else {
          buildParams(prefix + "[" + ( typeof value === "object" ? i : "" ) + "]", value, add);
        }
      });
    } else if (_.isObject(object)) {
      _.each(object, function(value, key) {
        buildParams(prefix + "[" + key + "]", value, add);
      });
    } else {
      add(prefix, object);
    }
  }

});
