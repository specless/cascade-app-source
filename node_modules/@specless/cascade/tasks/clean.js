var gulp = require('gulp');
var utils = require('../js/utils.js');
var clean = require('gulp-clean');

gulp.task('clean', function () {
	var cascade = utils.get('cascadeSettings');
	var project = utils.get('projectSettings');
	console.log(project.path + '/' + cascade.buildDir);
	return gulp.src([project.path + '/' + cascade.buildDir], {read: false})
		.pipe(clean({force: true}));
});