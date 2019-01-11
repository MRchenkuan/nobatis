var gulp = require('gulp');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');

gulp.task('default', function() {
  // 将你的默认的任务代码放在这

});



gulp.task('compile', function() {
  return gulp.src('src/*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest('dist'))
});
