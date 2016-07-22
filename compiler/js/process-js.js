var postcss = require('postcss');
var _ = require('underscore');
var utils = require('../js/utils.js');
var jetpack = require('fs-jetpack');
var Handlebars = require("handlebars");

module.exports = function() {
	var cascade = utils.get('cascadeSettings');
	var project = utils.get('projectSettings');

	function transform(file, cb) {
		var userJs = String(file.contents);
		var userJsTemplate = jetpack.read(cascade.path + cascade.js.templateFilePath);
		var license = jetpack.read(cascade.path + '/LICENSE');
		var component = file.relative.split('.')[0];
		var dependencies;

		var js = [];
		var jsPlugins = [];
		var jsSnippets = [];
		var jsWhiteList = [];

		_.each(project.components, function(thisComponent) {
			if (thisComponent.name === component) {
				dependencies = thisComponent.html.dependencies;
			}
		});

		if (dependencies.js) {
			_.each(dependencies.js, function(dep) {
				var contents = jetpack.read(dep);
				js.push(contents);
			});
		}

		if (dependencies.jsPlugins) {
			_.each(dependencies.jsPlugins, function(dep) {
				var path = cascade.path + dep;
				var contents = jetpack.read(cascade.path + dep);
				jsPlugins.push(contents);
			});
		}

		if (dependencies.jsSnippets) {
			jsSnippets = dependencies.jsSnippets;
		}

		if (dependencies.jsWhiteList) {
			_.each(dependencies.jsWhiteList, function(dep) {
				_.each(cascade.js.whiteListedDeps, function(whiteListItem) {
					if (whiteListItem.name === dep) {
						jsWhiteList.push(whiteListItem.url);
					}
				});
			});
		}

		js = js.join('\n\n');
		jsPlugins = jsPlugins.join('\n\n');
		jsSnippets = jsSnippets.join('\n\n');
		license = '/*\n' + license + '\n*/';
		if (jsWhiteList.length === 0 ) {
			jsWhiteList = null;
		} else {
			var csfPlugins = []
			for (var i = jsWhiteList.length; i--; ) {
				var testArray = jsWhiteList[i].split("sfplugins_");
				if (testArray.length > 1) {
					csfPlugins.push(jsWhiteList[i]);
					jsWhiteList.splice(i, 1);
				}
			}
			csfPlugins = csfPlugins.join(',');
			jsWhiteList.push(csfPlugins);
			jsWhiteList = "'" + jsWhiteList.join("','") + "'";
		}

		var data = {
			userjs : userJs,
			dependencies : js,
			plugins : jsPlugins,
			cdnscripts : jsWhiteList,
			pluginfragments : jsSnippets,
			license : license
		}

		var jsTemplate = Handlebars.compile(userJsTemplate);

		js = jsTemplate(data);

	    file.contents = new Buffer(js);
	    cb(null, file);
	}
	return require('event-stream').map(transform);
}