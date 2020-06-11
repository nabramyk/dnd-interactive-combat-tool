var gulp = require('gulp');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var plumber = require('gulp-plumber');

gulp.task('app', function() {
    return gulp.src(['src/components/*.js', 'src/components/**/*.component.js', 'src/services/*.js'])
        .pipe(plumber())
        .pipe(concat('app.js', { newLine: ';' }))
        .pipe(ngAnnotate({ add: true }))
        .pipe(plumber.stop())
        .pipe(gulp.dest('src/'));
});

gulp.task('watch', ['app'], function() {
    gulp.watch(['src/components/*.js', 'src/components/**/*.component.js', 'src/services/*.js'], ['app']);
});

gulp.task('default', function() {
    console.log('default');
});