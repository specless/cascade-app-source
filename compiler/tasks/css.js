var postcss = require('gulp-postcss');
var gulp = require('gulp');
var _ = require('underscore');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var utils = require('../js/utils.js');


gulp.task('css', function () {
	utils.sendMessage("Command Received: Compile CSS", null, 1);
	var cascade = utils.get('cascadeSettings');
	var settings = utils.get('projectSettings');

	var component = process.argv[3];
	var glob;
	if (component !== undefined) {
		component = component.replace('--', '');
		glob = [settings.path + '/' + component + '/' + cascade.css.fileName];
	} else {
		glob = [settings.path + '/**/' + cascade.css.fileName, '!' + settings.path + '/{' + cascade.assetsDirName + ',' + cascade.assetsDirName + '/**}'];
	}

    var postcssBefore = [
    	require('../js/postcss-imports')(),
    	require('postcss-import')({
    		root : './',
    		path : settings.path
    	}),
    	require('../js/postcss-ad-elements')(),
    	require('postcss-sassy-mixins')({silent: true}),
    	require('postcss-simple-vars'),
    	require('postcss-atroot'),
    	require('postcss-simple-extend'),
    	require('postcss-conditionals'),
    	require('postcss-each'),
    	require('postcss-for'),
    	require('postcss-custom-selectors'),
		require('postcss-nested')({
			bubble: cascade.css.syntax.contexts.concat([cascade.css.syntax.flowlane, cascade.css.syntax.breakpoint])
		}),
		require('../js/postcss-context-queries')({
			contexts: cascade.css.syntax.contexts,
			operators: cascade.css.syntax.contextOperators,
			attrPrefix : cascade.css.syntax.attrPrefix,
			attrJoiner : cascade.css.syntax.attrJoiner,
			attrExplicitJoiner : cascade.css.syntax.attrExplicitJoiner,
			attrEnding : cascade.css.syntax.attrEnding,
			logResults: true,
			logTo : 'project'
		}),
		require('../js/postcss-flowlanes-breakpoints')({
			flowlaneSyntax : cascade.css.syntax.flowlane,
			defineFlowlaneSyntax : cascade.css.syntax.flowlaneDefine,
			breakpointSyntax : cascade.css.syntax.breakpoint,
			breakpointDefault : cascade.css.syntax.defaultBreakpointType,
			attrPrefix : cascade.css.syntax.attrPrefix,
			attrJoiner : cascade.css.syntax.attrExplicitJoiner,
			attrEnding : cascade.css.syntax.attrEnding,
			flowlaneProps : cascade.css.syntax.flowlaneProperties,
			flowlaneDefaults : cascade.css.syntax.flowlaneDefaults,
			logResults: true,
			logTo : 'project'
		}),
		require('postcss-reporter')({
			clearMessages:true
		})
	];
	
	var postcssAfter = [
		require('postcss-nested'),
		require('postcss-easysprites')({
			imagePath : settings.path,
			spritePath : settings.path + '/' + cascade.assetsDirName
		}),
		require('postcss-calc'),
		require('postcss-functions'),
		require('postcss-color-function'),
		require('postcss-aspect-ratio'),
		require('postcss-filter-gradient'),
		require('postcss-easings'),
		require('postcss-animation'),
		require('postcss-assets'),
		require('autoprefixer')
	];

	var component;

    var success = true;
    return gulp.src(glob)
    	.pipe(plumber({
    		errorHandler: function(error) {
    			utils.sendMessage("There was an error compiling your css.", error.message, 5);
    			success = false;
    		}
    	}))
        .pipe(postcss(postcssBefore))
        .pipe(postcss(postcssAfter))
        .pipe(rename(function (path) {
		    path.basename = path.dirname;
		    path.dirname = '';
		}))
        .pipe(gulp.dest(settings.path + '/' + cascade.buildDir))
        .on('end', function(err) {
        	if (success === true) {
        		utils.sendMessage("CSS Compiled successfully.", null, 4);
        	}
        	utils.sendMessage("Command Completed: Compile CSS", null, 1);
        	success = true;
        });
});