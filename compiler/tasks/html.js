var gulp = require('gulp');
var _ = require('underscore');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var utils = require('../js/utils.js');
var posthtml = require('gulp-posthtml');
var prettify = require('gulp-html-prettify');
var processHtml = require('../js/process-html.js');
var Handlebars = require("handlebars");

gulp.task('html', function () {
	utils.sendMessage("Command Received: Compile HTML", null, 1);
	var cascade = utils.get('cascadeSettings');
	var settings = utils.get('projectSettings');
	var glob = [settings.path + '/**/' + cascade.html.fileName, '!' + settings.path + '/{' + cascade.assetsDirName + ',' + cascade.assetsDirName + '/**}'];
	
	var posthtmlOptions = {};

	var success = true;
	return gulp.src(glob)
		.pipe(plumber({
    		errorHandler: function(error) {
    			utils.sendMessage("There was an error compiling your HTML.", error.message, 5);
    			success = false;
    		}
    	}))
    	.pipe(rename(function (path) {
    		component = path.dirname;
		    path.basename = path.dirname;
		    path.dirname = '';
		}))
		.pipe(utils.markComponent('html'))
		.pipe(posthtml([
			require('../js/posthtml-ad-elements')({
                prefix: cascade.html.syntax.prefix,
                attrPrefix: cascade.html.syntax.attributeFinalPrefix
            })
		], posthtmlOptions))
		.pipe(processHtml())
		.pipe(prettify({indent_size: 4}))
        .pipe(gulp.dest(settings.path + '/' + cascade.buildDir))
        .on('end', function(err) {
        	if (success === true) {
        		utils.sendMessage("HTML Compiled successfully.", null, 4);
        	}
        	utils.sendMessage("Command Completed: Compile HTML", null, 1);
        	success = true;
        });
});

gulp.task('html-meta', function() {
	var cascade = utils.get('cascadeSettings');
	var settings = utils.get('projectSettings');
	var glob = [settings.path + '/' + cascade.buildDir + '/*.html'];

	var getProperties = function(settings, component) {

		var contexts = {};

		_.each(settings.components, function(currentComponent) {
			if (currentComponent.name === component) {
				contexts = currentComponent.css['contexts'];
				console.log(currentComponent.name);
				if (Object.keys(currentComponent.css['flowlanes']).length > 0) {
					contexts["flowlane"] = []
					_.each(currentComponent.css['flowlanes'], function(value, key) {
						contexts['flowlane'].push(key);
					});
				}
			}
		});

		_.each(contexts, function(value, key) {
			if (key.split('-').length > 1) {
				var newName = utils.snakeToCamel(key);
				contexts[newName] = contexts[key];
				delete contexts[key];
			}
		});

		return JSON.stringify(contexts);
	}

	var writeMetaData = function() {
		function transform(file, cb) {
			var component = file.relative.split('.')[0];
			var contextObject = getProperties(settings, component);
			var userHtmlTemplate = String(file.contents);

			var data = {
				contextObject : contextObject
			}

			var htmlTemplate = Handlebars.compile(userHtmlTemplate);

			html = htmlTemplate(data);

		    file.contents = new Buffer(html);
		    cb(null, file);
		}
		return require('event-stream').map(transform);
	}

	return gulp.src(glob)
		.pipe(writeMetaData())
		.pipe(gulp.dest(settings.path + '/' + cascade.buildDir))
});