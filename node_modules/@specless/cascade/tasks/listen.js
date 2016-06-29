var gulp = require('gulp');
var utils = require('../js/utils.js');
var _ = require('underscore');

gulp.task('listen', ['build'], function () {
	var cascade = utils.get('cascadeSettings');
	var settings = utils.get('projectSettings');

	var htmlFiles = [settings.path + '/**/' + cascade.html.fileName, '!' + settings.path + '/{' + cascade.assetsDirName + ',' + cascade.assetsDirName + '/**}'];
	var cssFiles = [settings.path + '/**/' + cascade.css.fileName, '!' + settings.path + '/{' + cascade.assetsDirName + ',' + cascade.assetsDirName + '/**}'];
	var jsFiles = [settings.path + '/**/' + cascade.js.fileName, '!' + settings.path + '/{' + cascade.assetsDirName + ',' + cascade.assetsDirName + '/**}'];

	gulp.watch(htmlFiles, ['html']);
	gulp.watch(cssFiles, ['css']);
	gulp.watch(jsFiles, ['js']);

	return true

});