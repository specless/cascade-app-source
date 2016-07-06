var gulp = require('gulp');
var _ = require('underscore');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var utils = require('../js/utils.js');

gulp.task('js', function () {
	var cascade = utils.get('cascadeSettings');
	var settings = utils.get('projectSettings');
	var glob = [settings.path + '/**/' + cascade.js.fileName, '!' + settings.path + '/{' + cascade.assetsDirName + ',' + cascade.assetsDirName + '/**}'];
	
	return gulp.src(glob)
		.pipe(plumber({
    		errorHandler: function(error) {
    			utils.sendMessage("failure", error.message, 1);
    		}
    	}))
    	.pipe(rename(function (path) {
		    path.basename = path.dirname;
		    path.dirname = '';
		}))
        .pipe(gulp.dest(settings.path + '/' + cascade.buildDir));
});