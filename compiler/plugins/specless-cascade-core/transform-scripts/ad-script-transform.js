module.exports = function (element) {
	if (element.node.attrs.src) {
		element.jsDependencies.push("$$$PROJECT$$$" + element.node.attrs.src);
	}
	element.node = null;
	return element;
}