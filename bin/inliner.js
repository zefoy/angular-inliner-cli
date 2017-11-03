'use strict';

var fs = require('fs');
var path = require('path');

var CleanCSS = require('clean-css');
var htmlMinifier = require('html-minifier');

var htmlMinifierConfig = {
	caseSensitive: true,
	collapseWhitespace: true,
	// Angular bindings break the parser of html-minifer, so the
	// following skips the processing of ()="" and []="" attributes
	ignoreCustomFragments: [/\s\[.*\]=\"[^\"]*\"/, /\s\([^)"]+\)=\"[^\"]*\"/]
};

module.exports = function(directory, content, compress) {
	return processTemplateUrl(directory, content, compress).then((result) =>
		processStyleUrls(directory, result, compress));
};

function processTemplateUrl(directory, content, compress) {
	var result = content;

	var re = /('|"|\s*)templateUrl('|"|\s*):\s*(?:'([^']+)'|"([^"]+)")/g;

	var matches = result.match(re);

	if (matches === null || matches.length <= 0) {
		return Promise.resolve(result);
	} else {
		matches.forEach(() => {
			var exec = re.exec(content);

			var url = exec[3], quote = '\'';

			if (!url) {
				url = exec[4];
				quote = '"';
			}

			var file = fs.readFileSync(path.join(directory, url), 'utf-8');

			if (!compress) {
				file = htmlMinifier.minify(file, htmlMinifierConfig);
			} else {
				file = htmlMinifier.minify(file, Object.assign({}, htmlMinifierConfig,
					{removeComments: true}));
			}

			// Escape quotes
			file = file.replace(new RegExp(quote, 'g'), '\\' + quote);

			// Replace line changes
			file = file.split(/[\r\n]+/g).join(quote + ' +\n' + quote);

			result = result.replace(exec[0], exec[1] + 'template' + exec[2] +
				': ' + quote + file + quote);
		});

		return Promise.resolve(result);
	}
}

function processStyleUrls(directory, content, compress) {
	var result = content;

	var re = /('|"|\s*)styleUrls('|"|\s*):\s*(\[[^](.[^]*?)\])/g;

	var matches = result.match(re);

	if (matches === null || matches.length <= 0) {
		return Promise.resolve(result);
	} else {
		return Promise.all(matches.map(() => {
			var exec = re.exec(result);

			var urls = JSON.parse(exec[3].replace(/'/g, '"'));

			return Promise.all(urls.map((url) => {
				var file = fs.readFileSync(path.join(directory, url), 'utf-8');

				var filesRe = /^[\./]*([^]*)\.(css)$/g;

				var filesMatches = url.match(filesRe);

				if (filesMatches === null || filesMatches.length <= 0) {
					return file;
				} else {
					var filesExec = filesRe.exec(url);

					var filename = filesExec[1];
					var extension = filesExec[2];

					if (!compress) {
						file = file.replace(/[\r\n]/g, '');
					} else {
						file = new CleanCSS().minify(file).styles;
					}

					// Escape quotes
					file = file.replace(new RegExp('\'', 'g'), '\\\'');

					return file;
				}
			})).then((files) => {
				result = result.replace(exec[0], exec[1] + 'styles' + exec[2] +
					': [\'' + files.join('') + '\']');
			});
		})).then(() => {
			return result;
		});
	}
}
