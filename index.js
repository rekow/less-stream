var less = require('less'),
  path = require('path'),
  through2 = require('through2'),
  convert = require('convert-source-map'),
  applySourceMap = require('vinyl-sourcemaps-apply'),

  sourceMapMatcher = /\/\*\#\s?sourceMappingURL=data:application\/json;base64\,([^\*]+)\*\//,

  merge = function (obj1, obj2) {
    for (var k in obj2) {
      if (obj2.hasOwnProperty(k)) {
        obj1[k] = obj2[k]
      }
    }
    return obj1;
  },

  getVarString = function (vars) {
    var str = '';
    if (typeof vars === 'string') {
      return vars;
    }
    for (var k in vars) {
      if (vars.hasOwnProperty(k)) {
        str += '@' + k + ':' + vars[k] + ';'
      }
    }
    return str;
  },

  parseSourceMap = function (css) {
    var srcMap = null;
    css = css.replace(sourceMapMatcher, function (_, b64) {
      srcMap = JSON.parse(new Buffer(b64, 'base64').toString('ascii'));
    });
    return srcMap;
  },

  stripSourceMap = function (css) {
    return css.replace(sourceMapMatcher, function () {
      return ''
    });
  };

module.exports = function (options) {

  options = merge({
    compress: false,
    paths: []
  }, options);

  return through2.obj(function (file, enc, cb) {
    var self = this,
      opts = merge({}, options),
      parser;

    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    if (file.isStream()) {
      this.emit('error', 'Streaming not supported');
      return cb();
    }

    opts.filename = file.path;
    opts.sourceMap = !!file.sourceMap;

    parser = new (less.Parser)(opts);
    parser.parse(
      getVarString(opts.globalVars || opts.globalVariables || {}) +
      file.contents.toString('utf8') +
      getVarString(opts.modifyVars || opts.modifyVariables || {}), function (err, tree) {
        var css, srcMap;

        if (err) {
          self.emit('error', err);
          return;
        }

        try {
          css = tree.toCSS(opts);
        } catch (e) {
          self.emit('error', e);
          return;
        }

        file.sourceMap = opts.compress ? parseSourceMap(css) || file.sourceMap : file.sourceMap;
        file.contents = new Buffer(stripSourceMap(css));
        file.path = file.path.slice(0, -4) + 'css';

        if (!!file.sourceMap) {
          srcMap = convert.fromSource(css);
          if (srcMap) {
            file.contents = new Buffer(convert.removeComments(css));
            srcMap = srcMap.sourcemap;
            for (var i = 0; i < srcMap.sources.length; i++) {
              srcMap.sources[i] = path.resolve(file.base, srcMap.sources[i]);
            }
            srcMap.file = file.path;
            applySourceMap(file, srcMap);
          }
        }

        self.push(file);
        cb();
      });
  });
};
