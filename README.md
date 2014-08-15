#less-stream
Streaming less compiler, with support for sourcemaps. Uses `less.Parser.parse()` to correctly interpret global and modify vars.

##installation
Add to your `devDependencies`:
```javascript
  "dependencies": {...},
  "devDependencies": {
    "less-stream": "~0.1.3"
  },
  ...
```
or install directly:
```javascript
npm install --save-dev less-stream
```

Then import in your build script:
```javascript
var less = require('less-stream');
```

##usage
As a simple streaming compiler:
```javascript
var less = require('less-stream'),
  fs = require('fs');

fs.createReadStream('path/to/less/src')
  .pipe(less())
  .pipe(fs.createWriteStream('path/to/css'));
```

With streaming build tools like [gulp](https://github.com/gulpjs/gulp/):
```javascript
var gulp = require('gulp'),
  less = require('less-stream'),  // gulp-less uses less.render() & can't support global/modify vars
  sourcemaps = require('gulp-sourcemaps');

// Basic compile
gulp.task('less', function () {
  return gulp.src('path/to/less/*.less')
    .pipe(less())
    .pipe(gulp.dest('path/to/css/'));
});

// With sourcemaps
gulp.task('less:sourcemap', function () {
  return gulp.src('path/to/less/*.less')
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('path/to/css/'));
});
```

##api

```javascript
less(options)
```
Accepts the same options hash as the [lessc compiler](https://github.com/less/less.js/blob/0c8e117b85fe410abc7d8816db2257363b12e9e3/bin/lessc#L11), and returns a `Writable` stream.