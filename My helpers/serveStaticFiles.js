const fs = require('fs');
const path = require('path');
const mimeTypes = require('./mimeTypes.json')

function serveStaticFiles(folder, {path: urlPath}, res) {
	// if you want to serve a certain file do it as serveStaticFiles('public/init.html', ...)
	if (urlPath[0] === folder) urlPath.splice(0, 1);// if the folder duplicates
	const filePath = folder.includes('/') ? folder : path.join(folder, ...urlPath);
	if (fs.existsSync(filePath)) {
		const extention = path.extname(filePath);
		const contentType = mimeTypes[extention] || 'text/plain';
		const file = fs.readFileSync(filePath).toString();

		res.setHeader('Content-Type', contentType);
		res.write(file);
		res.statusCode = 200;
		return true;
	}
	return false;
}

module.exports = serveStaticFiles;