/* Low-poly "toy globe" — faceted icosphere with baked day/night vertex colors,
   two location markers (Sydney, Tokyo) that stay locked to the rotating globe,
   and a fading starfield with a couple of constellations for night mode. */

(function () {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas || !window.THREE) return;

    const RADIUS = 2;

    // ---------- deterministic pseudo-noise (no external libs) ----------
    function hash3(x, y, z) {
        const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
        return s - Math.floor(s);
    }

    // ---------- rough real-world continent placement (blocky, not literal borders) ----------
    // Each continent is an ellipse in lat/lon space, sized so the *shape and location*
    // reads correctly (Africa where Africa is, Australia where Australia is, etc).
    const CONTINENTS = [
        { lat: 45, lon: -100, latR: 27, lonR: 38 },  // North America
        { lat: -15, lon: -60, latR: 28, lonR: 20 },  // South America
        { lat: 52, lon: 15, latR: 16, lonR: 22 },    // Europe
        { lat: 2, lon: 20, latR: 36, lonR: 24 },     // Africa
        { lat: 48, lon: 95, latR: 32, lonR: 58 },    // Asia
        { lat: -25, lon: 134, latR: 16, lonR: 22 },  // Australia
        { lat: -83, lon: 0, latR: 12, lonR: 180 },   // Antarctica
    ];

    // matches latLonToVec3() below, inverted
    function vecToLatLon(v) {
        const phi = Math.acos(THREE.MathUtils.clamp(v.y, -1, 1));
        const lat = 90 - phi * 180 / Math.PI;
        let lon = Math.atan2(v.z, -v.x) * 180 / Math.PI - 180;
        if (lon < -180) lon += 360;
        if (lon > 180) lon -= 360;
        return { lat, lon };
    }

    function landInfo(v) {
        const { lat, lon } = vecToLatLon(v);
        const jitter = (hash3(v.x * 4, v.y * 4, v.z * 4) - 0.5) * 10; // ragged coastlines
        for (const c of CONTINENTS) {
            let dLon = lon - c.lon;
            if (dLon > 180) dLon -= 360;
            if (dLon < -180) dLon += 360;
            const dLat = lat - c.lat + jitter * 0.3;
            const dLonComp = dLon * Math.cos(lat * Math.PI / 180) + jitter * 0.5;
            const score = (dLat / c.latR) ** 2 + (dLonComp / c.lonR) ** 2;
            if (score < 1) return { land: true, alt: score < 0.4 };
        }
        return { land: false, alt: false };
    }

    // ---------- palettes ----------
    const DAY = { ocean: new THREE.Color('#2E86D8'), land: new THREE.Color('#63B76C'), landAlt: new THREE.Color('#3F8F49') };
    const NIGHT = { ocean: new THREE.Color('#17335C'), land: new THREE.Color('#1B3524'), landAlt: new THREE.Color('#132A1B') };
    const LIGHT_DIR = new THREE.Vector3(1, 1, 0.6).normalize();

    // ---------- build shared faceted geometry ----------
    const base = new THREE.IcosahedronGeometry(RADIUS, 3).toNonIndexed();
    base.computeVertexNormals();
    const posAttr = base.attributes.position;
    const normAttr = base.attributes.normal;
    const vertCount = posAttr.count;

    const dayColors = new Float32Array(vertCount * 3);
    const nightColors = new Float32Array(vertCount * 3);
    const tmp = new THREE.Vector3();
    const nrm = new THREE.Vector3();

    for (let f = 0; f < vertCount; f += 3) {
        tmp.set(0, 0, 0);
        for (let k = 0; k < 3; k++) {
            tmp.x += posAttr.getX(f + k); tmp.y += posAttr.getY(f + k); tmp.z += posAttr.getZ(f + k);
        }
        tmp.divideScalar(3).normalize();
        nrm.set(normAttr.getX(f), normAttr.getY(f), normAttr.getZ(f));

        const info = landInfo(tmp);
        const isLand = info.land;
        const isLandAlt = info.alt;
        const shade = 0.68 + 0.32 * Math.max(nrm.dot(LIGHT_DIR), 0);

        const dBase = isLandAlt ? DAY.landAlt : (isLand ? DAY.land : DAY.ocean);
        const nBase = isLandAlt ? NIGHT.landAlt : (isLand ? NIGHT.land : NIGHT.ocean);

        for (let k = 0; k < 3; k++) {
            const vi = (f + k) * 3;
            dayColors[vi] = dBase.r * shade; dayColors[vi + 1] = dBase.g * shade; dayColors[vi + 2] = dBase.b * shade;
            nightColors[vi] = nBase.r * shade; nightColors[vi + 1] = nBase.g * shade; nightColors[vi + 2] = nBase.b * shade;
        }
    }

    const dayGeo = base.clone();
    dayGeo.setAttribute('color', new THREE.BufferAttribute(dayColors, 3));
    const nightGeo = base.clone();
    nightGeo.setAttribute('color', new THREE.BufferAttribute(nightColors, 3));

    const dayMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 1, depthWrite: true });
    const nightMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false });

    const dayMesh = new THREE.Mesh(dayGeo, dayMat);
    const nightMesh = new THREE.Mesh(nightGeo, nightMat);
    nightMesh.scale.setScalar(1.003);

    const globeGroup = new THREE.Group();
    globeGroup.add(dayMesh, nightMesh);

    // ---------- markers (Sydney, Tokyo) ----------
    function latLonToVec3(lat, lon, r) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
    }

    const markerGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff4655 });

    function makeMarker(lat, lon) {
        const pos = latLonToVec3(lat, lon, RADIUS * 1.05);
        const m = new THREE.Mesh(markerGeo, markerMat.clone());
        m.position.copy(pos);
        m.lookAt(pos.clone().multiplyScalar(2));
        globeGroup.add(m);
        return m;
    }

    // low-poly voxel figure "standing" on the globe — used for Sydney/Australia
    function makeFigure(lat, lon, scale) {
        const surfacePos = latLonToVec3(lat, lon, RADIUS * 1.0);
        const group = new THREE.Group();
        group.position.copy(surfacePos);
        group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfacePos.clone().normalize());
        group.scale.setScalar(scale);

        const skin = new THREE.MeshBasicMaterial({ color: 0xF2C79B });
        const shirt = new THREE.MeshBasicMaterial({ color: 0x0056B3 });
        const pants = new THREE.MeshBasicMaterial({ color: 0x24314F });
        const pack = new THREE.MeshBasicMaterial({ color: 0xFF4655 });

        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), pants);
        legL.position.set(-0.032, 0.05, 0);
        const legR = legL.clone(); legR.position.x = 0.032;

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.07), shirt);
        torso.position.set(0, 0.16, 0);

        const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.04), pack);
        backpack.position.set(0, 0.16, -0.055);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), skin);
        head.position.set(0, 0.26, 0);

        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.11, 0.035), skin);
        armL.position.set(-0.08, 0.16, 0);
        const armR = armL.clone(); armR.position.x = 0.08;

        group.add(legL, legR, torso, backpack, head, armL, armR);
        group.userData.waveArm = armR;
        globeGroup.add(group);
        return group;
    }

    const aussieFigure = makeFigure(-33.87, 151.21, 1.55);
    const markerTok = makeMarker(35.68, 139.69);

    // ---------- constellations near the globe (page-wide starfield lives in bg-stars.js) ----------
    const starCount = 60;
    const constellationPoints = [];
    for (let i = 0; i < starCount; i++) {
        const r = 5.5 + Math.random() * 2.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        if (i < 14 && z > -2) constellationPoints.push(new THREE.Vector3(x, y, z));
    }

    // a couple of simple hand-linked "constellations" from the sampled points
    const linePairs = [];
    for (let c = 0; c < 2; c++) {
        const start = c * 6;
        for (let i = start; i < start + 5 && i + 1 < constellationPoints.length; i++) {
            linePairs.push(constellationPoints[i], constellationPoints[i + 1]);
        }
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePairs);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xF5F0DC, transparent: true, opacity: 0, depthWrite: false });
    const constellationLines = new THREE.LineSegments(lineGeo, lineMat);

    // ---------- scene / camera / renderer ----------
    const scene = new THREE.Scene();
    scene.add(constellationLines, globeGroup);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0.3, 6);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    function resize() {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);

    // ---------- drag to rotate ----------
    let dragging = false, lastX = 0, lastY = 0, velX = 0.0025, velY = 0, idleTimer = null;
    function setIdle() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { velX = 0.0025; }, 1800);
    }
    canvas.addEventListener('pointerdown', (e) => {
        dragging = true; lastX = e.clientX; lastY = e.clientY; velX = 0; velY = 0;
        canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        globeGroup.rotation.y += dx * 0.006;
        globeGroup.rotation.x = Math.max(-1, Math.min(1, globeGroup.rotation.x + dy * 0.006));
        velX = dx * 0.0006; velY = dy * 0.0006;
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt =>
        canvas.addEventListener(evt, () => { dragging = false; setIdle(); })
    );

    // ---------- day/night crossfade ----------
    let nightMix = 0, nightTarget = 0;
    window.setGlobeNight = function (isNight) { nightTarget = isNight ? 1 : 0; };

    // ---------- connector lines (Sydney / Tokyo panels) ----------
    const svg = document.getElementById('connector-svg');
    const stage = document.getElementById('globe-stage');
    const panelSyd = document.getElementById('panel-syd');
    const panelJpn = document.getElementById('panel-jpn');
    let lineSyd, lineJpn;
    if (svg) {
        lineSyd = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineJpn = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        svg.appendChild(lineSyd); svg.appendChild(lineJpn);
    }

    const worldPos = new THREE.Vector3();
    const normalWorld = new THREE.Vector3();
    const camDir = new THREE.Vector3();

    function updateConnector(marker, line, panel) {
        if (!line || !panel || !stage) return;
        marker.updateWorldMatrix(true, false);
        worldPos.setFromMatrixPosition(marker.matrixWorld);

        normalWorld.copy(marker.position).normalize().applyQuaternion(globeGroup.quaternion);
        camDir.copy(camera.position).normalize();
        const facingCamera = normalWorld.dot(camDir) > 0.1;

        const ndc = worldPos.clone().project(camera);
        const canvasRect = canvas.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const px = canvasRect.left - stageRect.left + (ndc.x * 0.5 + 0.5) * canvasRect.width;
        const py = canvasRect.top - stageRect.top + (-ndc.y * 0.5 + 0.5) * canvasRect.height;

        const panelRect = panel.getBoundingClientRect();
        const panelX = panelRect.left - stageRect.left + (panel === panelJpn ? 0 : panelRect.width);
        const panelY = panelRect.top - stageRect.top + panelRect.height / 2;

        line.setAttribute('x1', panelX);
        line.setAttribute('y1', panelY);
        line.setAttribute('x2', px);
        line.setAttribute('y2', py);
        line.style.opacity = facingCamera ? 0.9 : 0;
    }

    // ---------- render loop ----------
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();
        const t = clock.getElapsedTime();

        if (!dragging) {
            globeGroup.rotation.y += velX;
            globeGroup.rotation.x += velY;
            velY *= 0.94;
        }

        nightMix += (nightTarget - nightMix) * Math.min(1, dt * 2.2);
        dayMat.opacity = 1 - nightMix;
        nightMat.opacity = nightMix;
        lineMat.opacity = nightMix * 0.55;

        markerTok.position.y += Math.sin(t * 2 + 1) * 0.00015;
        if (aussieFigure.userData.waveArm) {
            aussieFigure.userData.waveArm.rotation.z = Math.sin(t * 3) * 0.5;
        }

        updateConnector(aussieFigure, lineSyd, panelSyd);
        updateConnector(markerTok, lineJpn, panelJpn);

        renderer.render(scene, camera);
    }

    resize();
    animate();
    setTimeout(resize, 50); // catch late layout/font shifts
})();
