/**
 * ============================================================================
 * Project: Global Quake Monitor v5.0
 * File: script.js
 * Description: Main application logic using the IIFE pattern (QuakeApp).
 * Handles API fetching from USGS, 3D Globe rendering via Globe.gl / Three.js,
 * user interactions, and dynamic UI updates.
 * ============================================================================
 */

const QuakeApp = (() => {
    // --- CONFIGURATION ---
    const CONFIG = {
        api: {
            live: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
            queryBase: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time'
        },
        colors: { 
            critical: '#9b061f', 
            moderate: '#f59517', 
            light: '#00b4d8' 
        },
        geoJsonPolygons: 'https://cdn.jsdelivr.net/gh/vasturiano/globe.gl@master/example/datasets/ne_110m_admin_0_countries.geojson',
    };

    // --- DOM ELEMENTS CACHE ---
    const DOM = {
        loader: document.getElementById('loader'),
        count: document.getElementById('val-count'),
        last: document.getElementById('val-last'),
        status: document.getElementById('status-indicator'),
        panels: document.querySelectorAll('.panel'),
        inputs: {
            start: document.getElementById('input-start'),
            end: document.getElementById('input-end'),
            mag: document.getElementById('input-mag')
        },
        btnQuery: document.getElementById('btn-query'),
        btnLive: document.getElementById('btn-live'),
        globeContainer: document.getElementById('globeViz')
    };

    // --- STATE MANAGEMENT ---
    let globeInstance = null;
    let currentAbortController = null;
    let hoverCircle = null;

    const STATE = { 
        isPanelHovered: false, 
        isPointHovered: false 
    };

    // --- UTILITY FUNCTIONS ---
    const updateRotation = () => {
        if (globeInstance && globeInstance.controls()) {
            globeInstance.controls().autoRotate = !(STATE.isPanelHovered || STATE.isPointHovered);
        }
    };

    const getColor = (mag) => mag >= 5.0 ? CONFIG.colors.critical : mag >= 2.5 ? CONFIG.colors.moderate : CONFIG.colors.light;

    const setLoader = (show, text = "") => {
        DOM.loader.style.opacity = show ? '1' : '0';
        DOM.loader.style.pointerEvents = show ? 'auto' : 'none';
        if (text) DOM.loader.innerText = text;
    };

    const initDates = () => {
        const today = new Date();
        const pastMonth = new Date(new Date().setDate(today.getDate() - 30));
        DOM.inputs.end.value = today.toISOString().split('T')[0];
        DOM.inputs.start.value = pastMonth.toISOString().split('T')[0];
    };

    // --- 3D GLOBE INITIALIZATION ---
    const createGlobe = () => {
        globeInstance = Globe()(DOM.globeContainer)
            .globeImageUrl('assets/earth.jpg')
            .showAtmosphere(true)
            .atmosphereColor('#a3cdff')
            .atmosphereAltitude(0.15)
            .polygonCapColor(() => 'rgba(0, 0, 0, 0.4)')
            .polygonSideColor(() => 'rgba(55, 92, 147, 0.59)')
            .polygonStrokeColor(() => 'rgba(255, 255, 255, 0.43)')
            .polygonAltitude(0.005)
            
            // Merge geometry to optimize rendering and prevent ghosting artifacts
            .pointsMerge(true) 
            
            // VISUAL SEISMIC COLUMNS
            .pointRadius(d => Math.max(0.08, d.mag * 0.04))
            .pointColor(d => d.color)
            .pointAltitude(d => 0.02 + Math.pow(d.mag, 1.4) * 0.01)
            
            // INVISIBLE HITBOX LAYER (For easier mouse hovering)
            .customLayerData([]) 
            .customThreeObject(d => {
                const hitboxRadius = 1.0 + (d.mag * 0.6); 
                const geom = new THREE.SphereGeometry(hitboxRadius, 16, 16);
                const mat = new THREE.MeshBasicMaterial({ 
                    transparent: true, 
                    opacity: 0, 
                    depthWrite: false 
                });
                return new THREE.Mesh(geom, mat);
            })
            .customThreeObjectUpdate((obj, d) => {
                const coords = globeInstance.getCoords(d.lat, d.lng, 0);
                Object.assign(obj.position, coords);
            })
            
            // HITBOX TOOLTIPS
            .customLayerLabel(d => `
                <div class="tooltip">
                    <div style="color:${d.color}; font-weight:bold; margin-bottom:4px; border-bottom:1px solid #ddd;">M${d.mag.toFixed(1)}</div>
                    <div>${d.title}</div>
                    <div style="color:var(--text-muted); font-size:0.75rem;">${d.time.toLocaleDateString()} at ${d.time.toLocaleTimeString()}</div>
                </div>
            `)
            
            // HITBOX HOVER INTERACTION
            .onCustomLayerHover(point => {
                STATE.isPointHovered = !!point;
                updateRotation();
                document.body.style.cursor = point ? 'pointer' : 'crosshair';

                // Remove previous hover indicator
                if (hoverCircle) {
                    globeInstance.scene().remove(hoverCircle);
                    hoverCircle.geometry.dispose();
                    hoverCircle.material.dispose();
                    hoverCircle = null;
                }

                // Create new hover indicator ring
                if (point) {
                    const trueImpactSize = Math.pow(point.mag, 2) * 0.3; 
                    
                    const circleGeom = new THREE.RingGeometry(0, trueImpactSize, 48);
                    const circleMat = new THREE.MeshBasicMaterial({
                        color: point.color,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.5,
                        depthWrite: false
                    });
                    
                    hoverCircle = new THREE.Mesh(circleGeom, circleMat);
                    
                    const coords = globeInstance.getCoords(point.lat, point.lng, 0.01);
                    hoverCircle.position.set(coords.x, coords.y, coords.z);
                    hoverCircle.lookAt(0, 0, 0);

                    globeInstance.scene().add(hoverCircle);
                }
            });

        // ZOOM FLUIDITY CALIBRATION (OrbitControls)
        globeInstance.controls().autoRotate = true;
        globeInstance.controls().autoRotateSpeed = 0.5;
        globeInstance.controls().enableDamping = true; // Physical inertia
        globeInstance.controls().dampingFactor = 0.05; // Smooth deceleration
        globeInstance.controls().zoomSpeed = 0.4;      // Reduced wheel sensitivity

        // LIGHTING
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        globeInstance.scene().add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(2, 3, 4);
        globeInstance.scene().add(directionalLight);

        // EQUIRECTANGULAR STAR BACKGROUND
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('assets/stars.jpg', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            globeInstance.scene().background = texture;
        });

        // LOAD COUNTRY POLYGONS
        fetch(CONFIG.geoJsonPolygons)
            .then(res => res.json())
            .then(countries => globeInstance.polygonsData(countries.features));
    };

    // --- DATA INJECTION ---
    const applyQuakes = (quakes) => {
        if (hoverCircle) {
            globeInstance.scene().remove(hoverCircle);
            if (hoverCircle.geometry) hoverCircle.geometry.dispose();
            if (hoverCircle.material) hoverCircle.material.dispose();
            hoverCircle = null;
        }

        // Injecting a new array forces WebGL to recalculate the scene
        globeInstance.pointsData(quakes);
        globeInstance.customLayerData(quakes); 
    };

    // --- API FETCHING ---
    const fetchSeismicData = async (url, isHistorical = false) => {
        // Cancel any pending requests
        if (currentAbortController) currentAbortController.abort();
        currentAbortController = new AbortController();

        try {
            setLoader(true, isHistorical ? "Searching archives..." : "Global synchronization...");
            
            DOM.btnQuery.disabled = true;
            DOM.btnLive.disabled = true;
            DOM.count.innerText = "Calculating...";
            DOM.last.innerText = "--";

            DOM.status.innerText = isHistorical ? "ARCHIVE" : "LIVE";
            DOM.status.classList.toggle('query-mode', isHistorical);
            DOM.btnLive.classList.toggle('hidden', !isHistorical);

            const response = await fetch(url, { signal: currentAbortController.signal });
            if (!response.ok) throw new Error("Fetch error");

            const data = await response.json();
            const minMag = parseFloat(DOM.inputs.mag.value) || 0;

            let quakes = data.features
                .filter(d => d.properties.mag >= minMag)
                .map(d => ({
                    id: d.id, 
                    lat: d.geometry.coordinates[1],
                    lng: d.geometry.coordinates[0],
                    mag: d.properties.mag,
                    title: d.properties.place || "Unknown location",
                    time: new Date(d.properties.time),
                    color: getColor(d.properties.mag)
                }))
                .sort((a, b) => b.mag - a.mag);

            DOM.count.innerText = quakes.length;
            DOM.last.innerText = quakes.length ? `M${quakes[0].mag.toFixed(1)} - ${quakes[0].title}` : "No events";

            applyQuakes(quakes);
            setLoader(false);

        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error(err);
            setLoader(true, "CONNECTION ERROR");
        } finally {
            DOM.btnQuery.disabled = false;
            DOM.btnLive.disabled = false;
        }
    };

    // --- EVENT BINDINGS ---
    const bindEvents = () => {
        DOM.btnQuery.addEventListener('click', () => {
            const { start, end, mag } = DOM.inputs;
            if (!start.value || !end.value) return alert("Please enter a valid date range.");
            if (new Date(start.value) > new Date(end.value)) return alert("Start date cannot be after end date.");
            
            const url = `${CONFIG.api.queryBase}&starttime=${start.value}&endtime=${end.value}&minmagnitude=${mag.value}`;
            fetchSeismicData(url, true);
        });

        DOM.btnLive.addEventListener('click', () => {
            const today = new Date().toISOString().split('T')[0];
            DOM.inputs.start.value = today;
            DOM.inputs.end.value = today;
            fetchSeismicData(CONFIG.api.live, false);
        });

        window.addEventListener('resize', () => {
            if (globeInstance) {
                globeInstance.width(window.innerWidth);
                globeInstance.height(window.innerHeight);
            }
        });

        const uiToggle = document.getElementById('ui-toggle');
        uiToggle.addEventListener('click', () => {
            document.body.classList.toggle('ui-hidden');
            uiToggle.innerText = document.body.classList.contains('ui-hidden') ? '📁' : '👁️';
        });

        // Pause rotation on panel hover
        DOM.panels.forEach(panel => {
            panel.addEventListener('mouseenter', () => { STATE.isPanelHovered = true; updateRotation(); });
            panel.addEventListener('mouseleave', () => { STATE.isPanelHovered = false; updateRotation(); });
        });
    };

    // --- PUBLIC API ---
    return {
        init: () => {
            initDates();
            createGlobe();
            bindEvents();
            fetchSeismicData(CONFIG.api.live, false);
        }
    };
})();

// Bootstrap application
document.addEventListener('DOMContentLoaded', QuakeApp.init);