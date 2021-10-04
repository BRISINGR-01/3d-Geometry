const http = require('http');
const fs = require('fs');

const {serveStaticFiles, requestDecoder} = require('./My helpers/helpers');
const {version} = require('./package.json');
const thisUrl = 'https://geometry-3d.herokuapp.com/'

const server = http.createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin' , '*');
	res.setHeader('Access-Control-Allow-Methods', '*');
	res.setHeader('Access-Control-Allow-Headers', '*');


	const request = requestDecoder(req, thisUrl);

	if (!request.value) if (serveStaticFiles('public/init.html', request, res)) return res.end();

	if (serveStaticFiles('public', request, res)) return res.end();
	if (serveStaticFiles('models', request, res)) return res.end();
	if (serveStaticFiles('fonts',  request, res)) return res.end();

	if (request.value === 'getFile') {
		const newScript = fs.readFileSync('public/script.js').toString()
			.replace('import * as THREE from \'./three.js\'',`const version = \'${version}\'`)
			.replace(/THREE\./g,'')// the THREE object is different
		const three = fs.readFileSync('public/three.js').toString()
			.replace(/export.+/g,'');
		const html = fs.readFileSync('public/init.html').toString()
			.replace('./favicon.ico', thisUrl + '/favicon.ico')
			.split("<script src=\"script.js\" type=\'module\'></script>");
		const font = fs.readFileSync('fonts/helvetiker_regular.typeface.json').toString();
		const geometries = `{
			ConvexGeometry,
			TeapotGeometry,
			BoxGeometry,
			ConeGeometry,
			CylinderGeometry,
			SphereGeometry,
			CircleGeometry,
			DodecahedronGeometry,
			IcosahedronGeometry,
			OctahedronGeometry,
			TetrahedronGeometry,
			PlaneGeometry,
			RingGeometry,
			TorusGeometry,
			TorusKnotGeometry,
			TeapotGeometry,
			TextGeometry,
			LatheGeometry,
			ParametricGeometry,
			ExtrudeGeometry
		}`// this is for createObject()

		const file = html.join(
			`<script>
				${three}
				const THREE = ${geometries};
				const defaultFont = ${font};
				${newScript}
			</script>`
		);

		if (request.query.file) {
			serveStaticFiles('public/updatingPage.html', request, res);
			const path = decodeURIComponent(request.query.file).replace(/^\//,'');
			if (fs.existsSync(path)) {
				fs.writeFileSync(path, file);
				res.write('<script>window.close()</script>');// to close immediately after it is done
			} else {
				res.write(`
				<body>
					<h1> An error occured <br><br> Try downloading it again from <a href=${thisUrl}>${thisUrl}</a></h1>
				</body>
				`);
				console.log('No such file');
			}
		} else {
			res.write(JSON.stringify(file));
		}
		return res.end();
	}

	if (request.value === 'getVersion') {
		res.write(JSON.stringify(version));
		return res.end();
	}

	if (request.value === 'video') if (serveStaticFiles('public/video.html',  request, res)) return res.end();

	serveStaticFiles('public/404.html', request, res);
	res.end();
});
server.listen(process.env.PORT || 3000);
