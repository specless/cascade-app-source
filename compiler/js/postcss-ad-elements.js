var postcss = require('postcss');
var _ = require('underscore');
var utils = require('../js/utils.js');

module.exports = postcss.plugin('plugin-triggers', function (opts) {

	opts = opts || {
		pseudoPrefix : '::-ad-',
		pseudoStatePrefix : ':-ad-',
		elementPrefix : '_ad-',
		propertyPrefix : '-ad-'
	}
	var elements = utils.getPlugins('element');

	return function (css, result) {
		css.walk(function (node) {
			if (node.type === 'rule') {
				_.each(elements, function(element) {
					var selector = opts.elementPrefix + element.name;
					var newSelector = "[data-element='" + element.name + "']";
					var childSelectorPrefix = opts.pseudoPrefix + element.name;
					var stateSelectorPrefix = opts.pseudoStatePrefix + element.name;
					node.selector = node.selector.replace(selector, newSelector);

					if (element.psuedoElements) {
						_.each(element.psuedoElements, function(childSelector) {
							var childSelectorString = childSelectorPrefix + '-' + childSelector.name;
								node.selector = node.selector.replace(childSelectorString, ' ' + childSelector.selector);
								node.selector = node.selector.replace('& ', '&');
						});
					}

					if (element.psuedoStates) {
						_.each(element.psuedoStates, function(stateSelector) {
							var stateSelectorString = stateSelectorPrefix + '-' + stateSelector.name;
								node.selector = node.selector.replace(stateSelectorString, stateSelector.selector);
						});
					}
				});
			} else if (node.type === 'decl') {
				_.each(elements, function(element) {
					var propertyPrefix = opts.propertyPrefix + element.name;
					if (element.properties) {
						_.each(element.properties, function(property) {
							var propertyName = propertyPrefix + '-' + property.name;
							if (node.prop === propertyName) {
								var value = node.value;
								node.type = "atrule";
								node.name = "include";
								node.params = property.mixinName + "(" + value + ")";
							}
						});
					}
				});
			}
		});
	}
});