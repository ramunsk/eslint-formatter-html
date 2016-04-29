/* global process */
/* global __dirname */
'use strict';

var fs   = require('fs'),
	path = require('path'),
	vash = require('vash'),
	firstBy = require('thenby');


function hasFatalErrors(item){
	return item.fatal;
}

function getStatus(item){
	var status = 'ok';
	
	if (item.messages.some(hasFatalErrors)){
		status = 'fatal error';
	} else if (item.errorCount > 0){
		status = 'error';
	} else if (item.warningCount > 0){
		status = 'warning';
	}
	
	return status; 
}


function formatter(options){
	
	options = options || {};
	options.title = options.title || 'ESLint report';
	
	return function(results){
		
		var i = 0, 
			stats = {
				totalErrors: 0,
				totalWarnings: 0,
				totalFiles: 0,
				totalFilesWithErrors: 0,
				totalFilesWithWarnings: 0,
				totalOkFiles: 0
			};
		
		results.forEach(function(r){
			var relative = path.relative(process.cwd(), r.filePath); 
			r.dirname = path.dirname(relative);
			r.filename = path.basename(relative);
			
			r.status = getStatus(r);
			 
			r.hash = 'f' + i++;

			stats.totalErrors += r.errorCount;
			stats.totalWarnings += r.warningCount;
			stats.totalFiles++;
			stats.totalFilesWithErrors += (r.errorCount === 0 ? 0 : 1);
			stats.totalFilesWithWarnings += (r.warningCount === 0 ? 0 : 1);
			stats.totalOkFiles += (r.errorCount + r.warningCount === 0 ? 1 : 0);
						
		});
		
		results.sort(firstBy('errorCount', -1).thenBy('warningCount', -1));
		
		var template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8');
		var css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf-8');
		var js = fs.readFileSync(path.join(__dirname, 'report.js'), 'utf-8');
		
		var compiled = vash.compile(template);

		return compiled({ results: results, css: css, js: js, title: options.title, stats: stats });
	};
}

module.exports = formatter;