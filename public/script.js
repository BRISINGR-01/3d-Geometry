import * as THREE from './three.js';
// at the WireframeGeometry2 I've changed the wirframe- to edgeGeometry so only the hard edges are rendered

// at the gui css I changed .cr.color{overflow:visible} to .cr.color{overflow:hidden}
//because if a color picker was opened in the gui, the scroll was limited and the whole gui couldn't be used

//at the gui ColorController I added two eventListeners so that the color picker itself can be used

//at the gui ColorController updateDisplay I replaced a commented line with the two afterwards, because the color picker didn't change if setValue was used in the code
//it used to change visually only if the user interacted

// search for 'edited by me', 'added by me' and 'imported by me' to see the changes I've made in the three.js file which I modified from three/build/three.module.js

const fileIsLocal = !window.location.protocol.includes('http') || window.location.hostname === '127.0.0.1';
const url = fileIsLocal && !window.location.host.includes('localhost:') ?
                'https://geometry-3d.herokuapp.com' :
            window.location.origin;

try {
    console.log('Current version: ', version);// if local, version will be defined
} catch (err) {
    fetch(`${url}/getVersion`).then(json => json.json()).then(version => console.log('Current version: ', version))
}

if (fileIsLocal) {
    // if there is an update it will automatically update the file if it is local
    function updateLocalFile() {
        fetch(`${url}/getVersion`)
        .then(vs => vs.json())
        .then(vs => {
            window.removeEventListener('click', updateLocalFile);
            window.removeEventListener('touchstart', updateLocalFile);
            if (vs === version) return;

            window.open(`${url}/getFile?file=${window.location.pathname}`);
            setTimeout(document.location.reload, 100);// to load the new file
        })
        .catch(() => {
            window.removeEventListener('click', updateLocalFile);
            window.removeEventListener('touchstart', updateLocalFile);
        })
    }
    window.addEventListener('click', updateLocalFile);
    window.addEventListener('touchstart', updateLocalFile);
}


class DiamondGeometry {
    constructor(height = 10, upperRadius = 8, lowerRadius = 10, upperSides = 8, lowerSides = 8, ringsDifference = 4, pilength = 2 * Math.PI) {
        const y2 = height / 2;
        const upperPoints2 = [];
        const lowerPoints2 = [];
        pilength = pilength || .001;

        let iteration = pilength / upperSides;
        let r = upperRadius;
        for (let i = 0; i <= pilength + iteration / 2; i += iteration) {
            upperPoints2.push(Math.cos(i) * r, y2 - 0.0001 * i, Math.sin(i) * r);
        }

        iteration = pilength / lowerSides;
        r = lowerRadius;
        for (let i = 0; i <= pilength + iteration / 2; i += iteration)
            lowerPoints2.push(Math.cos(i) * r, y2 - ringsDifference + 0.0001 * i, Math.sin(i) * r);


        const array2 = [...upperPoints2, ...lowerPoints2, 0, -y2, 0];
        let transformedArray2 = [];

        for (let i = 0; i < array2.length + 3; i += 3) {
            transformedArray2.push(new THREE.Vector3(
                array2[i],
                array2[i + 1],
                array2[i + 2]
            ));
        }
        return new THREE.ConvexGeometry(transformedArray2);
    }
}
class PrismGeometry {
    constructor(height = 8, sizes = [10, 10], angles = [[60, 60, 60]], openEnded = false) {
        sizes[1] = sizes[1] ?? sizes[0];
        if (angles[0].length < 3)
            angles[0] = [60, 60, 60];
        angles[1] = angles[1] ?? angles[0];
        if (angles[1].length < 3)
            angles[1] = [60, 60, 60];

        let n = angles[0].length;
        sizes = sizes.map(el => el * 4 / n); // keeps the radius the same as if it had 4 angles exactly the same as a BoxGeometry

        height = height * 1.5 || .1;
        let points = [[], []];
        const y = [height / 2, -height / 2];

        for (let base = 0; base < 2; base++) {
            angles[base] = angles[base].map((el, i) => i === 0 ? 90 - el : 180 - el); // so the angles start counterclockwise at the end of the previous one
            angles[base] = angles[base].map(el => el * Math.PI / 180);
            const r = sizes[base] * 1.5 || .1;
            let currentAngle = 0;
            let origin = [0, y[base], 0];
            points[base].push(new THREE.Vector3(0, y[base], 0));

            for (let i = 0; i < angles[base].length - 1; i++) {
                currentAngle += angles[base][i];
                points[base].push(new THREE.Vector3(
                    Math.cos(currentAngle) * r + origin[0],
                    y[base],
                    Math.sin(currentAngle) * r + origin[2]
                ));
                origin = points[base][points[base].length - 1].toArray();
            }

            let i = points[base].length - 1;
            let previousOrigin = points[base][points[base].length - 2].toArray();
            let thisX = points[base][i].x;
            origin = points[base][i - 1].x;
            const originVector = new THREE.Vector3(previousOrigin[0], 0, previousOrigin[2]);

            points[base][i].sub(originVector);
            points[base][i].multiply(new THREE.Vector3(origin / (origin - thisX), 1, origin / (origin - thisX)));
            points[base][i].add(originVector);
            // the idea is that every `angle n` except the last defines an angle and then the last point is extended/shortened to be at x=0


            let maxZ = points[base].reduce((a, c) => Math.max(a, c.z), 0);
            let minZ = points[base].reduce((a, c) => Math.min(a, c.z), 0);
            let maxX = points[base].reduce((a, c) => Math.max(a, c.x), 0);
            // make it be in the center
            points[base].forEach(el => {
                el.x -= maxX / 2;
                el.z -= (maxZ + minZ) / 2;
            });
        }
        points = [...points[0], ...points[1]];
        return new THREE.ConvexGeometry(points);
    }
}
class PyramidGeometry {
    constructor(height = 8, size = 10, angles = [60, 60, 60], openEnded = false) {
        if (angles.length < 3)
            angles = [60, 60, 60];
        size = size * 4 / angles.length; // keeps the radius the same as if it had 4 angles exactly the same as a BoxGeometry
        height = height * 1.5 || .1;
        const y = height / 2;
        const points = [new THREE.Vector3(0, -y, 0)];
        const r = size * 1.5 || .1;
        let currentAngle = 0;
        let origin = [0, 0, 0];

        angles = angles.map((el, i) => i === 0 ? 90 - el : 180 - el); // so the angles start counterclockwise at the end of the previous one
        angles = angles.map(el => el * Math.PI / 180);

        for (let i = 0; i < angles.length - 1; i++) {
            currentAngle += angles[i];
            points.push(new THREE.Vector3(
                Math.cos(currentAngle) * r + origin[0],
                -y,
                Math.sin(currentAngle) * r + origin[2]
            ));
            origin = points[points.length - 1].toArray();
        }

        let i = points.length - 1;
        let previousOrigin = points[points.length - 2].toArray();
        let thisX = points[i].x;
        origin = points[i - 1].x;
        const originVector = new THREE.Vector3(previousOrigin[0], 0, previousOrigin[2]);

        points[i].sub(originVector);
        points[i].multiply(new THREE.Vector3(origin / (origin - thisX), 1, origin / (origin - thisX)));
        points[i].add(originVector);
        // the idea is that every `angle n` except the last defines an angle and then the last point is extended/shortened to be at x=0
        let maxZ = points.reduce((a, c) => Math.max(a, c.z), 0);
        let minZ = points.reduce((a, c) => Math.min(a, c.z), 0);
        let maxX = points.reduce((a, c) => Math.max(a, c.x), 0);
        // make it centered
        points.forEach(el => {
            el.x -= maxX / (angles.length === 3 ? 3 : 2);
            el.z -= (maxZ + minZ) / 2;
        });

        let vertices = [];
        if (!openEnded) {
            for (let i = 0; i < points.length - 0; i++) {
                vertices.push(
                    ...points[i].toArray(),
                    0, -y, 0,
                    ...points[i + 1 === points.length ? 0 : i + 1].toArray()
                );
            } // base
        }
        for (let i = 0; i < points.length - 0; i++) {
            vertices.push(
                ...points[i].toArray(),
                0, y, 0,
                ...points[i + 1 === points.length ? 0 : i + 1].toArray()
            );
        } // torso
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        return geometry;
    }
}
class CustomShapeGeometry {
    constructor(size = 10, angles = [60, 60, 60]) {
        if (angles.length < 3)
            angles = [60, 60, 60];
        size = size * 4 / angles.length; // keeps the radius the same as if it had 4 angles exactly the same as a BoxGeometry
        const points = [new THREE.Vector3(0, 0, 0)];
        const r = size * 1.5 || .1;
        let currentAngle = 0;
        let origin = [0, 0, 0];

        angles = angles.map((el, i) => i === 0 ? 90 - el : 180 - el); // so the angles start counterclockwise at the end of the previous one
        angles = angles.map(el => el * Math.PI / 180);

        for (let i = 0; i < angles.length - 1; i++) {
            currentAngle += angles[i];
            points.push(new THREE.Vector3(
                Math.cos(currentAngle) * r + origin[0],
                0,
                Math.sin(currentAngle) * r + origin[2]
            ));
            origin = points[points.length - 1].toArray();
        }

        let i = points.length - 1;
        let previousOrigin = points[points.length - 2].toArray();
        let thisX = points[i].x;
        origin = points[i - 1].x;
        const originVector = new THREE.Vector3(previousOrigin[0], 0, previousOrigin[2]);

        points[i].sub(originVector);
        points[i].multiply(new THREE.Vector3(origin / (origin - thisX), 1, origin / (origin - thisX)));
        points[i].add(originVector);
        // the idea is that every `angle n` except the last defines an angle and then the last point is extended/shortened to be at x=0
        let maxZ = points.reduce((a, c) => Math.max(a, c.z), 0);
        let minZ = points.reduce((a, c) => Math.min(a, c.z), 0);
        let maxX = points.reduce((a, c) => Math.max(a, c.x), 0);
        // make it centered
        points.forEach(el => {
            el.x -= maxX / 2;
            el.z -= (maxZ + minZ) / 2;
        });

        let vertices = [];
        for (let i = 0; i < points.length - 0; i++) {
            vertices.push(
                ...points[i].toArray(),
                0, 0, 0,
                ...points[i + 1 === points.length ? 0 : i + 1].toArray()
            );
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        return geometry;
    }
}
class TesseractGeometry {
    constructor(width, height, depth, w) {
        const x = width / 2;
        const y = height / 2;
        const z = depth / 2;
        w = w + 1;
        const vertices = [];
        let edges = [[x,y,z], [-x,y,z], [-x,y,-z], [x,y,-z]];
        let edges2 = edges.map(el => el.map(el2 => el2 * w));
        function getTiangles(a,b,c,d) {
            return [...a,...b,...c, ...a,...c,...d];
        }
        for (let base = 1; base > -2; base -= 2) {
            edges = edges.map(el => {
                el[1] = y * base;
                return el;
            });
            edges2 = edges.map(el => el.map(el2 => el2 * w));
            vertices.push(
                ...getTiangles(...edges),
                ...getTiangles(edges[0], edges2[0], edges2[1], edges[1]),
                ...getTiangles(edges[1], edges2[1], edges2[2], edges[2]),
                ...getTiangles(edges[2], edges2[2], edges2[3], edges[3]),
                ...getTiangles(edges[3], edges2[3], edges2[0], edges[0]),
            )
        }
        edges = [[x,y,z], [-x,y,z], [-x,y,-z], [x,y,-z], [x,y,z]]
        edges2 = edges.map(el => el.map(el2 => el2 * w));
        for (let i = 0; i < 4; i++) {
            let edgesBottom = [...edges.map(el => [...el])];//to avoid references
            edgesBottom = edgesBottom.map(el => {
                el[1] *= -1;
                return el;
            });
            let edgesBottom2 = [...edges2.map(el => [...el])];//to avoid references
            edgesBottom2 = edgesBottom2.map(el => {
                el[1] *= -1;
                return el;
            });
            vertices.push(
                ...getTiangles(edges[i], edgesBottom[i], edgesBottom[i+1], edges[i+1]),
                ...getTiangles(edges[i], edges2[i], edgesBottom2[i], edgesBottom[i]),
            );
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        return geometry;
    }
}
class Simplex {

}


const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ),
      oneAtATime = ['isDrawing', 'dragPoints'],
      mouse = new THREE.Vector2(window.innerHeight + 1, window.innerWidth + 1),
      dressesObjects = ['armenka', 'bulgari', 'evrein', 'romska', 'turchin'],
      chemistryObjects = [
          "AL2O3", "aspirin", "buckyball", "caf2", "caffeine", "cholesterol",
          "cocaine", "cu", "cubane", "diamond", "ethanol", "glucose",
          "graphite", "lsd", "lycopene", "nacl", "nicotine", "ybco"
      ],
      renderer = new THREE.WebGLRenderer( {antialias: true} ),
      isTouchScreen = 'ontouchstart' in window,
      previousMouse3d = new THREE.Vector3(),
      mouse3d = new THREE.Vector3(0,0,0),
      raycaster = new THREE.Raycaster(),
      scene = new THREE.Scene(),
      axes = new THREE.Group(),
      gui = new THREE.GUI(),
      listOfGeometry = {},
      twoPi = Math.PI * 2,
      Wireframes = [],
      matLines = [],
      Meshes = [],
      points = [],
      lights = [],
      Texts = [],
      Lines = [];

let previousX = camera.position.x, previousY = camera.position.y,
    dragPointsObject, dragIndexes = [],
    currObj = {points: [], Id: ''},
    mouseWasHeldOverMesh = false,
    forcedByInscribed = false,
    isMouseDragged = true,
    intersectsLength = 0,
    xFunc, yFunc, zFunc,
    clickVectorsArr = [],
    clickPointsArr = [],
    selectedObject,
    intersects,
    plane,
    orbit;



const defaultSettings = {
    sceneColor: 0x444444,
    meshColor: 0x4080ff,
    meshLinewidth: 1,
    childrenTextSize: 5,
    childrenColor: 0x00ff00,
    linewidth: 1,
    axes: true,
    axesWidth: 1,
    isDrawing: false,
    dragPoints: false,
    moveObjects: false
}
const settings = {
    ...defaultSettings,
    sceneColor: parseInt(window.localStorage.sceneColor, 16) || defaultSettings.sceneColor,
    meshColor: parseInt(window.localStorage.meshColor, 16) || defaultSettings.meshColor,
    meshLinewidth: Number(window.localStorage.meshLinewidth) || defaultSettings.meshLinewidth,
    childrenColor: parseInt(window.localStorage.childrenColor, 16) || defaultSettings.childrenColor,
    childrenTextSize: Number(window.localStorage.childrenTextSize) || defaultSettings.childrenTextSize,
    linewidth: Number(window.localStorage.linewidth) || defaultSettings.linewidth,
    axes: window.localStorage.axes === 'false' ? false : defaultSettings.axes,
    axesWidth: Number(window.localStorage.axesWidth) || defaultSettings.axesWidth,

    newDraw() {
        clickVectorsArr = [];
        clickPointsArr = [];
    },
    async download(){
        fetch(`${url}/getFile`).then(response => response.body)
        .then(rb => {
          const reader = rb.getReader();
          return new ReadableStream({
            start(controller) {
              function push() {
                reader.read().then( ({done, value}) => {
                  if (done) return controller.close();
                  controller.enqueue(value);
                  push();
                });
              }
              push();
            }
          });
        })
        .then(stream => new Response(stream, { headers: { "Content-Type": "text/html" } }))
        .then(saveFile);
        async function saveFile(result) {
            result = await result.text();
            result = JSON.parse(result);
            let options = {
                startIn: 'desktop',
                types: [{
                    description: 'html',
                    accept: {'text/html': ['.html']},
                  }],
                suggestedName: '3D Geometry'
            }
            const fileHandle = await window.showSaveFilePicker(options);
            const writableStream = await fileHandle.createWritable();
            await writableStream.write(result);
            await writableStream.close();
        }
    },
    import() {
        const pickerOpts = {
            types: [
              {
                description: '3d Objects',
                accept: {
                  'object/*': ['.obj', '.gltf', '.mtl', '.pdb']
                }
              },
            ],
            excludeAcceptAllOption: false,
            multiple: true
          };
          let filesHandle, files = [];
          (async function getFile() {
            var reader = new FileReader();
            filesHandle = await window.showOpenFilePicker(pickerOpts);
            for (let i = 0; i < filesHandle.length; i++) {
                files[i] = await filesHandle[i].getFile();
            }
            files = files.sort((a,b) => a.name.includes('.mtl') ? -1 : 1);
            let index = 0;
            let object = new THREE.BoxGeometry();
            let material = new THREE.MeshBasicMaterial({color: settings.meshColor});
            var mtlLoader = new THREE.MTLLoader();


            reader.onload = function ()
            {
                function next() {
                    index++;
                    if (files[index]) {
                        reader.readAsText(files[index])
                    } else {
                        scene.add(object);
                        addObject(object);
                    };
                }
                switch (files[index].name.split('.')[1]) {
                    case 'obj':
                        object = new THREE.OBJLoader().parse(this.result);
                        next();
                        break;
                    case 'gltf':
                        object = new THREE.GLTFLoader().parse(this.result,'',(obj) => {
                            object = obj.scene.children[0].children[0];
                            next();
                        });
                        break;
                    case 'mtl':
                        // material = mtlLoader.parse(this.result);
                        next()
                        break;
                    case 'pdb':
                        object = new THREE.PDBLoader().parse(this.result,'', pdb => {
                            next();
                        });
                        break;
                    default:
                        next();
                        break;
                }
            };
            reader.readAsText(files[0]);
          })();
    },
    export() {
        const exporter = new THREE.OBJExporter();
        const object = new THREE.Object3D();
            Meshes.forEach(mesh => object.add(mesh));
        const result = exporter.parse(object);
        const blob = new Blob([result]);
        const downloader = document.createElement('a');
				downloader.download = '3D Object.obj';
				downloader.href = window.URL.createObjectURL(blob);
				downloader.click();
    },
    video() {
        window.location.href += 'video';
    },
    reset() {
        const settingsFolder = gui.__folders['Settings'];
        window.localStorage.clear();
        for (const key in defaultSettings) {
            settingsFolder.__controllers.find(el => el.property === key)?.setValue(defaultSettings[key]);
        }
    }
}

const geometriesToInscribe = {
    BoxGeometry: obj => {
      const outerObj = obj.circumscribed;
      let r = 0;
      const w = obj.data.width,
            h = obj.data.height,
            d = obj.data.depth;
      function set (property, val) {
          outerObj.folder.__controllers.find(el => el.property === property).setValue(val);
      }
      switch (obj.circumscribed.name) {
          case 'SphereGeometry':
              r = Math.hypot(w / 2, h / 2, d / 2);
              set('r', r)
              break;
          case 'CylinderGeometry' :
              r = Math.hypot(obj.data.width / 2, d / 2);
              set('radiusTop', r);
              set('radiusBottom', r);
              set('r', 1);
              set('height', obj.data.height);
          break;
          case 'ConeGeometry':
              const coneH = outerObj.data.height;
              let alpha = (coneH - h) / Math.hypot(d / 1,w / 1);
              set('r', h / alpha);
              set('height', h * 2);// works only if coneH is 2*h
//fix
              outerObj.position.y = coneH / 2 - h / 2;
          default:
              break;
      }
    },
    ConeGeometry: obj => {
        const outerObj = obj.circumscribed;
        let r = 0;
        function set (property, val) {
            outerObj.folder.__controllers.find(el => el.property === property).setValue(val);
        }
        switch (obj.circumscribed.name) {
            case 'SphereGeometry':
                break;
            case 'CylinderGeometry' :
            break;
            case 'BoxGeometry':
                set('height', obj.data.height);
                set('width', obj.data.r * 2);
                set('depth', obj.data.r * 2);
            default:
                break;
        }

    },
    CylinderGeometry: obj => {

    },
    SphereGeometry: obj => {

    },
    PrismGeometry: obj => {

    },
    PyramidGeometry: obj => {

    },
    PlaneGeometry:obj => {

    }
}
const customShapes = {
    DiamondGeometry,
    PrismGeometry,
    PyramidGeometry,
    CustomShapeGeometry,
    TesseractGeometry,
    Simplex,
}

const hedron = {
    values: {
        radius: 10,
        detail: 0,
    },
    max: {
        radius: 20,
        detail: 5,
    },
    min: {
        radius: 1,
        detail: 0,
    },
    steps: {
        detail: 1,
    },
    names: {
        radius: 'r',
    },
    order: data => [data.radius, data.detail]
};
const circle = {
    values: {
        radius: 10,
        n: 32,
        thetaLength: twoPi,
    },
    max: {
        radius: 20,
        thetaLength: twoPi,
        n: 128,
    },
    min: {
        radius: 1,
        thetaLength: 0,
        n: 0,
    },
    steps: {
        n: 1
    },
    names: {
        radius: 'r',
        thetaLength: 'π',
    }
}
const defaultValues = {
    BoxGeometry: {
        values: {
            width: 15,
            height: 15,
            depth: 15,
        },
        max: {
            width: 30,
            height: 30,
            depth: 30,
        },
        min: {
            width: 1,
            height: 1,
            depth: 1,
        },
        order: data => [data.width, data.height, data.depth]
    },
    CylinderGeometry: {
        values: {
            ...circle.values,
            height: 20,
            openEnded: false,
        },
        max: {
            ...circle.max,
            height: 50,
        },
        min: {
            ...circle.min,
            height: 1,
        },
        names: {
            ...circle.names,
            height: 'h',
            openEnded: 'open ended',
        },
        order: data => [data.radius, data.radius, data.height, data.n, undefined, data.openEnded, undefined, data.thetaLength]
    },
    ConeGeometry: {
        values: {
            ...circle.values,
            height: 20,
            openEnded: false,
        },
        max: {
            ...circle.max,
            height: 50,
        },
        min: {
            ...circle.min,
            height: 1,
        },
        names: {
            ...circle.names,
            height: 'h',
            openEnded: 'open ended',
        },
        order: data => [data.radius, data.height, data.n, undefined, data.openEnded, undefined, data.thetaLength]
    },
    CircleGeometry: {
        ...circle,
        order: data => [data.radius, data.n, undefined, data.thetaLength]
    },
    DodecahedronGeometry: {
        ...hedron
    },
    IcosahedronGeometry: {
        ...hedron
    },
    OctahedronGeometry: {
        ...hedron
    },
    TetrahedronGeometry: {
        ...hedron,
    },
    LatheGeometry: {
        values: {
            n: 12,
            phiLength: twoPi,
        },
        max: {
            n: 30,
            phiLength: twoPi,
        },
        min: {
            n: 0,
            phiLength: 0,
        },
        names: {
            phiLength: 'π',
        },
        order: data => [data.points, data.n, 0, data.phiLength]
    },
    PlaneGeometry: {
        values: {
            height: 30,
            width: 30,
        },
        max: {
            height: 300,
            width: 300,
        },
        min: {
            height: 1,
            width: 1,
        },
        order: data => [data.width, data.height]
    },
    RingGeometry: {
        values: {
            innerRadius: 5,
            outerRadius: 10,
            n: 8,
            thetaLength: twoPi,
        },
        max: {
            innerRadius: 30,
            outerRadius: 30,
            n: 30,
            thetaLength: twoPi,
        },
        min: {
            innerRadius: 1,
            outerRadius: 1,
            n: 1,
            thetaLength: 0,
        },
        steps: {
            n: 1
        },
        names: {
            innerRadius: 'inner r',
            outerRadius: 'outer r',
            thetaLength: 'π',
        },
        order: data => [data.innerRadius, data.outerRadius, data.n, 8, 0, data.thetaLength]
    },
    SphereGeometry: {
        values: {
            radius: 15,
            widthSegments: 32,
            heightSegments: 32,
            phiLength: twoPi,
            thetaLength: twoPi,
        },
        max: {
            radius: 30,
            widthSegments: 128,
            heightSegments: 128,
            phiLength: twoPi,
            thetaLength: twoPi,
        },
        min: {
            radius: 1,
            widthSegments: 1,
            heightSegments: 1,
            phiLength: 0,
            thetaLength: 0,
        },
        names: {
            widthSegments: '| segments',
            heightSegments: '— segments',
            thetaLength: '| π',
            phiLength: '— π',
            radius: 'r',
        },
        order: data => [data.radius, data.widthSegments, data.heightSegments, 0, data.phiLength, 0, data.thetaLength / 2]
    },
    TextGeometry: {
        values: {
            text: 'TextGeometry',
            size: 5,
            height: 2,
            curveSegments: 12,
            font: 'helvetiker',
            weight: 'regular',
            bevelEnabled: false,
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelOffset: 0.0,
            bevelSegments: 3,
        },
        max: {
            size: 30,
            height: 20,
            curveSegments: 20,
            bevelThickness: 3,
            bevelSize: 3,
            bevelOffset: 1.5,
            bevelSegments: 8,
        },
        min: {
            size: 1,
            height: 1,
            font: ['helvetiker', 'optimer', 'gentilis', 'droid/droid_serif'],
            weight: ['regular', 'bold'],
            curveSegments: 1,
            bevelThickness: .1,
            bevelSize: 0,
            bevelOffset: -.5,
            bevelSegments: 0,
        },
        steps: {
            bevelSegments: 1
        },
        names: {
            curveSegments: 'curve segments',
            bevelEnabled: 'bevel',
            bevelThickness: 'bevel-thickness',
            bevelSize: 'bevel-size',
            bevelOffset: 'bevel-offset',//fix make it in one folder
            bevelSegments: 'bevel-segments',
        },
        order: (data, font) => [data.text, {
            font: font,
            size: data.size,
            height: data.height,
            curveSegments: data.curveSegments,
            bevelEnabled: data.bevelEnabled,
            bevelThickness: data.bevelThickness,
            bevelSize: data.bevelSize,
            bevelOffset: data.bevelOffset,
            bevelSegments: data.bevelSegments
        } ]
    },
    TorusGeometry: {
        values: {
            radius: 10,
            tube: 3,
            radialSegments: 16,
            tubularSegments: 100,
            arc: twoPi,
        },
        max: {
            radius: 20,
            tube: 10,
            radialSegments: 30,
            tubularSegments: 200,
            arc: twoPi,
        },
        min: {
            radius: 1,
            tube: .1,
            radialSegments: 1,
            tubularSegments: 1,
            arc: 0,
        },
        names: {
            radialSegments: 'radial segments',
            tubularSegments: 'tubular segments',
            tube: 'tube r',
            radius: 'r',
            arc: 'π',
        },
        order: data => [data.radius, data.tube, data.radialSegments, data.tubularSegments, data.arc]
    },
    TorusKnotGeometry: {
        values: {
            radius: 10,
            tube: 3,
            tubularSegments: 64,
            radialSegments: 8,
            p: 2,
            q: 3,
        },
        max: {
            radius: 20,
            tube: 10,
            tubularSegments: 300,
            radialSegments: 20,
            p: 20,
            q: 20,
        },
        min: {
            radius: 1,
            tube: .1,
            tubularSegments: 1,
            radialSegments: 1,
            p: 1,
            q: 1
        },
        steps: {
            p: 1,
            q: 1,
        },
        names: {
            radialSegments: 'radial segments',
            tubularSegments: 'tubular segments',
            tube: 'tube r',
            radius: 'r',
        },
        order: data => [data.radius, data.tube, data.tubularSegments, data.radialSegments, data.p, data.q]
    },
    ParametricGeometry: {
        values: {
            x: 10,
            y: 10,
            z: 10,
            type: '',
            X: '',
            Y: '',
            Z: '',
            T: 2,
            C1: 1,
            C2: 1,
            piVertical: Math.PI * 2,
            piHorizontal: Math.PI * 2,
            slices: 25,
            stacks: 25,
        },
        max: {
            x: 25,
            y: 25,
            z: 25,
            T: 15,
            C1: 25,
            C2: 25,
            piVertical: Math.PI * 2,
            piHorizontal: Math.PI * 2,
            slices: 100,
            stacks: 100,
        },
        min: {
            x: -25,
            y: -25,
            z: -25,
            type: [
                'klein\'s bottle',
                'plane',
                'mobius',
                'mobius3d',
                'hyperbolic helicoid',
                'helicoid',
                // 'gear',
                'sphere',
                'hyperbola',
                // 'hyperbola3d',
                'custom'
            ],
            T: -15,
            C1: -25,
            C2: -25,
            piVertical: 0,
            piHorizontal: 0,
            slices: 1,
            stacks: 1,
        },
        steps: {
            slices: 1,
            stacks: 1,
        },
        names: {
            stacks:  '| segments',
            slices: '— segments',
            piVertical: '| π',
            piHorizontal: '— π',
        },
        order: data => [data.functions[data.type] || data.functions['klein\'s bottle'], data.slices, data.stacks]
    },
    KnotGeometry: {
        values: {
            size: 10,
            radius: 1,
            segments: 100,
            radialSegments: 20,
            knot: 'GrannyKnot',
            t: 1
        },
        max: {
            size: 20,
            segments: 200,
            radius: 10,
            radialSegments: 50,
            x: 10,
            y: 10,
            z: 10,
            t: 10
        },
        min: {
            size: 1,
            segments: 1,
            radius: 1,
            radialSegments: 1,
            knot: ["Granny Knot",
                   "Heart Curve",
                   "Viviani Curve",
                   "Knot Curve",
                   "Helix Curve",
                   "Trefoil Knot",
                   "Torus Knot",
                   "Cinquefoil Knot",
                   "Trefoil Polynomial Knot",
                   "Figure Eight Polynomial Knot",
                   "Decorated Torus Knot 4a",
                   "Decorated Torus Knot 4b",
                   "Decorated Torus Knot 5a",
                   "Decorated Torus Knot 5c"],
            t: 0
        },
        steps: {
           segments: 1,
           radialSegments: 1
        },
        names: {
            radialSegments: 'radial segments',
            segments: 'tubular segments',
            radius: 'tube r',
        },
        order: data => [new THREE._Curves[data.knot.replace(/\s+/g,'') || 'GrannyKnot'](data.size, data.x, data.y, data.z, data.t), data.segments, data.radius, data.radialSegments, false]
    },
    ShapeGeometry: {
        values: {
            segments: 12,
        },
        max: {
            segments: 30,
        },
        min: {
            segments: 0,
        },
        order: data => [data.shape]
    },
    ExtrudeGeometry: {
        values: {
            depth: 16,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 1,
        },
        max: {
            depth: 20,
            bevelThickness: 5,
            bevelSize: 5,
            bevelOffset: 5,
            bevelSegments: 5,
        },
        min: {
            depth: 1,
            bevelThickness: 1,
            bevelSize: 0,
            bevelOffset: -4,
            bevelSegments: 1,
        },
        steps: {
            bevelSegments: 1
        },
        names: {
            bevelEnabled: 'bevel',
            bevelThickness: 'bevel-thickness',
            bevelSize: 'bevel-size',
            bevelOffset: 'bevel-offset',//fix make it in one folder
            bevelSegments: 'bevel-segments',
        },
        order: data => [data.shape, {
            depth: data.depth,
            bevelEnabled: data.bevelEnabled,
            bevelThickness: data.bevelThickness,
            bevelSize: data.bevelSize,
            bevelOffset: data.bevelOffset,
            bevelSegments: data.bevelSegments,
        }]
    },
    TeapotGeometry: {
        values: {
            size: 10,
            segments: 10,
            bottom: true,
            lid: true,
            body: true,
            fitLid: true,
            blinn: true,
        },
        max: {
            size: 20,
            segments: 20,
        },
        min: {
            size: 1,
            segments: 1,
        },
        order: data => [data.size, data.segments, data.bottom, data.lid, data.body, data.fitLid, data.blinn]
    },
    ConvexGeometry: {
        values: {
        },
        max: {
        },
        min: {
        },
        order: data => [data.points]
    },
    DiamondGeometry: {
        values: {
            height: 15,
            upperRadius: 8,
            lowerRadius: 10	,
            upperSides: 6,
            lowerSides: 6,
            ringsDifference: 3,
            pilength: Math.PI * 2,
        },
        max: {
            height: 30,
            upperRadius: 30,
            lowerRadius: 30,
            upperSides: 30,
            lowerSides: 30,
            ringsDifference: 10,
            pilength: Math.PI * 2,
        },
        min: {
            height: 0,
            upperRadius: 0,
            lowerRadius: 0,
            upperSides: 1,
            lowerSides: 1,
            ringsDifference: 0,
            pilength: 0,
        },
        names: {
            upperRadius: 'upper r',
            lowerRadius: 'lower r',
            upperSides: 'upper n',
            lowerSides: 'lower n',
            ringsDifference: 'rings difference',
            pilength: 'π',
        },
        order: data => [data.height, data.upperRadius, data.lowerRadius, data.upperSides, data.lowerSides, data.ringsDifference, data.pilength]
    },
    PrismGeometry: {
        values: {
            height: 10,
            sameBases: true
        },
        max: {
            height: 30,
            angle: 180,
        },
        min: {
            height: 0,
            angle: 0,
        },
        steps: {
            angle: 15,
        },
        names: {
            height: 'h',
            sameBases: 'same bases',
        },
        order: data => [data.height, data.sizes, data.angles, data.openEnded]
    },
    PyramidGeometry: {
        values: {
            height: 10,
            size: 10,
            openEnded: false,
        },
        max: {
            height: 30,
            angle: 180,
            size: 30,
        },
        min: {
            height: 0,
            angle: 0,
            size: 0,
        },
        steps: {
            angle: 15,
        },
        names: {
            height: 'h',
            openEnded: 'open ended',
        },
        order: data => [data.height, data.size, Object.values(data.angles), data.openEnded]
    },
    CustomShapeGeometry: {
        values: {
            size: 10,
            pilength: Math.PI * 2,
        },
        max: {
            angle: 180,
            size: 30,
            pilength: Math.PI * 2,
        },
        min: {
            angle: 0,
            size: 0,
            pilength: 0,
        },
        steps: {
            angle: 15,
        },
        names: {
            pilength: 'π',
        },
        order: data => [data.size, Object.values(data.angles), data.openEnded]
    },
    DrawnObjectGeometry: {
        values: {
        },
        max: {
        },
        min: {
        },
        order: data => []
    },
    ImportedGeometry: {
        values: {
        },
        max: {
        },
        min: {
        },
        order: data => []
    },
    TesseractGeometry: {
        values: {
            width: 15,
            height: 15,
            depth: 15,
            w: 1
        },
        max: {
            width: 30,
            height: 30,
            depth: 30,
            w: 1
        },
        min: {
            width: 1,
            height: 1,
            depth: 1,
            w: 0
        },
        order: data => [data.width, data.height, data.depth, data.w]
    },
    CliffordTorusGeometry: {
        values: {
        },
        max: {
        },
        min: {
        },
        order: data => []
    },
    ChemistryGeometry: {
        values: {
            showAtoms: true,
            showBonds: true,
        },
        max: {
        },
        min: {
        },
        names: {
            showAtoms: 'atoms',
            showBonds: 'bonds',
        },
        order: data => []
    },
    chemistry: {
        size: .05
    },
}

function updateObject(obj, geometry = obj?.children[1]?.geometry) {
    const data = obj.data;
    if (obj.isChild) {
        obj.Color = data.color;
        obj.material.color.set(data.color);
        obj.text.material.color.set(data.color);
        obj.material.linewidth = data.linewidth / 100;
        if (obj.type === 'point') obj.geometry = new THREE.SphereGeometry(data.linewidth / 2);
        return;
    }
    let wireframe = obj.children.find(el => el.type === 'Wireframe');
    const mesh = obj.children.find(el => el.type === 'Mesh');
    const type = geometry?.type ?? geometry;

    if (type === 'ImportedGeometry') {
        const children = obj.children.filter(el => el.type === 'Mesh');
        for (let i = 0; i < children.length; i++) {
            const mesh = children[i];
            wireframe = mesh.parent.children[i + (mesh.parent.children.length / 2)];// get the coresponding wireframe
            wireframe.material.linewidth = data.linewidth;

            mesh.material.opacity = data.opacity;
            mesh.material.color.set(data.color);
            mesh.scale.set(...(data.object ? [1,1,1] : [0,0,0]));
            wireframe.material.opacity = data.opacity;
            wireframe.material.color.set(data.color);
            wireframe.scale.set(...(data.edges ? [1,1,1] : [0,0,0]));
        }
        obj.Color = data.color;
    } else if (type === 'ChemistryGeometry') {
        const array = obj.children;
        for (let i = 0; i < array.length; i++) {
            let type = array[i].geometry.type;
            if (type === 'BoxGeometry') {
                array[i].visible = data.showBonds
            } else {
                array[i].visible = data.showAtoms
            }
        }
    } else {
        obj.Color = new THREE.Color(data.color);
        if (data.edges) {
            wireframe.geometry = new THREE.WireframeGeometry2( geometry );
            wireframe.material.linewidth = data.linewidth;
            wireframe.material.opacity = data.opacity;
            wireframe.material.color.set(obj.Color);
            wireframe.scale.set(1,1,1);
        } else if (wireframe) wireframe.scale.set(0,0,0);

        if (data.object) {
            mesh.geometry = geometry;
            mesh.material.color.set(obj.Color);
            mesh.material.opacity = data.opacity;
            mesh.scale.set(1,1,1);
        } else mesh.scale.set(0,0,0);

        if (type !== 'ParametricGeometry' && data.x !== undefined && (data.x !== 1 || data.y !== 1 || data.z !== 1)) {
            const arrayObj = mesh.geometry.attributes.position;
            const arrayWireStart = wireframe.geometry.attributes.instanceStart;
            const arrayWireEnd = wireframe.geometry.attributes.instanceEnd;
            for (let i = 0; i < arrayObj.array.length/3; i++) {
                    arrayObj.setX(i, arrayObj.getX(i) * data.x);
                    arrayObj.setY(i, arrayObj.getY(i) * data.y);
                    arrayObj.setZ(i, arrayObj.getZ(i) * data.z);
            }
            for (let i = 0; i < arrayWireStart.data.array.length/6 ; i++) {
                arrayWireStart.setX(i, arrayWireStart.getX(i) * data.x);
                arrayWireStart.setY(i, arrayWireStart.getY(i) * data.y);
                arrayWireStart.setZ(i, arrayWireStart.getZ(i) * data.z);
            }
            for (let i = 0; i < arrayWireEnd.data.array.length/6; i++) {
                arrayWireEnd.setX(i, arrayWireEnd.getX(i) * data.x);
                arrayWireEnd.setY(i, arrayWireEnd.getY(i) * data.y);
                arrayWireEnd.setZ(i, arrayWireEnd.getZ(i) * data.z);
            }
        }

        if (data.moveX || data.moveZ) {
            const positions = mesh.geometry.attributes.position;
            const arrayObj = positions.array;
            const arrayWireStart = wireframe.geometry.attributes.instanceStart.data.array;
            const arrayWireEnd = wireframe.geometry.attributes.instanceEnd.data.array;
            const height = arrayObj[1];
            const degX = data.moveX;
            const degZ = data.moveZ;
            const moveX = Math.tan(degX * Math.PI / 180) * height;
            const moveZ = Math.tan(degZ * Math.PI / 180) * height;


            for (let i = 0; i < arrayObj.length/3; i++) {
                if (positions.getY(i) > 0)
                    positions.setXYZ( i, arrayObj[i*3] + moveX, arrayObj[i*3 + 1], arrayObj[i*3 + 2] + moveZ )
            }
            for (let i = 0; i < arrayWireStart.length/6 ; i++) {
                if (wireframe.geometry.attributes.instanceStart.getY(i) > 0)
                    wireframe.geometry.attributes.instanceStart.setXYZ( i, arrayWireStart[i*6] + moveX, arrayWireStart[i*6 + 1], arrayWireStart[i*6 + 2] + moveZ )
            }
            for (let i = 0; i < arrayWireEnd.length/6; i++) {
                if (wireframe.geometry.attributes.instanceEnd.getY(i) > 0) {
                    const [x,y,z] = [wireframe.geometry.attributes.instanceEnd.getX(i),wireframe.geometry.attributes.instanceEnd.getY(i),wireframe.geometry.attributes.instanceEnd.getZ(i)]
                    wireframe.geometry.attributes.instanceEnd.setXYZ( i,  x + moveX, y, z + moveZ )
                }
            }
        }

        if (data.tiltX || data.tiltZ) {
            const arrayObj = mesh.geometry.attributes.position.array;
            const arrayWireStart = wireframe.geometry.attributes.instanceStart.data.array;
            const arrayWireEnd = wireframe.geometry.attributes.instanceEnd.data.array;
            const tgz = (r) => Math.tan(data.tiltX * Math.PI / 180) * r;
            const tgx = (r) => Math.tan(data.tiltZ * Math.PI / 180) * r;
            const flag = mesh.geometry.type === 'ConeGeometry' ? -1 : 1;

            for (let i = 0; i < arrayObj.length/3; i++) {
                if (flag * mesh.geometry.attributes.position.getY(i) > 0) {
                    const rx = mesh.geometry.attributes.position.getX(i);
                    const rz = mesh.geometry.attributes.position.getZ(i);
                    mesh.geometry.attributes.position.setXYZ( i, arrayObj[i*3] ,arrayObj[i*3 + 1] + tgx(rx) + tgz(rz), arrayObj[i*3 + 2] )
                }
            }
            for (let i = 0; i < arrayWireStart.length/6 ; i++) {
                if (flag * wireframe.geometry.attributes.instanceStart.getY(i) > 0) {
                    const rx = wireframe.geometry.attributes.instanceStart.getX(i);
                    const rz = wireframe.geometry.attributes.instanceStart.getZ(i);
                    wireframe.geometry.attributes.instanceStart.setXYZ( i, arrayWireStart[i*6], arrayWireStart[i*6 + 1] + tgx(rx) + tgz(rz), arrayWireStart[i*6 + 2] )
                }
            }
            for (let i = 0; i < arrayWireEnd.length/6; i++) {
                if (flag * wireframe.geometry.attributes.instanceEnd.getY(i) > 0) {
                    const rx = wireframe.geometry.attributes.instanceEnd.getX(i);
                    const rz = wireframe.geometry.attributes.instanceEnd.getZ(i);
                    const [x,y,z] = [wireframe.geometry.attributes.instanceEnd.getX(i),wireframe.geometry.attributes.instanceEnd.getY(i),wireframe.geometry.attributes.instanceEnd.getZ(i)]
                    wireframe.geometry.attributes.instanceEnd.setXYZ( i, x, y + tgx(rx) + tgz(rz), z )
                }
            }

        }

        if (data.rotate) {
            const arrayObj = mesh.geometry.attributes.position.array;
            const arrayWireStart = wireframe.geometry.attributes.instanceStart.data.array;
            const arrayWireEnd = wireframe.geometry.attributes.instanceEnd.data.array;
            const deg = data.rotate / 45;
            const flag = mesh.geometry.type === 'ConeGeometry' ? -1 : 1;


            for (let i = 0; i < arrayObj.length/3; i++) {
                if (flag * mesh.geometry.attributes.position.getY(i) > 0) {
                    const [x,y,z] = [mesh.geometry.attributes.position.getX(i),mesh.geometry.attributes.position.getY(i),mesh.geometry.attributes.position.getZ(i)]
                    mesh.geometry.attributes.position.setXYZ( i, x * Math.cos(deg) + z * Math.sin(deg), y, z * Math.cos(deg) - x * Math.sin(deg) )
                }
            }
            for (let i = 0; i < arrayWireStart.length/6 ; i++) {
                if (flag * wireframe.geometry.attributes.instanceStart.getY(i) > 0) {
                    const [x,y,z] = [wireframe.geometry.attributes.instanceStart.getX(i),wireframe.geometry.attributes.instanceStart.getY(i),wireframe.geometry.attributes.instanceStart.getZ(i)]
                    wireframe.geometry.attributes.instanceStart.setXYZ( i, x * Math.cos(deg) + z * Math.sin(deg), y, z * Math.cos(deg) - x * Math.sin(deg) )
                }
            }
            for (let i = 0; i < arrayWireEnd.length/6; i++) {
                if (flag * wireframe.geometry.attributes.instanceEnd.getY(i) > 0) {
                    const [x,y,z] = [wireframe.geometry.attributes.instanceEnd.getX(i),wireframe.geometry.attributes.instanceEnd.getY(i),wireframe.geometry.attributes.instanceEnd.getZ(i)]
                    wireframe.geometry.attributes.instanceEnd.setXYZ( i, x * Math.cos(deg) + z * Math.sin(deg), y, z * Math.cos(deg) - x * Math.sin(deg) )
                }
            }


        }

        if (obj.circumscribed && geometriesToInscribe[obj.name]) {
            forcedByInscribed = true;
            geometriesToInscribe[obj.name](obj);
            forcedByInscribed = false;
        } else if (forcedByInscribed && obj.inscribed && geometriesToInscribe[obj.inscribed.name]) {
            // geometriesToInscribe[obj.inscribed.name](obj.inscribed);
        }
    }
}
function updateDrawnObject(point) {
    return;
    const target = new THREE.Vector3();
        point.getWorldPosition(target);
    const drawnObject = [...points, ...Lines, ...Meshes].find(mesh => mesh.Id === point.parentId);
    let geometry;


    drawnObject.points.find(point => point.uuid === point.uuid).position.set(...target.toArray());
    console.log(drawnObject.points.find(point => point.uuid === point.uuid).position);
    console.log(drawnObject.points.map(el => el.position));


    drawnObject.geometry.dispose();
    switch (drawnObject.type) {
        case 'point':
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( position.toArray(), 3 ) );
            break;
        case 'line':
            geometry = new THREE.LineGeometry();
            geometry.setPositions(points);
            break;
        default:
            geometry = new THREE.ConvexGeometry()
            break;
    }
    drawnObject.geometry = geometry;
}




function createObject(type, object, points) {
    let isIrregular = false;
    let CommonFolders = true;
    let values = defaultValues[type];
    if (type === 'BoxGeometry')
        object.subName = 'Cube';
    let name = objectName(object);
    const folder = gui.addFolder(name);
    object.folder = folder;

    let data = {
        type: type,
        ...commonDataFunc(object, folder),
        ...values.values,
    };
        object.data = data;
    let generateGeometry;

    switch (type) {
        case 'BoxGeometry':
        case 'DiamondGeometry':
        case 'CylinderGeometry':
        case 'ConeGeometry':
            isIrregular = true;
        case 'SphereGeometry':
        case 'CircleGeometry':
        case 'DodecahedronGeometry':
        case 'IcosahedronGeometry':
        case 'OctahedronGeometry':
        case 'TetrahedronGeometry':
        case 'PlaneGeometry':
        case 'RingGeometry':
        case 'TorusGeometry':
        case 'TorusKnotGeometry':
        case 'TeapotGeometry':
            break;
        case 'TextGeometry':
            data.edges = false;
            generateGeometry = () => {
                const loader = new THREE.FontLoader();
                loader.load( '../fonts/' + data.font + '_' + data.weight + '.typeface.json', function ( font ) {
                    const geometry = new THREE.TextGeometry( data.text, {
                        font: font,
                        size: data.size,
                        height: data.height,
                        curveSegments: data.curveSegments,
                        bevelEnabled: data.bevelEnabled,
                        bevelThickness: data.bevelThickness,
                        bevelSize: data.bevelSize,
                        bevelOffset: data.bevelOffset,
                        bevelSegments: data.bevelSegments
                    });
                    geometry.center();
                    updateObject( object, geometry );
                });
            }
            break;
        case 'LatheGeometry':
            const lathePoints = [];
            for ( let i = 0; i < 10; i ++ )
                lathePoints.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 10 + 5, ( i - 5 ) * 2 ) );
            data.points = lathePoints;
            break;
        case 'ConvexGeometry':
            object.temporary = true;
            object.type = 'CustomGeometry';
            data.points = points;
            break;
        case 'ParametricGeometry': {
            data.opacity = .5;
            data.functions = {
                'klein\'s bottle': (v, u, target) => {
                    u *= data.piVertical;
                    v *= data.piHorizontal;

                    var x, y, z;
                    if (u < Math.PI) {
                        x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(u) * Math.cos(v);
                        z = -8 * Math.sin(u) - 2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);
                    } else {
                        x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(v + Math.PI);
                        z = -8 * Math.sin(u);
                    }
                    y = -2 * (1 - Math.cos(u) / 2) * Math.sin(v);

                    target.set(
                        x * data.x / 5,
                        y * data.y / 5 ,
                        z * data.z / 5
                    );
                },
                plane: (a, b, target) => {
                    var x = - .5 + a;
                    var y = - .5 + b;
                    var z = (Math.sin(a * Math.PI) + Math.sin(b * Math.PI)) - .5;
                    target.set(
                        x * data.x,
                        y * data.y,
                        z * data.z
                    );
                },
                mobius: (u, v, target) => {
                    u = u - 0.5;
                    v = data.piVertical * v;
                    var a = data.T * 2;
                    let x = Math.cos(v) * (a + u * Math.cos(v/2));
                    let y = Math.sin(v) * (a + u * Math.cos(v/2));
                    let z = u * Math.sin(v/2);

                    target.set(
                        x * data.x / 2,
                        y * data.y / 2,
                        z * data.z / 2
                    );
                },
                mobius3d: (u, v, target) => {
                    u *= data.piVertical;
                    v *= data.piHorizontal;
                    var phi = u / 2;
                    var major = 2.25, a = 0.125, b = 0.65;
                    a = data.C1 / 8;
                    b = data.C2  * .65;
                    var x, y, z;
                    x = a * Math.cos(v) * Math.cos(phi) - b * Math.sin(v) * Math.sin(phi);
                    z = a * Math.cos(v) * Math.sin(phi) + b * Math.sin(v) * Math.cos(phi);
                    y = (major + x) * Math.sin(u);
                    x = (major + x) * Math.cos(u);

                    target.set(
                        x * data.x / 2,
                        y * data.y / 2,
                        z * data.z / 2
                    );
                },
                'hyperbolic helicoid': (u, v, target) => {
                    let alpha = data.piVertical * (u - .5);
                    let theta = data.piHorizontal * (v - .5);
                    let c = data.T;
                    let bottom = 1 + Math.cosh(theta) * Math.cosh(alpha);

                    let x = Math.sinh(alpha) * Math.cos(theta * c) / bottom;
                    let y = Math.sinh(alpha) * Math.sin(theta * c) / bottom;
                    let z = Math.cosh(alpha) * Math.sinh(theta) / bottom;

                    target.set(
                        x * data.x * 2,
                        y * data.y * 2,
                        z * data.z * 2
                    );
                    addController(T, piVertical, piHorizontal);
                },
                helicoid: (u, v, target) => {
                    const alpha = data.piVertical * u;//u
                    const theta = data.piHorizontal * v;//v
                    let c = data.T;

                    let x = theta * Math.cos(alpha * c);
                    let y = theta * Math.sin(alpha * c);
                    let z = alpha;

                    target.set(
                        x * data.x / 5,
                        y * data.y / 5,
                        z * data.z / 5
                    );
                },
                sphere: (u, v, target) => {
                    const alpha = data.piVertical / 2 * u;//u
                    const theta = data.piHorizontal * v;//v

                    let x = Math.sin(alpha) * Math.cos(theta);
                    let y = Math.sin(alpha) * Math.sin(theta);
                    let z = Math.cos(alpha);

                    target.set(
                        data.x * x,
                        data.y * y,
                        data.z * z
                    );
                    addController(piVertical, piHorizontal);
                },
                gear: (u, v, target) => {
                    const alpha = data.piVertical * u;//u
                    const theta = data.piHorizontal * v;//v
                    let c1 = data.C1
                    let c2 = data.C2
                    let n = data.t
                    const r = c1 + (1 / c2) * Math.tanh(c2 * Math.sin(n * theta)) * Math.cos(theta)

                    let x = r * Math.cos(theta);
                    let y = r * Math.sin(theta);
                    let z = u;

                    target.set(
                        data.x * x,
                        data.y * y,
                        data.z * z
                    );
                    addController(T, C1, C2);
                },
                hyperbola: (u, v, target) => {
                    let c = data.T * 5;
                    const alpha = data.piVertical * u;//u
                    const theta = data.piHorizontal * v;//v

                    let x = 1 / Math.cos(theta) * c;
                    let y = Math.tan(theta) * c;
                    let z = -u;
                    // inverted lim so that it changes poles - it doesnt work like it is supposed to


                    target.set(
                        data.x * x / 3,
                        data.y * y / 3,
                        data.z * z / 3
                    );
                    addController(T, piHorizontal);
                },
                hyperbola3d: (u, v, target) => {
                    // let c = data.T;
                    const alpha = data.piVertical * u;//u
                    const theta = data.piHorizontal * v;//v

                    let x = Math.sinh(alpha) * Math.cos(theta)
                    let y = Math.sinh(alpha) * Math.sin(theta);
                    let z = Math.cosh(alpha);


                    target.set(
                        data.x * x / 3,
                        data.y * y / 3,
                        data.z * z / 3
                    );
                    addController(piHorizontal);
                },
                custom: (u, v, target) => {
                    const c1 = data.C1;
                    const c2 = data.C2;
                    const alpha = data.piVertical * u;//u
                    const theta = data.piHorizontal * v;//v

                    let x = xFunc(u, v, alpha, theta, c1, c2);
                    let y = yFunc(u, v, alpha, theta, c1, c2);
                    let z = zFunc(u, v, alpha, theta, c1, c2);

                    target.set(
                        data.x * x,
                        data.y * y,
                        data.z * z
                    );
                    addController(X, Y, Z, C1, C2, piHorizontal, piVertical);
                },
            }
            const math = [
                ['sin', 'cos', 'tan', 'tg', 'ctg', 'cotan',// normal
                'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch', 'cosech',// hyperbolic
                // inverse hyperbolic
                'asin', 'acos', 'atan', 'acot', 'asech', 'acsch',
                'arsin', 'arcos', 'artan', 'arcot', 'arsech', 'arcsch',
                'arcsin', 'arccos', 'arctan', 'arccot', 'arcsech', 'arccsch',
                'argsin', 'argcos', 'argtan', 'argcot', 'argsech', 'argcsch',

                'sqrt', 'cbrt', 'log', 'lg', 'ln',// others
                ],// add Math. to the front
                ['pi','e'],//constants
                [['||', _ => _.split('|').map((el, i) => i % 2 === 1 ? 'Math.abs(' + el + ')' : el).join('')],
                ['^', _ => {
                    let groups = _.split(/((\d+|\(.+\))\s*\^\s*(\d+|\(.+\)))/).filter(el => el.includes('^'));//get all instances (2^3, 4^61..)
                    let nums1 = groups.map(el => el.split('^')[0]);
                    let nums2 = groups.map(el => el.split('^')[1]);
                    groups.forEach((el, i) => _ = _.replace(el, `Math.pow(${nums1[i]},${nums2[i]})`))
                    return _;
                }]
                ]
            ];// translate js to normal math

            generateGeometry = () => {
                hide();
                switch (data.type) {
                    case 'klein\'s bottle':
                        addController(piVertical, piHorizontal);
                        break
                    case 'plane':
                        break
                    case 'mobius':
                        addController(piVertical,T);
                        break;
                    case 'mobius3d':
                        addController(piVertical, piHorizontal, C1, C2);
                        break;
                    case 'hyperbolic helicoid':
                        addController(T, piVertical, piHorizontal);
                        break;
                    case 'helicoid':
                        addController(T, piVertical, piHorizontal);
                        break;
                    case 'gear':
                        addController(T, C1, C2);
                        break;
                    case 'sphere':
                        addController(piVertical, piHorizontal);
                        break;
                    case 'hyperbola':
                        addController(T, piHorizontal);
                        break;
                    case 'hyperbola3d':
                        addController(piHorizontal);
                        break;
                    case 'custom':
                        let blank = () => 0;
                        let x = data.X, y = data.Y, z = data.Z;
                        for (let i = 0; i < math[0].length; i++) {
                            const el = math[0][i];
                            x = x.replace(new RegExp(`\\b${el}\\(`, 'g'), `Math.${el}(`);
                            y = y.replace(new RegExp(`\\b${el}\\(`, 'g'), `Math.${el}(`);
                            z = z.replace(new RegExp(`\\b${el}\\(`, 'g'), `Math.${el}(`);
                        }
                        for (let i = 0; i < math[1].length; i++) {
                            const el = math[1][i];
                            x = x.replace(new RegExp(`\\b${el}\\b`), `Math.${el}`);
                            y = y.replace(new RegExp(`\\b${el}\\b`), `Math.${el}`);
                            z = z.replace(new RegExp(`\\b${el}\\b`), `Math.${el}`);
                        }
                        for (let i = 0; i < math[2].length; i++) {
                            const el = math[2][i][1];
                            x = el(x);
                            y = el(y);
                            z = el(z);
                        }
                        try {
                            xFunc = new Function('alpha', 'theta', 'c', 'u', 'v', 'return ' + x)(.2,.2,.2,.2,.2);//test if it
                            yFunc = new Function('alpha', 'theta', 'c', 'u', 'v', 'return ' + y)(.2,.2,.2,.2,.2);//is a valid
                            zFunc = new Function('alpha', 'theta', 'c', 'u', 'v', 'return ' + z)(.2,.2,.2,.2,.2);//function
                            if (isNaN(Number(xFunc)) || isNaN(Number(yFunc)) || isNaN(Number(zFunc))) {//test if result is a number (a function/object... like Math/alert() would pass the previous test)
                                [xFunc, yFunc, zFunc] = [blank,blank,blank];
                             } else {
                                xFunc = new Function('u', 'v', 'alpha', 'theta', 'c', 'return ' + x);
                                yFunc = new Function('u', 'v', 'alpha', 'theta', 'c', 'return ' + y);
                                zFunc = new Function('u', 'v', 'alpha', 'theta', 'c', 'return ' + z);
                            }
                         } catch (error) {
                            [xFunc,yFunc,zFunc] = [blank,blank,blank]
                        }
                        break;
                    default:
                        addController(piVertical,piHorizontal);
                        break;
                }
                updateObject( object, new THREE.ParametricGeometry(...values.order(data)) );
            }

            objDataFolders(folder, data, generateGeometry, type);
            const T = folder.__controllers.find(el => el.property === 'T');
            const C1 = folder.__controllers.find(el => el.property === 'C1');
            const C2 = folder.__controllers.find(el => el.property === 'C2');
            const piHorizontal = folder.__controllers.find(el => el.property === 'piHorizontal');
            const piVertical = folder.__controllers.find(el => el.property === 'piVertical');
            const X = folder.__controllers.find(el => el.property === 'X');
            const Y = folder.__controllers.find(el => el.property === 'Y');
            const Z = folder.__controllers.find(el => el.property === 'Z');
            function addController() {[...arguments].forEach(el => el.__li.style.display = "block")};
            const hide = () => [T, C1, C2, piHorizontal, piVertical, X, Y, Z].forEach(el => el.__li.style.display = "none");
            break;
        }
        case 'KnotGeometry':
            generateGeometry = () => {
                if (data.knot === 'Helix Curve') {
                    folder.__controllers.find(el => el.property === 't').__li.style.display = 'block';
                } else {
                    folder.__controllers.find(el => el.property === 't').__li.style.display = 'none';
                }
                updateObject( object, new THREE.TubeGeometry(...values.order(data)) );
            }
            break;
        case 'ShapeGeometry':{
            const x = 0, y = 0;
            const heartShape = new THREE.Shape();
            heartShape.moveTo( x + 5, y + 5 );
            heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
            heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7, x - 6, y + 7 );
            heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
            heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
            heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
            heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );
            data.shape = heartShape;
            break;
        }
        case 'ExtrudeGeometry': {
            const length = 12, width = 8;
            const shape = new THREE.Shape();
            shape.moveTo( 0, 0 );
            shape.lineTo( 0, width );
            shape.lineTo( length, width );
            shape.lineTo( length, 0 );
            shape.lineTo( 0, 0 );
            data.shape = shape;
            isIrregular = true;
            break;
        }
        case 'ImportedGeometry':
            data.edges = false;
            generateGeometry = () => updateObject(object, 'ImportedGeometry' );
            break;
        case 'PrismGeometry': {
            const angles = {
                base0: {
                },
                base1: {
                },
                base2: {
                },
            }
            let base = 1;

            data.addAngle = () => {
                let currentAngles = angles[`base${base}`];
                let baseName = base === 0 ? 'Base' : base === 1 ? 'Top Base' : 'Bottom Base';
                let baseFolder = folder.__folders[baseName];
                const n = Object.keys(currentAngles).length + 1;
                currentAngles[`angle ${n}`] = 0;
                const newAngle = baseFolder.add(currentAngles, `angle ${n}`, values.min.angle, values.max.angle).step(values.steps.angle).onChange(generateGeometry);
                newAngle.__li.parentNode.insertBefore(newAngle.__li, baseFolder.__controllers.find(el => el.property.includes('remove')).__li);

                generateGeometry('angle', n);
            }
            data.removeAngle = () => {
                let currentAngles = angles[`base${base}`];
                let n = Object.keys(currentAngles).length;
                let baseName = base === 0 ? 'Base' : base === 1 ? 'Top Base' : 'Bottom Base';

                if (n < 4) return;
                delete currentAngles[`angle ${n}`];
                folder.__folders[baseName].remove(folder.__folders[baseName].__controllers.find(el => el.property === `angle ${n}`));
                --n;
                generateGeometry('angle', n);
            }
            data.size0 = 10;
            data.size1 = 10;
            data.size2 = 10;
            data.openEnded = false;
            data.angles = Object.values(angles.base1);

            generateGeometry = (val, n) => {
                if (val === 'angle') {
                    let baseName = base === 0 ? 'Base' : base === 1 ? 'Top Base' : 'Bottom Base';
                    let currentAngles = angles[`base${base}`];
                    const allAngles = folder.__folders[baseName].__controllers.filter(el => el.property.includes('angle'));

                    allAngles.forEach(el => el.onChange(null));// it is redeclared later anyways - it is here to omit the following line
                    folder.__folders[baseName].__controllers.forEach(el => el.property.includes('angle ') && el.setValue((n - 2) * 180 / n));

                    for (let i = 1; i <= Object.keys(currentAngles).length; i++) {
                        currentAngles[`angle ${i}`] = (n - 2) * 180 / n;
                    }


                        allAngles.forEach(el => el.__li.style.color = 'white');
                    const lastAngle = folder.__folders[baseName].__controllers.find(el => el.property === `angle ${n}`);
                        lastAngle.__li.style.color = 'grey';
                        lastAngle.onChange(val => {
                            let n = allAngles.length;
                            if (n < 3) return;
                            let angle = allAngles.reduce((a,c) => c !== lastAngle ? a + c.getValue() : a, 0);
                            angle = (n-2) * 180 - angle;
                            angle = angle >= lastAngle.__max ? lastAngle.__max : angle;
                            angle = angle <= 0 ? 0 : angle;

                            if (val !== Math.round(angle / values.steps.angle) * values.steps.angle) {
                                lastAngle.setValue(angle);// block from client
                            }
                        });
                        allAngles.forEach(el => el !== lastAngle && el.onChange(() => {
                            let angle = allAngles.reduce((a,c) => c !== lastAngle ? a + c.getValue() : a, 0);
                            angle = (n-2) * 180 - angle;
                            angle = angle >= el.__max ? el.__max : angle;
                            angle = angle <= 0 ? 0 : angle;

                            lastAngle.setValue(angle);
                        generateGeometry();
                    }));
                }
                if (data.sameBases) {
                    folder.__folders.Base.__ul.style.display = 'block';
                    folder.__folders['Top Base'].__ul.style.display = 'none';
                    folder.__folders['Bottom Base'].__ul.style.display = 'none';
                    data.angles = [Object.values(angles.base0)];
                    data.sizes = [data.size0];
                } else {
                    folder.__folders.Base.__ul.style.display = 'none';
                    folder.__folders['Top Base'].__ul.style.display = 'block';
                    folder.__folders['Bottom Base'].__ul.style.display = 'block';
                    data.angles = [Object.values(angles.base1), Object.values(angles.base2)];
                    data.sizes = [data.size1, data.size2];
                }
                updateObject( object, new PrismGeometry(...values.order(data)) );
            };


            const Base = folder.addFolder('Base');
            const Base1 = folder.addFolder('Top Base');
            const Base2 = folder.addFolder('Bottom Base');
                Base.add(data, 'addAngle').onChange(() => {base = 0; generateGeometry()}).name('add angle');
                Base.add(data, 'openEnded').onChange(() => {base = 0; generateGeometry()}).name('base');
                Base.add(data, 'size0', 0, 30).onChange(generateGeometry).name('size');
                Base.add(data, 'removeAngle').onChange(() => {base = 0; generateGeometry()}).name('remove angle');
                Base1.add(data, 'addAngle').onChange(() => {base = 1;generateGeometry()}).name('add angle');
                Base1.add(data, 'size1', 0, 30).onChange(generateGeometry).name('size');
                Base1.add(data, 'removeAngle').onChange(() => {base = 1; generateGeometry()}).name('remove angle');
                Base2.add(data, 'addAngle').onChange(() => {base = 2;generateGeometry()}).name('add angle');
                Base2.add(data, 'size2', 0, 30).onChange(generateGeometry).name('size');
                Base2.add(data, 'removeAngle').onChange(() => {base = 2; generateGeometry()}).name('remove angle');
            data.addAngle();
            data.addAngle();// so that it always starts with 3 angles
            data.addAngle();
            base = 2;
            data.addAngle();
            data.addAngle();
            data.addAngle();
            base = 0;
            data.addAngle();
            data.addAngle();
            data.addAngle();
            isIrregular = true;
            break;
        }
        case 'PyramidGeometry': {
            data.angles = {};
            data.addAngle = () => {
                const n = Object.keys(data.angles).length + 1;
                data.angles[`angle ${n}`] = 0;
                const newAngle = Base.add(data.angles, `angle ${n}`, values.min.angle, values.max.angle).step(values.steps.angle).onChange(generateGeometry);
                newAngle.__li.parentNode.insertBefore(newAngle.__li, Base.__controllers.find(el => el.property.includes('remove')).__li);

                generateGeometry('angle', n);
            }
            data.removeAngle = () => {
                let n = Object.keys(data.angles).length;

                if (n < 4) return;
                delete data.angles[`angle ${n}`];
                Base.remove(folder.__folders.Base.__controllers.find(el => el.property === `angle ${n}`));
                --n;
                generateGeometry('angle', n);
            }
            generateGeometry = (val, n) => {
                if (val === 'angle') {
                    const allAngles = folder.__folders.Base.__controllers.filter(el => el.property.includes('angle'));

                    allAngles.forEach(el => el.onChange(null));// it is redeclared later anyways - it is here to omit the following line
                    folder.__folders.Base.__controllers.forEach(el => el.property.includes('angle ') && el.setValue((n - 2) * 180 / n));

                    for (let i = 1; i <= Object.keys(data.angles).length; i++) {
                        data.angles[`angle ${i}`] = (n - 2) * 180 / n;
                    }
                        allAngles.forEach(el => el.__li.style.color = 'white');
                    const lastAngle = folder.__folders.Base.__controllers.find(el => el.property === `angle ${n}`);
                        lastAngle.__li.style.color = 'grey';
                        lastAngle.onChange(val => {
                            let n = allAngles.length;
                            if (n < 3) return;
                            let angle = allAngles.reduce((a,c) => c !== lastAngle ? a + c.getValue() : a, 0);
                            angle = (n-2) * 180 - angle;
                            angle = angle >= lastAngle.__max ? lastAngle.__max : angle;
                            angle = angle <= 0 ? 0 : angle;

                            if (val !== Math.round(angle / values.steps.angle) * values.steps.angle) {
                                lastAngle.setValue(angle);// block from client
                            }
                        });
                        allAngles.forEach(el => el !== lastAngle && el.onChange(() => {
                            let angle = allAngles.reduce((a,c) => c !== lastAngle ? a + c.getValue() : a, 0);
                            angle = (n-2) * 180 - angle;
                            angle = angle >= el.__max ? el.__max : angle;
                            angle = angle <= 0 ? 0 : angle;

                            lastAngle.setValue(angle);
                        generateGeometry();
                    }));
                }
                updateObject( object, new PyramidGeometry(...values.order(data)) );
            };
            const Base = folder.addFolder('Base');
                Base.add(data, 'addAngle').onChange(generateGeometry).name('add angle');
                Base.add(data, 'removeAngle').onChange(generateGeometry).name('remove angle');
            data.addAngle();
            data.addAngle();// so that it always starts with 3 angles
            data.addAngle();
            isIrregular = true
            break;
        }
        case 'CustomShapeGeometry': {
            data.angles = {};
            data.addAngle = () => {
                const n = Object.keys(data.angles).length + 1;
                data.angles[`angle ${n}`] = 0;
                const newAngle = Base.add(data.angles, `angle ${n}`, values.min.angle, values.max.angle).step(values.steps.angle).onChange(generateGeometry);
                newAngle.__li.parentNode.insertBefore(newAngle.__li, Base.__controllers.find(el => el.property.includes('remove')).__li);

                generateGeometry('angle', n);
            }
            data.removeAngle = () => {
                let n = Object.keys(data.angles).length;

                if (n < 4) return;
                delete data.angles[`angle ${n}`];
                Base.remove(Base.__controllers.find(el => el.property === `angle ${n}`));
                --n;
                generateGeometry('angle', n);
            }
            const Base = folder.addFolder('Base');
                Base.add(data, 'addAngle').onChange(generateGeometry).name('add angle');
                Base.add(data, 'removeAngle').onChange(generateGeometry).name('remove angle');
            generateGeometry = (val, n) => {
                if (val === 'angle') {
                    const allAngles = Base.__controllers.filter(el => el.property.includes('angle'));

                    allAngles.forEach(el => el.onChange(null));// it is redeclared later anyways - it is here to omit the following line
                    Base.__controllers.forEach(el => el.property.includes('angle ') && el.setValue((n - 2) * 180 / n));

                    for (let i = 1; i <= Object.keys(data.angles).length; i++) {
                        data.angles[`angle ${i}`] = (n - 2) * 180 / n;
                    }
                        allAngles.forEach(el => el.__li.style.color = 'white');
                    const lastAngle = Base.__controllers.find(el => el.property === `angle ${n}`);
                        lastAngle.__li.style.color = 'grey';
                        lastAngle.onChange(val => {
                            let n = allAngles.length;
                            if (n < 3) return;
                            let angle = allAngles.reduce((a,c) => c !== lastAngle ? a + c.getValue() : a, 0);
                            angle = (n-2) * 180 - angle;
                            angle = angle >= lastAngle.__max ? lastAngle.__max : angle;
                            angle = angle <= 0 ? 0 : angle;

                            if (val !== Math.round(angle / values.steps.angle) * values.steps.angle) {
                                lastAngle.setValue(angle);// block from client
                            }
                        });
                        allAngles.forEach(el => el !== lastAngle && el.onChange(() => {
                            let angle = allAngles.reduce((a,c) => c !== lastAngle ? a + c.getValue() : a, 0);
                            angle = (n-2) * 180 - angle;
                            angle = angle >= el.__max ? el.__max : angle;
                            angle = angle <= 0 ? 0 : angle;

                            lastAngle.setValue(angle);
                        generateGeometry();
                    }));
                }
                updateObject( object, new CustomShapeGeometry(...values.order(data)) );
            };
            data.addAngle();
            data.addAngle();// so that it always starts with 3 angles
            data.addAngle();
            break;
        }
        case 'DrawnObjectGeometry': {
            generateGeometry = () => updateObject( object, new THREE.ConvexGeometry(points) );
            break;
        }
        case 'TesseractGeometry': {
            data.opacity = .5
            generateGeometry = () => updateObject( object, new TesseractGeometry(...values.order(data)) );
            break;
        }
        case 'CliffordTorusGeometry': {
            break;
        }
        case 'ChemistryGeometry':
            generateGeometry = () => updateObject( object, 'ChemistryGeometry' );
            CommonFolders = false;
            break;
    }// brackets are for scope


    if (!generateGeometry) generateGeometry = () => updateObject( object, new (THREE[type] || customShapes[type])(...values.order(data)) );
    const editLines = () => upgradeChildren(object, data);

    if (type !== 'ParametricGeometry') objDataFolders(folder, data, generateGeometry, type);
    if (CommonFolders) commonFolders(folder, data, generateGeometry, editLines);
    if (isIrregular) irregularFolders(folder, data, generateGeometry);
    if (fileIsLocal) {
        //text geometry only defaultFont
    }

    folder.add(data, 'remove');
    scene.add(object);
    generateGeometry();
}


function createMeshWithWireframe(mesh) {
    const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute( [], 3 ));
    const meshMaterial = new THREE.MeshPhongMaterial( {
        color: settings.meshColor,
        emissive: 0x072534,
        side: THREE.DoubleSide,
        flatShading: true,
        transparent: true
    });
    matLines.unshift(new THREE.LineMaterial({
        color: settings.meshColor,
        linewidth: settings.meshLinewidth * 5,
        transparent: true
    }));

    const geometry2 = new THREE.WireframeGeometry2( mesh?.geometry || geometry );
    const wireframe = new THREE.Wireframe( geometry2, matLines[0] );
          Wireframes.push(wireframe);
    mesh = mesh || new THREE.Mesh( mesh?.geometry || geometry, meshMaterial );
          Meshes.push(mesh);

    return {mesh, wireframe};
}
function addObject(type, aditionalData) {
    const {mesh, wireframe} = createMeshWithWireframe()

    const obj = new THREE.Group();
    obj.add( wireframe );
    obj.add( mesh );
    obj.name = type;
    obj.Color = settings.meshColor;
    obj.points = aditionalData;// for hand drawn
    obj.Points = [];
    obj.pointsToMove = [];

    if (defaultValues[type]) {
        createObject(type, obj, aditionalData);
    } else if ([...dressesObjects, ...chemistryObjects].includes(type)) {
        if (dressesObjects.includes(type)) {
            if (fileIsLocal) {
                fetch(`${url}/models/dresses/${type}.obj`)
                .catch(() => alert('Can\'t connect to server'))
                .then(object => object.text())
                .then(object => addObject(new THREE.OBJLoader().parse(object), type));
            } else {
                new THREE.OBJLoader().load(`../models/dresses/${type}.obj`, obj => addObject(obj, type));
            }
        } else if (chemistryObjects.includes(type)) {
            function loadPDB(pdb) {
                const size = defaultValues.chemistry.size;
                const compound = new THREE.Group();
                const offset = new THREE.Vector3();
				const geometryAtoms = pdb.geometryAtoms;
				const geometryBonds = pdb.geometryBonds;
				const json = pdb.json;

				const boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
				const sphereGeometry = new THREE.IcosahedronGeometry( 1, 3 );

				geometryAtoms.computeBoundingBox();
				geometryAtoms.boundingBox.getCenter( offset ).negate();

				geometryAtoms.translate( offset.x, offset.y, offset.z );
				geometryBonds.translate( offset.x, offset.y, offset.z );

				let positions = geometryAtoms.getAttribute( 'position' );
				const colors = geometryAtoms.getAttribute( 'color' );

				const position = new THREE.Vector3();
				const color = new THREE.Color();

				for ( let i = 0; i < positions.count; i ++ ) {
					position.x = positions.getX( i );
					position.y = positions.getY( i );
					position.z = positions.getZ( i );

					color.r = colors.getX( i );
					color.g = colors.getY( i );
					color.b = colors.getZ( i );

					const material = new THREE.MeshPhongMaterial({color: color});

					const object = new THREE.Mesh(sphereGeometry, material);
					object.Color = color.getHex();
					object.position.copy( position );
					object.position.multiplyScalar( 75 * size );
					object.scale.multiplyScalar( 25 * size );

					const atom = json.atoms[ i ];
                    compound.add(object)
				}

				positions = geometryBonds.getAttribute( 'position' );

				const start = new THREE.Vector3();
				const end = new THREE.Vector3();

				for ( let i = 0; i < positions.count; i += 2 ) {
					start.x = positions.getX( i );
					start.y = positions.getY( i );
					start.z = positions.getZ( i );

					end.x = positions.getX( i + 1 );
					end.y = positions.getY( i + 1 );
					end.z = positions.getZ( i + 1 );

					start.multiplyScalar( 75 * size );
					end.multiplyScalar( 75 * size );

					const object = new THREE.Mesh( boxGeometry, new THREE.MeshPhongMaterial( 0xffffff ) );
					object.Color = new THREE.Color(0xffffff).getHex();
					object.position.copy( start );
					object.position.lerp( end, 0.5 );
					object.scale.set( 5 * size, 5 * size, start.distanceTo( end ) );
					object.lookAt( end );
                    scene.add(object);
                    compound.add(object);
				}

                compound.name = 'ChemistryGeometry'
                return compound;
            }

            if (fileIsLocal) {
                fetch(`${url}/models/chemistry/${type}.pdb`)
                .catch(() => alert('Can\'t connect to server'))
                .then(object => object.text())
                .then(object => addObject(loadPDB(new THREE.PDBLoader().parse(object)), type));
            } else {
                new THREE.PDBLoader().load(`../models/chemistry/${type}.pdb`, pdb => addObject(loadPDB(pdb), type));
            }
        }
    } else if (typeof type === 'object') {//this is for imprted objects, type is the imported obj
        if (type.name === 'ChemistryGeometry') {
            type.children.forEach(child => (child.type === 'Mesh' ? Meshes : Wireframes).push(child))
            return createObject('ChemistryGeometry', type)
        };

        type.name = 'ImportedGeometry';
        type.subName = aditionalData;
        type.children.forEach(submesh => {
            const {wireframe} = createMeshWithWireframe(submesh);

            type.add(wireframe);

            wireframe.name = 'imported';
            submesh.name = 'imported';

            if (submesh.material) submesh.material = new THREE.MeshPhongMaterial( { color: settings.meshColor, emissive: 0x072534, side: THREE.DoubleSide, transparent: true } );
        });
        type.Color = settings.meshColor;
        createObject('ImportedGeometry', type);
    }
    gui.__folders['Add Object'].close();

    return obj
}
function removeObject(mesh) {
    const removeFromArray = (arr, el) => arr.splice(arr.indexOf(el), 1);

    removeFromArray(Meshes, mesh);
    removeFromArray(Wireframes, mesh.children[1]);
    mesh?.Points?.forEach(point => {
        removeFromArray(points, point);
        removeFromArray(Lines, point.line);
    })

    if (mesh.name === 'DrawnObjectGeometry') {
        clickVectorsArr = [];
        clickPointsArr = [];
    }

    scene.remove(mesh);
    gui.removeFolder(mesh.folder);
    if (Object.keys(gui.__folders).length === 2) gui.__folders['Add Object'].open();
}
function objectName(mesh) {
    let type = mesh.subName || mesh.name.replace('Geometry', '');
    let num = Object.values(gui.__folders).map((el, i) => gui.__folders[type + ' ' + (1 + i)] === undefined && i + 1).filter(el => el)[0];
    return `${type} ${num}`;
}
function loadModels() {

}


// lines and points
function createPoint(parent, position) {
    const material = new THREE.MeshPhongMaterial( {
        color: settings.childrenColor,
        emissive: 0x072534,
        side: THREE.DoubleSide,
        flatShading: true,
        transparent: true
    });
    const geometry = new THREE.SphereGeometry(settings.linewidth / 2);
    const point = new THREE.Mesh( geometry, material );
          points.push(point);

    parent.attach(point);// 'add' will add the rotation and color of the parent
    parent.Points.push(point);

    point.type = 'point';
    point.Color = defaultSettings.childrenColor;
    point.vector = position;
    point.position.set(...position.toArray())
    // if (parent === scene) objects.push(point)//fix  line should be removed at remove temporary

    addChild(parent, point);
    return point;
}
function createLine(parent, point1, point2, isOnObject) {
    const color = point1.Color;
    const material = new THREE.LineMaterial({ color: point1.Color, linewidth: settings.linewidth / 100});
    // const material = new THREE.LineMaterial({ color: color, linewidth: settings.linewidth / 100});
    //fix  try it out
    const geometry = new THREE.LineGeometry();
    const points = [];
    const origin = isOnObject ? parent.position : new THREE.Vector3();

    clickVectorsArr.forEach((el ,i) => {
        let x = el.x - origin.x;
        let y = el.y - origin.y;
        let z = el.z - origin.z;
        if (i === 0) {
            point1.vertices = [x,y,z];
        } else {
            point2.vertices = [x,y,z];
        }
        points.push(x, y, z);
    });

    geometry.setPositions(points);

    const line = new THREE.Line2( geometry, material );
          Lines.push(line);
          line.position.copy(origin);
          line.type = 'line';
          line.Color = color;

    removeChild(point1, true);
    removeChild(point2, true);

    parent.attach(line);//fix change to scene.add when updateline is ready
    addChild(parent, line);

    return line;
}
function addChild(parent, child) {
    const data = {
        linewidth: settings.linewidth,
        color: child.Color,
        name: child.point1?.data?.name ?? '',
        textSize: 2,
        textColor: settings.childrenColor,
        remove: () => removeChild(child),
    }
    function updateText() {
        const loader = new THREE.FontLoader();
        function loadFont(font) {
            textGeometry = new THREE.TextGeometry( data.name, {
                font: font,
                size: settings.childrenTextSize,
                height: .5,
            });
            textGeometry.center();//keeps the text centered
            text.geometry = textGeometry;
        }
        if (fileIsLocal) {
            try {
                loadFont(loader.parse(defaultFont));
            } catch (error) {
                loader.load( '../fonts/helvetiker_regular.typeface.json', loadFont);
            }
        } else {
            loader.load( '../fonts/helvetiker_regular.typeface.json', loadFont);
        }
    }

    const type = child.type;
    child.isChild = true;
    child.name = childName(parent, type);
    child.data = data;
    child.updateText = updateText;

    //set the name
    const origin = child.parent.position;
    const textPosition = new THREE.Vector3();

    if (type === 'line')
         textPosition.addVectors(...clickVectorsArr).multiplyScalar(.5);//get the middle point
    else textPosition.set(...clickVectorsArr[0].toArray());

    textPosition.add(new THREE.Vector3(
        Math.sign(Math.round(textPosition.x - origin.x)),
        Math.sign(Math.round(textPosition.y - origin.y)),
        Math.sign(Math.round(textPosition.z - origin.z))
    ));// push it a bit so it isnt inside the line

    const rotation = new THREE.Vector3(textPosition.x - origin.x, 0, textPosition.z - origin.z).angleTo(new THREE.Vector3(0, 0, Math.abs(textPosition.z)));
    // it is rotated right at 0 for 0,0,1 so from that point I need the angle
    const textRotation = new THREE.Vector3(0,rotation,0);
    if (textPosition.x - origin.x < 0) textRotation.set(0, Math.PI * 2 - rotation,0);// angleTo returns the smaller angle: 181 would be 179


    let textGeometry = new THREE.BufferGeometry();
        textGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [], 3 ) );

    const mat = new THREE.MeshPhongMaterial( { color: data.color, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true} );

    const text = new THREE.Mesh(textGeometry, mat);
        updateText();
        Texts.push(text);
        text.name = 'text';
        text.position.set(...textPosition.toArray());
        text.rotation.set(...textRotation.toArray());

    child.attach(text);
    child.text = text;


    const subFolder = parent.folder.addFolder(child.name);
        subFolder.add(data, 'name').onChange(updateText);
        subFolder.add(data, 'remove').onChange(data.remove);
    child.folder = subFolder;
    subFolder.open()
}
function removeChild(child, flag) {
    let arr = child.type === 'line' ? Lines : points;
    arr.splice(arr.indexOf(child), 1);

    if (currObj === child && !flag) {
        clickVectorsArr = [];
        clickPointsArr = [];
    }


    if (!child.parent) return;// this function gets called twice for no apparent reason
    if (child.folder) child.parent.folder.removeFolder(child.folder);
    child.parent.remove(child);
}
function childName(obj, type) {
    const folders = obj.folder.__folders;
    const number = Object.values(folders).map((el, i) => folders[`${type} ${1 + i}`] === undefined && i + 1).filter(el => el)[0];// check for other folders with the same name
    return `${type} ${number}`;
}

//gui folders
function commonDataFunc(obj) {
    let data = {
        x: 1,
        y: 1,
        z: 1,
        tiltX: 0,
        tiltZ: 0,
        moveX: 0,
        moveZ: 0,
        rotate: 0,
        edges: true,
        object: true,
        linewidth: settings.meshLinewidth,
        color: obj.Color,
        opacity: 1,
    }
    return {
        ...data,
        removeChildren: () => {
            let array = obj.children.filter(el => el.isChild);
            for (let i = 0; i < array.length; i++) {
                removeChild(array[i]);
            }
        },
        inscribe() {
            document.querySelector('canvas').onclick = () => {
                if (intersects[0] && intersects[0].object.parent.name !== obj.name) {
                    selectedObject = intersects[0].object.parent;
                    obj.circumscribed = selectedObject;
                    selectedObject.inscribed = obj;
                    selectedObject.position.copy(obj.position);
                    selectedObject.rotation.copy(obj.rotation);
                    selectedObject.children[1].renderOrder = 1
                    obj.children[1].renderOrder = 0
                    if (geometriesToInscribe[obj.name]) geometriesToInscribe[obj.name](obj);
                    document.querySelector('canvas').onclick = null;
                }
            }
        },
        reset() {
            addObject(obj.name);
            removeObject(obj);
        },
        remove() {removeObject(obj)}
    }
}
function commonFolders(folder, data, generateGeometry) {
    const commonFolder = folder.addFolder('common properties');
        commonFolder.add( data, 'edges').onChange( generateGeometry );
        commonFolder.add( data, 'object').onChange( generateGeometry );
        commonFolder.add( data, 'opacity', 0, 1).step(.01).onChange( generateGeometry );
        commonFolder.add( data, 'removeChildren').onChange( data.removeChildren ).name('remove children')
        if (geometriesToInscribe[data.type]) commonFolder.add( data, 'inscribe');
        commonFolder.add( data, 'reset');
        folder.open();
}
function objDataFolders(folder, data, generateGeometry, type) {
    let values = defaultValues[type];
    for (const key in values.values) {
        let newController = folder.add(data, key, values.min[key], values.max[key]).onChange(generateGeometry);
        if (values.steps && values.steps[key]) newController.step(values.steps[key])
        if (values.names && values.names[key]) newController.name(values.names[key])
    };
}
function irregularFolders(folder, data, generateGeometry, isIrregular){
    const irregularFolder = folder.addFolder('Irregular');
    if (data.type !== 'ParametricGeometry') irregularFolder.add( data, 'x', 0, 3).onChange( generateGeometry );
    if (data.type !== 'ParametricGeometry') irregularFolder.add( data, 'y', 0, 3).onChange( generateGeometry );
    if (data.type !== 'ParametricGeometry') irregularFolder.add( data, 'z', 0, 3).onChange( generateGeometry );
    if (!isIrregular) return;
    irregularFolder.add( data, 'tiltX', -90, 90 ).onChange( generateGeometry ).name('tilt X');
    irregularFolder.add( data, 'tiltZ', -90, 90 ).onChange( generateGeometry ).name('tilt Z');
    irregularFolder.add( data, 'moveX', -90, 90 ).onChange( generateGeometry ).name('move X');
    irregularFolder.add( data, 'moveZ', -90, 90 ).onChange( generateGeometry ).name('move Z');
    irregularFolder.add( data, 'rotate', -90, 90 ).onChange( generateGeometry ).name('rotate');
}

// understand the obj/fileloader




function render() {
    requestAnimationFrame( render );
    matLines.forEach(el => el.resolution.set( window.innerWidth, window.innerHeight ));// obligatory for this sort of lines
    renderer.render( scene, camera );

    raycaster.setFromCamera( mouse, camera );
    intersects = raycaster.intersectObjects([...Meshes, ...Wireframes, ...Lines], true);
    if (intersects.length !== intersectsLength) {
        if (intersects[0]) {
            selectedObject = intersects[0].object.parent === scene ? intersects[0].object : intersects[0].object.parent;
            changeColor(intersects[0].object, .2);
        } else {
            changeColor(selectedObject.children[0], 0);
        }
        intersectsLength = intersects.length;
    }
}
function changeSettings(val) {

    switch (this?.property) {
        case 'sceneColor':
            scene.background.set(new THREE.Color(val));
            break;
        case 'meshColor':
            Meshes.forEach(mesh => {
                mesh.parent.data.color = new THREE.Color(val);
                updateObject(mesh.parent);
            });
            break;
        case 'childrenColor':
            Lines.forEach(line => {
                line.data.color = new THREE.Color(val);
                updateObject(line);
            });
            points.forEach(point => {
                point.data.color = new THREE.Color(val);
                updateObject(point);
            });
            break;
        case 'meshLinewidth':
            Meshes.forEach(mesh => {
                mesh.parent.data.linewidth = val * 5;
                updateObject(mesh.parent);
            });
            break;
        case 'linewidth':
            Lines.forEach(line => {
                line.data.linewidth = val;
                updateObject(line);
            });
            points.forEach(point => {
                point.data.linewidth = val;
                updateObject(point);
            });
            break;
        case 'childrenTextSize':
            Lines.forEach(line => line.updateText());
            break;
        case 'axes':
            if (val) scene.add(axes);
            else scene.remove(axes);
            break;
        case 'axesWidth':
            axes.children.forEach(el => {
                el.geometry = new THREE.CylinderGeometry(val / 10, val / 10, 1000, 256)
            })
            break;
        case 'isDrawing':
            gui.__controllers.find(el => el.property === 'newDraw').__li.style.display = val ? 'block' : 'none'

            if (val === 0) return;
            oneAtATime.forEach(property => property !== 'isDrawing' && gui.__folders['Settings'].__controllers.find(el => el.property === property).setValue(0))

            clickVectorsArr = [];
            clickPointsArr = [];
            break;
        case 'dragPoints':
            if (val === 0) return;
            oneAtATime.forEach(property => property !== 'dragPoints' && gui.__folders['Settings'].__controllers.find(el => el.property === property).setValue(0))
            break;
        default:
            break;
    }

    // make them last after session
    window.localStorage.sceneColor = settings.sceneColor.toString(16);
    window.localStorage.meshColor = settings.meshColor.toString(16);
    window.localStorage.childrenColor = settings.childrenColor.toString(16);
    window.localStorage.meshLinewidth = settings.meshLinewidth;
    window.localStorage.childrenTextSize = settings.childrenTextSize;
    window.localStorage.linewidth = settings.linewidth;
    window.localStorage.axes = settings.axes;
    window.localStorage.axesWidth = settings.axesWidth;
}
function changeColor(object, value) {
    //fix
    if (!object) return console.log(object);;
    const setMaterial = obj => obj.material.color.set(new THREE.Color(obj?.Color || obj?.parent?.Color || object.Color).addScalar(value));
    if (object.parent === scene) {
        // for lines and points on the scene
        setMaterial(object);
        setMaterial(object.text);
    } else {
        object.parent.children.forEach(setMaterial);
    }
}

// one time executed
(function init() {
    scene.background = new THREE.Color( settings.sceneColor );
    camera.position.set(30,30,30);

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.append(renderer.domElement)
    // renderer.sortObjects = false;//so that if a mesh is inside another it will be visible *

    scene.folder = gui// for the lines and points made on the scene
    scene.Points = []// for the lines and points made on the scene
    orbit = new THREE.OrbitControls( camera, renderer.domElement );

    lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
    lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
    lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

    lights[ 0 ].position.set( 0, 200, 0 );
    lights[ 1 ].position.set( 100, 200, 100 );
    lights[ 2 ].position.set( - 100, - 200, - 100 );

    scene.add( lights[ 0 ] );
    scene.add( lights[ 1 ] );
    scene.add( lights[ 2 ] );

    plane = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth / 4,window.innerHeight / 4));
        plane.visible = false;
    scene.add(plane);
})();
(function GUIFolders() {
    for (const key in defaultValues) {
        listOfGeometry[key.replace('Geometry','')] = () => addObject(key);
    }// set the button functions to addObject
    for (let i = 0; i < dressesObjects.length; i++) {
        listOfGeometry[dressesObjects[i]] = () => addObject(dressesObjects[i]);
    }
    for (let i = 0; i < chemistryObjects.length; i++) {
        listOfGeometry[chemistryObjects[i]] = () => addObject(chemistryObjects[i]);
    }

    const settingsFolder = gui.addFolder('Settings');
          settingsFolder.addColor(settings, 'sceneColor').onChange(changeSettings).name('scene color');
          settingsFolder.addColor(settings, 'meshColor').onChange(changeSettings).name('object color');
          settingsFolder.add(settings, 'meshLinewidth', 0, 10).onChange(changeSettings).name('object line width');
          settingsFolder.add(settings, 'childrenTextSize', 0, 10).onChange(changeSettings).name('text size');
          settingsFolder.addColor(settings, 'childrenColor').onChange(changeSettings).name('child color');
          settingsFolder.add(settings, 'linewidth', 0, 10).onChange(changeSettings).name('line width');
          settingsFolder.add(settings, 'axes').onChange( changeSettings );
          settingsFolder.add(settings, 'axesWidth', 0, 10).onChange( changeSettings ).name('axes width');
          settingsFolder.add(settings, 'isDrawing').onChange(changeSettings).name('draw mode');
          settingsFolder.add(settings, 'dragPoints').onChange(changeSettings).name('drag points');
          if (isTouchScreen) settingsFolder.add(settings, 'moveObjects').name('move objects');
          if (!fileIsLocal) settingsFolder.add(settings, 'download');
          settingsFolder.add(settings, 'import').onChange(changeSettings);
          settingsFolder.add(settings, 'export').onChange(changeSettings);
          settingsFolder.add(settings, 'video');
          settingsFolder.add(settings, 'reset').onChange(changeSettings).name('reset settings');
    gui.add(settings, 'newDraw').name('draw a new object');
    const add = gui.addFolder('Add Object');
          const _2D = add.addFolder('2D');
                _2D.add(listOfGeometry, 'Circle');
                _2D.add(listOfGeometry, 'Ring');
                _2D.add(listOfGeometry, 'CustomShape').name('Shape');
          const _3D = add.addFolder('3D');
                _3D.add(listOfGeometry, 'Box').name('Cube');
                _3D.add(listOfGeometry, 'Cylinder');
                _3D.add(listOfGeometry, 'Cone');
                _3D.add(listOfGeometry, 'Prism');
                _3D.add(listOfGeometry, 'Pyramid');
                _3D.add(listOfGeometry, 'Sphere');
                _3D.add(listOfGeometry, 'Plane');
                const others = _3D.addFolder('Others');
                      others.add(listOfGeometry, 'Dodecahedron');
                      others.add(listOfGeometry, 'Icosahedron');
                      others.add(listOfGeometry, 'Octahedron');
                      others.add(listOfGeometry, 'Tetrahedron');
                      others.add(listOfGeometry, 'Lathe');
                      others.add(listOfGeometry, 'Torus');
                      others.add(listOfGeometry, 'TorusKnot');
                      others.add(listOfGeometry, 'Parametric');
                      others.add(listOfGeometry, 'Knot')
                      others.add(listOfGeometry, 'Extrude');
                      others.add(listOfGeometry, 'Teapot');
                      others.add(listOfGeometry, 'Text');
                      others.add(listOfGeometry, 'Diamond');
          const _4D = add.addFolder('4D');
                _4D.add(listOfGeometry, 'Tesseract');
                // _4D.add(listOfGeometry, 'CliffordTorus');
          const ready = add.addFolder('Ready Objects');
                const dresses = ready.addFolder('Носии');
                      dresses.add(listOfGeometry, 'armenka').name('Арменска носия');
                      dresses.add(listOfGeometry, 'bulgari').name('Български носии');
                      dresses.add(listOfGeometry, 'evrein').name('Еврейска носия');
                      dresses.add(listOfGeometry, 'romska').name('Ромска носия');
                      dresses.add(listOfGeometry, 'turchin').name('Турска носия');
                const chemistry = ready.addFolder('Chemistry');
                      for (let i = 0; i < chemistryObjects.length; i++) {
                          chemistry.add(listOfGeometry, chemistryObjects[i]);
                      }

    gui.__controllers.find(el => el.property === 'newDraw').__li.style.display = 'none';
    _3D.open();
    add.open();
})();
(function axesBuild() {
    axes.name = 'axes'
    const X = new THREE.Mesh(new THREE.CylinderGeometry(settings.axesWidth / 10, settings.axesWidth / 10, 1000, 256), new THREE.MeshBasicMaterial({color: 'red'}));
    X.position.set(500, 0, 0);
    X.rotation.set(0, 0, Math.PI / 2);
    const Y = new THREE.Mesh(new THREE.CylinderGeometry(settings.axesWidth / 10, settings.axesWidth / 10, 1000, 256), new THREE.MeshBasicMaterial({color: 'green'}));
    Y.position.set(0, 500, 0);
    Y.rotation.set(0, 0, 0);
    const Z = new THREE.Mesh(new THREE.CylinderGeometry(settings.axesWidth / 10, settings.axesWidth / 10, 1000, 256), new THREE.MeshBasicMaterial({color: 'blue'}));
    Z.position.set(0, 0, 500);
    Z.rotation.set(Math.PI / 2, 0, 0);

    axes.add(X);
    axes.add(Y);
    axes.add(Z);
    if (settings.axes) scene.add(axes);
})();
(function mathFunctions() {
    Math.ln = Math.log;
    Math.lg = Math.log10;
    Math.log = (num1, num2) => Math.ln(num1) / Math.ln(num2);// log(num, base)
    Math.pi = Math.PI;
    Math.e = Math.E

    // cotangent && tg
    Math.tg = Math.tan;
    Math.ctg = _ => 1 / Math.tan(_);
    Math.cot = _ => 1 / Math.tan(_);

    //hyperbolic
    Math.cosech = _ => 1 / Math.sinh(_)
    Math.csch = _ => 1 / Math.sinh(_)
    Math.sech = _ => Math.cosh(_)
    Math.coth = _ => 1 / Math.tanh(_);

    //inverse hyperbolic
    Math.arsin = Math.asin;
    Math.arcsin = Math.asin;
    Math.argsin = Math.asin;

    Math.arcos = Math.acos;
    Math.arccos = Math.acos;
    Math.argcos = Math.acos;

    Math.artan = Math.atan;
    Math.arctan = Math.atan;
    Math.argtan = Math.atan;

    Math.acot = _ => 1 / Math.atan(_);
    Math.arcot = Math.acot;
    Math.arccot = Math.acot;
    Math.argcot = Math.acot;

    Math.asech = _ => Math.ln( (1 + Math.sqrt((1 - _*_)))/_ );
    Math.arsech = Math.asech;
    Math.arcsech = Math.asech;
    Math.argsech = Math.asech;

    Math.acsch = _ => Math.ln( (1 + Math.sqrt((1 + _*_)))/_ );
    Math.arcsch = Math.acsch;
    Math.arccsch = Math.acsch;
    Math.argcsch = Math.acsch;
})();


function rotate(obj, x, y) {
    const newPos = new THREE.Vector3().add(mouse3d).sub(previousMouse3d);
    const movement = new THREE.Vector3().add(mouse3d).sub(previousMouse3d);
    const pos = new THREE.Vector3().add(camera.position).sub(obj.position);
    function r(v3) {
        let xyz = ['x', 'y', 'z'];
        xyz.splice(xyz.indexOf(v3), 1);
        let [v1, v2] = xyz;
        const total = pos[v1] + pos[v2];
        let ratio = {
            v1: (pos[v1] / total).toFixed(6),
            v2: (pos[v2] / total).toFixed(6)
        }

        // console.log(movement[v3] * ratio.v1, movement[v3] * ratio.v2);
        // console.log(ratio);
        obj.rotation[v1] -= .8 * movement[v3] * ratio.v2;
        obj.rotation[v2] += .8 * movement[v3] * ratio.v1;
    }
    // r('x');
    // r('y');
    // r('z');
    let rotY = (x - previousX) / 60;
    let rotX = (y - previousY) / 60;




    obj.rotation.x += rotX;
    obj.rotation.y += rotY;
    if (obj.circumscribed) {
        obj.circumscribed.rotation.y += rotX;
        obj.circumscribed.rotation.x += rotY;
    }
    else if (obj.inscribed) {
        obj.inscribed.rotation.y += rotX;
        obj.inscribed.rotation.x += rotY;
    }
    obj?.pointsToMove?.forEach(point => updateDrawnObject(point));
};
function moveObj(obj) {
    let newPos = new THREE.Vector3().add(mouse3d).sub(previousMouse3d);
    obj.position.add(newPos);
    if (obj.circumscribed) {
        obj.circumscribed.position.add(newPos);
    }
    else if (obj.inscribed) {
        obj.inscribed.position.add(newPos);
    }
    obj.pointsToMove.forEach(point => updateDrawnObject(point));
}
function up(nodeName) {
    if (settings.dragPoints || nodeName !== 'CANVAS') return mouseWasHeldOverMesh = false;// the canvas is because of the gui - it is divs, li, inputs..

    if (settings.isDrawing && !isMouseDragged) {
        let parent, point, id = currObj.Id;
        const previousPoints = currObj.points,
              pointObject = new THREE.Mesh(new THREE.BoxGeometry());

        if (intersects[0]) {
            parent = intersects[0].object.parent;
            point = intersects[0].point;

            pointObject.position.copy(point);
            parent.pointsToMove.push(pointObject);
        } else {
            parent = scene;
            point = new THREE.Vector3().copy(mouse3d);
        }
        const allOnObject = parent !== scene && clickVectorsArr.every(clickV => parent.Points.some(objPoint => objPoint.vector.equals(clickV)));


        clickVectorsArr.push(point);
        clickPointsArr.push(point.toArray());

        switch (clickVectorsArr.length) {
            case 1:
                currObj = createPoint(parent, point, allOnObject);
                id = currObj.uuid;
                if (intersects[0]) parent.pointsToMove.reverse()[0].obj = id;
                break;
            case 2:
                currObj = createLine(allOnObject ? parent : scene, currObj, createPoint(parent, point), allOnObject);
                break;
            case 3:
                removeChild(currObj, true);

                if (allOnObject) {
                    if (parent.data.opacity === 1) parent.data.opacity = .5;
                    updateObject(parent);
                }

                const fakeVec = clickVectorsArr[0];
                    fakeVec.x += .0001;

                currObj = addObject('DrawnObjectGeometry', [...clickVectorsArr, fakeVec]);
                break;
            default:
                updateObject(currObj, new THREE.ConvexGeometry(clickVectorsArr));
                break;
        }
        currObj.Id = id;
        pointObject.parentId = id;
        currObj.points = [...previousPoints, pointObject];
    }

    mouseWasHeldOverMesh = false;
}//fix redo the drawing
function down(nodeName) {
    if (settings.dragPoints && nodeName === 'CANVAS' && intersects[0].object.parent.name !== 'ImportedGeometry') {
        dragPointsObject = intersects[0].object.parent;
        const array = intersects[0].object.parent.children[1].geometry.attributes.position;
        const point = intersects[0].point.sub((intersects[0].object.parent.position));

        dragIndexes = [];
        for (let i = 0; i < array.count; i++) {
            if (Math.abs(point.x - array.getX(i)) > 1) continue;
            if (Math.abs(point.y - array.getY(i)) > 1) continue;
            if (Math.abs(point.z - array.getZ(i)) > 1) continue;
            dragIndexes.push(i);
        }
    }
    if (intersects[0]) {
        mouseWasHeldOverMesh = true;// to avoid the sudden change from a mesh to scene (it will cause a big orbit rotation)
    };
}
function move(x, y, button, nodeName) {
    mouse.x = ( x / window.innerWidth ) * 2 - 1;
    mouse.y = - ( y / window.innerHeight ) * 2 + 1;

    mouse3d.copy(raycaster.intersectObject(plane)[0].point);
    plane.rotation.copy(camera.rotation);
    plane.position.copy(orbit.target);

    if (intersects[0] && isMouseDragged) mouseWasHeldOverMesh = true;


    if (settings.dragPoints && isMouseDragged) {// drag points
        const array = dragPointsObject.children[1].geometry.attributes.position;
        dragIndexes.forEach(i => array.setXYZ(i,
            mouse3d.x,
            mouse3d.y,
            mouse3d.z
        ));
        dragPointsObject.children[1].geometry.attributes.position.needsUpdate = true;
        updateObject(dragPointsObject)
    } else if (intersects[0] && nodeName === 'CANVAS') {
        const obj = intersects[0].object.parent;
        if (settings.moveObjects) button = 2;// this setting for touch mode should override
        if (button === 1) {
            rotate(obj, x, y);
        } else if (button === 2) {
            moveObj(obj);
        }
    }

    previousX = x;
    previousY = y;
    previousMouse3d.copy(mouse3d);

    isMouseDragged = button !== 0;

    if (intersects[0] || mouseWasHeldOverMesh) {
        orbit.enableRotate = false;
        orbit.enablePan = false;
    } else {
        orbit.enableRotate = true;
        orbit.enablePan = true;
    }
}
// fix remove individual linewidth altering at meshes


window.addEventListener('mouseup', e => up(e.target.nodeName));
window.addEventListener('mousedown', e => down(e.target.nodeName));
window.addEventListener('mousemove', e => move(e.clientX, e.clientY, e.buttons, e.target.nodeName));

window.addEventListener('touchend', e => {
    if (e.touches.length > 1 || mouseWasHeldOverMesh) {
        orbit.enableRotate = false;
        orbit.enablePan = false;
    } else {
        orbit.enableRotate = true;
        orbit.enablePan = true;
    }

    up(e.target.nodeName);
});
window.addEventListener('touchstart', e => {
    if (e.touches.length > 1 || mouseWasHeldOverMesh) {
        orbit.enableRotate = false;
        orbit.enablePan = false;
    } else {
        orbit.enableRotate = true;
        orbit.enablePan = true;
    }

    down(e.target.nodeName);
});
window.addEventListener('touchmove', e => {
    mouse3d.copy(raycaster.intersectObject(plane)[0].point);
    let difference = new THREE.Vector3().add(mouse3d).sub(previousMouse3d).distanceTo(new THREE.Vector3());
    if (difference > 15) return previousMouse3d.copy(mouse3d);

    let index = 0;

    Object.values(e.touches).reverse().map((touch, i) => {
        mouse.x = ( touch.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( touch.clientY / window.innerHeight ) * 2 + 1;

        // console.log(i,Math.round(mouse.x * 100));
        // console.log(mouse);

        // if (intersects[0]) index = i
        // console.log(intersects[0], i);
    })

    move(
        e.touches[index].clientX,
        e.touches[index].clientY,
        e.touches.length,
        e.target.nodeName
        );
    isMouseDragged = true;// it doesn't work well in touch mode wit the down()
});

document.addEventListener('contextmenu', e => {e.target.nodeName === 'CANVAS' && e.preventDefault()});
document.addEventListener('wheel', () => {
    let zoom = orbit.target.distanceTo(orbit.object.position) - orbit.position0.distanceTo(new THREE.Vector3());
    plane.geometry = new THREE.PlaneGeometry(window.innerWidth / 4 + zoom * 2, window.innerHeight / 4 + zoom * 2);
});

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}, false );

changeSettings();
render();