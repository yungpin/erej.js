/**
 * Created by erej on 2015/9/17 0017.
 */

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var notify = require('gulp-notify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var header = require('gulp-header');
var shell = require('gulp-shell');

var pkg = require('./package.json');
var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');

gulp.task('compilejs', function () {
    return gulp.src(['src/erej.js', 'src/erej.*.js'])
        .pipe(concat('erej.all.js'))
        .pipe(gulp.dest('dist'))
        .pipe(uglify())
        .pipe(rename('erej.all.min.js'))
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest('dist'))
})

gulp.task('tpl', shell.task([
    'atpl -o ./tpl ./tpl/*.tpl'
]))

gulp.task('watch', function () {
    gulp.watch('src/*.js', function (e) {
        console.log('file '+ e.file+' changed...');
        gulp.start('compilejs');
        console.log('compile js finished.')
    })
})

gulp.task('default', function () {

})
