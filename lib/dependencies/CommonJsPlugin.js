/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var ConstDependency = require("./ConstDependency");
var CommonJsRequireDependency = require("./CommonJsRequireDependency");
var CommonJsRequireContextDependency = require("./CommonJsRequireContextDependency");
var RequireResolveDependency = require("./RequireResolveDependency");
var RequireResolveContextDependency = require("./RequireResolveContextDependency");
var RequireResolveHeaderDependency = require("./RequireResolveHeaderDependency");
var RequireHeaderDependency = require("./RequireHeaderDependency");

var NullFactory = require("../NullFactory");

var RequireResolveDependencyParserPlugin = require("./RequireResolveDependencyParserPlugin");
var CommonJsRequireDependencyParserPlugin = require("./CommonJsRequireDependencyParserPlugin");

var BasicEvaluatedExpression = require("../BasicEvaluatedExpression");

function CommonJsPlugin(options) {
	this.options = options;
}
module.exports = CommonJsPlugin;

CommonJsPlugin.prototype.apply = function(compiler) {
	compiler.plugin("compilation", function(compilation, params) {
		var normalModuleFactory = params.normalModuleFactory;
		var contextModuleFactory = params.contextModuleFactory;

		compilation.dependencyFactories.set(CommonJsRequireDependency, normalModuleFactory);
		compilation.dependencyTemplates.set(CommonJsRequireDependency, new CommonJsRequireDependency.Template());

		compilation.dependencyFactories.set(CommonJsRequireContextDependency, contextModuleFactory);
		compilation.dependencyTemplates.set(CommonJsRequireContextDependency, new CommonJsRequireContextDependency.Template());

		compilation.dependencyFactories.set(RequireResolveDependency, normalModuleFactory);
		compilation.dependencyTemplates.set(RequireResolveDependency, new RequireResolveDependency.Template());

		compilation.dependencyFactories.set(RequireResolveContextDependency, contextModuleFactory);
		compilation.dependencyTemplates.set(RequireResolveContextDependency, new RequireResolveContextDependency.Template());

		compilation.dependencyFactories.set(RequireResolveHeaderDependency, new NullFactory());
		compilation.dependencyTemplates.set(RequireResolveHeaderDependency, new RequireResolveHeaderDependency.Template());

		compilation.dependencyFactories.set(RequireHeaderDependency, new NullFactory());
		compilation.dependencyTemplates.set(RequireHeaderDependency, new RequireHeaderDependency.Template());
	});
	compiler.parser.plugin("evaluate typeof require", function(expr) {
		return new BasicEvaluatedExpression().setString("function").setRange(expr.range);
	});
	compiler.parser.plugin("evaluate typeof module", function(expr) {
		return new BasicEvaluatedExpression().setString("object").setRange(expr.range);
	});
	compiler.parser.plugin("assign require", function(expr) {
		// to not leak to global "require", we need to define a local require here.
		var dep = new ConstDependency("var require;", 0);
		dep.loc = expr.loc;
		this.state.current.addDependency(dep);
		this.scope.definitions.push("require");
		return true;
	});
	compiler.parser.plugin("can-rename require", function(expr) {
		return true;
	});
	compiler.parser.plugin("rename require", function(expr) {
		// define the require variable. It's still undefined, but not "not defined".
		var dep = new ConstDependency("var require;", 0);
		dep.loc = expr.loc;
		this.state.current.addDependency(dep);
		return false;
	});
	compiler.parser.plugin("typeof module", function(expr) {
		return true;
	});
	compiler.parser.plugin("evaluate typeof exports", function(expr) {
		return new BasicEvaluatedExpression().setString("object").setRange(expr.range);
	});
	compiler.parser.apply(
		new CommonJsRequireDependencyParserPlugin(this.options),
		new RequireResolveDependencyParserPlugin(this.options)
	);
};