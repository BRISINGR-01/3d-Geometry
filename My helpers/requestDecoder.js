const queriesDecoder = require('./queriesDecoder')

function requestDecoder(req, thisUrl) {
	const UrlObject = new URL(req.url, thisUrl);
	return {
		origin: UrlObject.origin,
		pathname: UrlObject.pathname,
		host: UrlObject.host,
		path: UrlObject.pathname.split('/').filter(el => el),
		query: queriesDecoder(req.url),
		value: UrlObject.pathname.split('/').pop(),
	}
}

module.exports = requestDecoder;