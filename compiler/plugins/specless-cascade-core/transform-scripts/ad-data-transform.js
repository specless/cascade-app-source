module.exports = function (element, utils, _) {
	var settings = utils.get('projectSettings');
	if (element.node.attrs.src) {
		var dataSource = {
			src: element.node.attrs.src,
			params: {}
		}
		if (element.node.attrs.params) {
			var params = element.node.attrs.params.replace(/ /g,'').split(',');
			_.each(params, function(param) {
				param = param.split("=");
				var key = param[0];
				var value = param[1];
				dataSource.params[key] = value;
			});
		}
		element.dataSources.push(dataSource);
	}
	element.node = null;
	return element;
}