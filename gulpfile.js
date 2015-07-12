var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

// 语法检查
gulp.task('jshint', function () {
    return gulp.src('js/MPreview.mobile.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// 合并文件之后压缩代码
gulp.task('minify', function (){
    return gulp.src(['js/quo.js', 'js/MPreview.mobile.js'])
               .pipe(concat('MPreview.mobile.min.js'))
               .pipe(gulp.dest('js'))
               .pipe(uglify())
               .pipe(gulp.dest('js'));
});

// 监视文件的变化
gulp.task('watch', function () {
    gulp.watch('js/*.js', ['jshint', 'minify']);
});

// 注册缺省任务
gulp.task('default', ['jshint', 'minify']);