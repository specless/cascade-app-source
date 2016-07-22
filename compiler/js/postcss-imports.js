var postcss = require('postcss');
var _ = require('underscore');
var utils = require('../js/utils.js');

module.exports = postcss.plugin('plugin-custom-imports', function () {
	var cascade = utils.get('cascadeSettings');
	var project = utils.get('projectSettings');
	
	return function (css, result) {
		var pathArray = css.source.input.file.split('/');
    	var file = {
    		path : pathArray.join('/'),
    		name : pathArray.pop(),
    		folder : pathArray.join('/'),
    		component : pathArray.pop()
    	}

    	_.each(project.components, function(component) {
    		if (file.component === component.name) {
    			if (component.html.dependencies.css) {
    				_.each(component.html.dependencies.css, function(dep) {
    					var importRule = postcss.atRule({ name: 'import', params: '"' + dep + '"'});
    					css.prepend(importRule);
    				});
    			}
    		}
    	});

    	var baseStyles = postcss.atRule({ name: 'import', params: '"' + cascade.path + cascade.css.templateFilePath + '"'});
    	css.prepend(baseStyles);
	}
});