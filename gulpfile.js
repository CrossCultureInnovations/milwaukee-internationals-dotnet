const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const uglify = require('gulp-uglify');
const buffer = require('vinyl-buffer');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const minify = require("gulp-minify");

babelify.configure({
    babelrc: './.babelrc'
});

gulp.task('scripts', function () {
    return browserify({ entries: 'API/wwwroot/scripts/script.js', extensions: ['.js'], debug: false })
        .transform(babelify)
        .bundle()
        .pipe(source('script.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(minify({
            noSource: true,
            ext: {
                min: '.js'
            },
        }))
        .pipe(sourcemaps.write(''))
        .pipe(gulp.dest('client-build/scripts/'));
});

gulp.task("styles", function () {
    return gulp.src('API/wwwroot/styles/style.css')
        .pipe(cleanCSS())
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
        .pipe(gulp.dest('client-build/styles/'));
});

gulp.task('default', ['scripts', 'styles']);