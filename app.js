const STORAGE_KEY = 'bridges-caddie-v1';

const holes = [
  { 
    num: 1, 
    par: 4, 
    hcp: 1, 
    defaultCenter: null,
    yardages: [
      { color: '⚫', label: 'Tips - 398' },
      { color: '🔵', label: 'Blue - 380' },
      { color: '⚪', label: 'White - 344' },
      { color: '🔴', label: 'Ladies - 294' }
    ]
  },
  { 
    num: 2, 
    par: 5, 
    hcp: 2, 
    defaultCenter: null,
    yardages: [
      { color: '⚫', label: 'Tips - 547' },
      { color: '🔵', label: 'Blue - 520' },
      { color: '⚪', label: 'White - 479' },
      { color: '🔴', label: 'Ladies - 450' }
    ]
  },
  { 
    num: 3, 
    par: 3, 
    hcp: 7, 
    defaultCenter: null,
    yardages: [
      { color: '⚫', label: 'Tips - 194' },
      { color: '🔵', label: 'Blue - 165' },
      { color: '⚪', label: 'White - 148' },
      { color: '🔴', label: 'Ladies - 112' }
    ]
  },
  { 
    num: 4, 
    par: 4, 
    hcp: 5, 
    defaultCenter: null,
    yardages: [
      { color: '⚫', label: 'Tips - 413' },
      { color: '🔵', label: 'Blue - 386' },
      { color: '⚪', label: 'White - 354' },
      { color: '🔴', label: 'Ladies - 325' }
    ]
  },
  { 
    num: 5, 
    par: 5, 
    hcp: 9, 
    defaultCenter: null,
    yardages: [
      { color: '⚫', label: 'Tips - 494' },
      { color: '🔵', label: 'Blue - 460' },
      { color: '⚪', label: 'White - 414' },
      { color: '🔴', label: 'Ladies - 402' }
    ]
  },
  { 
    num: 6, 
    par: 4, 
    hcp: 6, 
    defaultCenter: null,
    yardages: [
      { color: '⚫', label: 'Tips - 372' },
      { color: '🔵', label: 'Blue - 332' },
      { color: '⚪', label: 'White - 269' },
      { color: '🔴', label: 'Ladies - 223' }
    ]
  },
  { 
    num: 7, 
    par: 3, 
    hcp: 8, 
    defaultCenter: null,
    yardages: [
      { color: '⚫', label: 'Tips - 175' },
      { color: '🔵', label: 'Blue - 142' },
      { color: '⚪', label: 'White - 107' },
      { color: '🔴', label: 'Ladies - 84' }
    ]
  },
  { 
    num: 8, 
    par: 4, 
    hcp: 3, 
    defaultCenter: null,
    yardages: [
      { color: '⚫', label: 'Tips - 400' },
      { color: '🔵', label: 'Blue - 370' },
      { color: '⚪', label: 'White - 333' },
      { color: '🔴', label: 'Ladies - 316' }
    ]
  },
  { 
    num: 9, 
    par: 4, 
    hcp: 4, 
    defaultCenter: null,
    yardages: [
      { color: '⚫', label: 'Tips - 376' },
      { color: '🔵', label: 'Blue - 358' },
      { color: '⚪', label: 'White - 277' },
      { color: '🔴', label: 'Ladies - 256' }
    ]
  },
];

let state = {
  currentHole: 1,
  lastPosition: null,
  atClubhouse: false,
};

const holeNameEl = document.getElementById('holeName');
const yardageEl = document.getElementById('yardage');
const parEl = document.getElementById('par');
const hcpEl = document.getElementById('hcp');
const yardageDetailsEl = document.getElementById('yardageDetails');
const gpsStatusEl = document.getElementById('gpsStatus');
const noticeEl = document.getElementById('notice');
const holesGridEl = document.getElementById('holesGrid');
const settingsPanelEl = document.getElementById('settingsPanel');
const settingsListEl = document.getElementById('settingsList');
const pinsDisplayEl = document.getElementById('pinsDisplay');
const additionalLocationsEl = document.getElementById('additionalLocations');

// Store all pin locations for each hole
let pinLocations = {};

// Store additional locations (hazards, water, etc.)
let additionalLocations = {};

// Store clubhouse boundary
let clubhouseBoundary = null;

// Auto-update interval
let autoUpdateInterval = null;
const AUTO_UPDATE_INTERVAL = 60000; // 1 minute in milliseconds

function showNotice(msg) {
  noticeEl.textContent = msg || '';
}

function requestLocation({ onSuccess, onError }) {
  if (!navigator.geolocation) {
    onError('Geolocation is not available on this device.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      state.lastPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      onSuccess(state.lastPosition);
    },
    err => {
      let message = 'Unable to get your location.';
      if (err.code === 1) message = 'Location access was denied.';
      if (err.code === 2) message = 'Location is unavailable right now.';
      if (err.code === 3) message = 'Location request timed out.';
      onError(message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000,
    }
  );
}

// ============ MATH UTILITIES ============

function toRadians(value) {
  return value * Math.PI / 180;
}

function distanceInYards(a, b) {
  const R = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const c = 2 * Math.atan2(
    Math.sqrt(sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon),
    Math.sqrt(1 - (sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon))
  );
  const meters = R * c;
  return Math.round(meters * 1.09361);
}

// ============ KML PARSING & TEE AREA DETECTION ============

// Store parsed tee areas in memory
let teeAreas = [];

// Define which additional locations to show for each hole
const additionalLocationConfig = {
  1: [
    { kmlName: 'Hole 1 - to water', displayName: 'To Water' },
    { kmlName: 'Hole 1 - Clear Water', displayName: 'To Clear the Water' }
  ],
  2: [
    { kmlName: 'Hole 2 - Water Tee', displayName: 'To Water' },
    { kmlName: 'Hole 2 - Creek Middle', displayName: 'To the Creek (Middle)' },
    { kmlName: 'Hole 2 - Creek - Right', displayName: 'To the Creek (Right)' }
  ],
  4: [
    { kmlName: 'Hole 4 - Clear Water Left', displayName: 'To Clear the Water on the Left' }
  ],
  6: [
    { kmlName: 'Hole 6 - Clear water', displayName: 'To Clear Water on the Left' }
  ],
  8: [
    { kmlName: 'Hole 8 - to Water Front', displayName: 'To Water' },
    { kmlName: 'Hole 8 - To Trees', displayName: 'To the Trees on the Right' }
  ],
  9: [
    { kmlName: 'Hole 9 - to Sand', displayName: 'To the Sand Traps by Green' }
  ]
};

// Parse Coursemap.kml and extract tee area boundaries, pin locations, additional locations, and clubhouse
async function loadKMLData() {
  try {
    const response = await fetch('./Coursemap.kml');
    const kmlText = await response.text();
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
    const placemarks = kmlDoc.querySelectorAll('Placemark');
    
    placemarks.forEach(placemark => {
      const name = placemark.querySelector('name')?.textContent || '';
      const description = placemark.querySelector('description')?.textContent || '';
      
      // Extract clubhouse boundary
      if (name === 'Clubhouse') {
        const polygon = placemark.querySelector('Polygon');
        if (polygon) {
          const coordsText = polygon.querySelector('coordinates')?.textContent || '';
          const coordinates = coordsText
            .trim()
            .split(/\s+/)
            .filter(coord => coord.length > 0)
            .map(coord => {
              const [lng, lat] = coord.split(',').map(Number);
              return { lng, lat };
            });
          
          if (coordinates.length >= 3) {
            clubhouseBoundary = coordinates;
          }
        }
      }
      
      // Extract tee areas
      const teeMatch = name.match(/Hole (\d+) - Tee Area/);
      if (teeMatch) {
        const holeNum = parseInt(teeMatch[1]);
        const polygon = placemark.querySelector('Polygon');
        
        if (polygon) {
          const coordsText = polygon.querySelector('coordinates')?.textContent || '';
          const coordinates = coordsText
            .trim()
            .split(/\s+/)
            .filter(coord => coord.length > 0)
            .map(coord => {
              const [lng, lat] = coord.split(',').map(Number);
              return { lng, lat };
            });
          
          if (coordinates.length >= 3) {
            teeAreas.push({
              holeNum,
              coordinates
            });
          }
        }
      }
      
      // Extract pin locations
      const pinMatch = name.match(/Hole (\d+) - Pin - (.+)/) || 
                       (description.includes('Hole') && description.match(/Hole (\d+) - Pin - (.+)/));
      
      if (pinMatch) {
        const holeNum = parseInt(pinMatch[1]);
        const pinType = pinMatch[2];
        const point = placemark.querySelector('Point');
        
        if (point) {
          const coordsText = point.querySelector('coordinates')?.textContent || '';
          const [lng, lat] = coordsText.trim().split(',').map(Number);
          
          // Initialize pin locations array for this hole if not exists
          if (!pinLocations[holeNum]) {
            pinLocations[holeNum] = [];
          }
          
          // Add pin location
          pinLocations[holeNum].push({
            type: pinType,
            lat,
            lng
          });
          
          // If it's the middle pin, set it as the default center
          if (pinType === 'Middle') {
            const hole = holes.find(h => h.num === holeNum);
            if (hole) {
              hole.defaultCenter = { lat, lng };
            }
          }
        }
      }
      
      // Extract additional locations (hazards, water, etc.)
      Object.entries(additionalLocationConfig).forEach(([holeStr, locations]) => {
        const holeNum = parseInt(holeStr);
        locations.forEach(locationConfig => {
          if (name === locationConfig.kmlName) {
            const point = placemark.querySelector('Point');
            if (point) {
              const coordsText = point.querySelector('coordinates')?.textContent || '';
              const [lng, lat] = coordsText.trim().split(',').map(Number);
              
              if (!additionalLocations[holeNum]) {
                additionalLocations[holeNum] = [];
              }
              
              additionalLocations[holeNum].push({
                displayName: locationConfig.displayName,
                lat,
                lng
              });
            }
          }
        });
      });
    });
    
    // Sort pins for each hole by type for consistent display
    Object.keys(pinLocations).forEach(holeNum => {
      pinLocations[holeNum].sort((a, b) => {
        // Put Middle first
        if (a.type === 'Middle') return -1;
        if (b.type === 'Middle') return 1;
        // Then alphabetical
        return a.type.localeCompare(b.type);
      });
    });
    
    console.log('Loaded clubhouse boundary:', clubhouseBoundary);
    console.log('Loaded tee areas:', teeAreas);
    console.log('Loaded pin locations:', pinLocations);
    console.log('Loaded additional locations:', additionalLocations);
    console.log('Loaded default centers:', holes);
  } catch (error) {
    console.error('Error loading KML data:', error);
  }
}

// Ray casting algorithm for point-in-polygon detection
function isPointInPolygon(point, polygon) {
  const { lng: x, lat: y } = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Detect if GPS is at the clubhouse
function detectClubhouse(position) {
  if (!clubhouseBoundary) return false;
  return isPointInPolygon(position, clubhouseBoundary);
}

// Detect which hole the GPS position is in
function detectHoleFromPosition(position) {
  for (const teeArea of teeAreas) {
    if (isPointInPolygon(position, teeArea.coordinates)) {
      return teeArea.holeNum;
    }
  }
  return null;
}

function getHole() {
  return holes.find(h => h.num === state.currentHole);
}

function getCenterForHole(holeNum) {
  return holes.find(h => h.num === holeNum)?.defaultCenter || null;
}

function updateYardage() {
  showNotice('');
  gpsStatusEl.textContent = 'Reading GPS…';
  requestLocation({
    onSuccess(position) {
      gpsStatusEl.textContent = `Accuracy about ${Math.round(position.accuracy)} ft • Auto-updating`;
      
      // Check if at clubhouse first
      if (detectClubhouse(position)) {
        state.atClubhouse = true;
        render();
        return;
      }
      
      state.atClubhouse = false;
      
      // AUTO-DETECT HOLE FROM GPS
      const detectedHole = detectHoleFromPosition(position);
      if (detectedHole !== null) {
        state.currentHole = detectedHole;
        render();
      }
      
      const center = getCenterForHole(state.currentHole);
      if (!center) {
        yardageEl.textContent = '--';
        showNotice('No center pin found for this hole.');
        return;
      }
      yardageEl.textContent = distanceInYards(position, center);
      
      // Update yardages to all pin locations
      updatePinYardages(position);
      
      // Update yardages to additional locations
      updateAdditionalLocationYardages(position);
    },
    onError(message) {
      gpsStatusEl.textContent = message;
      showNotice('Turn on iPhone Location Services and allow Safari/Home Screen access.');
    }
  });
}

function updatePinYardages(position) {
  const pins = pinLocations[state.currentHole];
  if (!pins) return;
  
  pins.forEach(pin => {
    // Skip the Middle pin - it's displayed at the top
    if (pin.type === 'Middle') return;
    
    const pinId = `pin-${pin.type.toLowerCase().replace(/\s+/g, '-')}`;
    const pinEl = document.getElementById(pinId);
    if (pinEl) {
      const yardage = distanceInYards(position, pin);
      pinEl.textContent = yardage;
    }
  });
}

function updateAdditionalLocationYardages(position) {
  const locations = additionalLocations[state.currentHole];
  if (!locations) return;
  
  locations.forEach((location, index) => {
    const locationId = `location-${index}`;
    const locationEl = document.getElementById(locationId);
    if (locationEl) {
      const yardage = distanceInYards(position, location);
      locationEl.textContent = yardage;
    }
  });
}

function startAutoUpdate() {
  // Update immediately
  updateYardage();
  
  // Then update every 1 minute
  autoUpdateInterval = setInterval(() => {
    updateYardage();
  }, AUTO_UPDATE_INTERVAL);
  
  console.log('Auto-update started: GPS will refresh every 1 minute');
}

function stopAutoUpdate() {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
    autoUpdateInterval = null;
    console.log('Auto-update stopped');
  }
}

function renderHoles() {
  holesGridEl.innerHTML = '';
  holes.forEach(hole => {
    const btn = document.createElement('button');
    btn.className = 'hole-chip' + (hole.num === state.currentHole ? ' active' : '');
    const hasCenter = !!getCenterForHole(hole.num);
    btn.innerHTML = `Hole ${hole.num}<small>Par ${hole.par} • ${hasCenter ? 'mapped' : 'not mapped'}</small>`;
    btn.addEventListener('click', () => {
      state.currentHole = hole.num;
      render();
      updateYardage();
    });
    holesGridEl.appendChild(btn);
  });
}

function renderSettings() {
  settingsListEl.innerHTML = '';
  holes.forEach(hole => {
    const row = document.createElement('div');
    row.className = 'setting-row';
    const center = getCenterForHole(hole.num);
    row.innerHTML = `
      <strong>Hole ${hole.num}</strong><br>
      <span class="tiny">${center ? `<code>${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}</code>` : 'No center pin found'}</span>
    `;
    settingsListEl.appendChild(row);
  });
}

function renderPinsDisplay() {
  if (!pinsDisplayEl) return;
  
  const pins = pinLocations[state.currentHole];
  if (!pins) {
    pinsDisplayEl.innerHTML = '';
    return;
  }
  
  // Filter out Middle pin and display only other pins
  const otherPins = pins.filter(pin => pin.type !== 'Middle');
  
  if (otherPins.length === 0) {
    pinsDisplayEl.innerHTML = '';
    return;
  }
  
  pinsDisplayEl.innerHTML = `
    <div class="section-title">Pin Locations</div>
    <div class="pins-grid">
      ${otherPins.map(pin => {
        const pinId = `pin-${pin.type.toLowerCase().replace(/\s+/g, '-')}`;
        return `
          <div class="pin-card">
            <div class="pin-label">${pin.type}</div>
            <div class="pin-yardage" id="${pinId}">--</div>
            <div class="pin-yards-label">yds</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderAdditionalLocationsDisplay() {
  if (!additionalLocationsEl) return;
  
  const locations = additionalLocations[state.currentHole];
  if (!locations || locations.length === 0) {
    additionalLocationsEl.innerHTML = '';
    return;
  }
  
  additionalLocationsEl.innerHTML = `
    <div class="section-title">ADDITIONAL LOCATIONS:</div>
    <div class="locations-grid">
      ${locations.map((location, index) => `
        <div class="location-card">
          <div class="location-label">${location.displayName}</div>
          <div class="location-yardage" id="location-${index}">--</div>
          <div class="location-yards-label">yds</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderYardageDetails() {
  if (!yardageDetailsEl) return;
  
  const hole = getHole();
  if (!hole.yardages || hole.yardages.length === 0) {
    yardageDetailsEl.innerHTML = '';
    return;
  }
  
  yardageDetailsEl.innerHTML = hole.yardages.map(yardage => `
    <div class="yardage-detail">
      <span class="color-dot">${yardage.color}</span>
      <span class="yardage-label">${yardage.label}</span>
    </div>
  `).join('');
}

function renderClubhouse() {
  holeNameEl.textContent = 'Time for a Drink and a Snack 🍺🌭';
  yardageEl.textContent = '';
  parEl.textContent = '';
  hcpEl.textContent = '';
  yardageDetailsEl.innerHTML = '';
  pinsDisplayEl.innerHTML = '';
  additionalLocationsEl.innerHTML = '';
}

function render() {
  if (state.atClubhouse) {
    renderClubhouse();
    renderHoles();
    renderSettings();
    return;
  }
  
  const hole = getHole();
  holeNameEl.textContent = `Hole ${hole.num}`;
  parEl.textContent = hole.par;
  hcpEl.textContent = hole.hcp;
  const center = getCenterForHole(hole.num);
  if (!center) {
    yardageEl.textContent = '--';
  }
  renderHoles();
  renderSettings();
  renderYardageDetails();
  renderPinsDisplay();
  renderAdditionalLocationsDisplay();
}

document.getElementById('prevHoleBtn').addEventListener('click', () => {
  state.currentHole = state.currentHole === 1 ? 9 : state.currentHole - 1;
  render();
  updateYardage();
});

document.getElementById('nextHoleBtn').addEventListener('click', () => {
  state.currentHole = state.currentHole === 9 ? 1 : state.currentHole + 1;
  render();
  updateYardage();
});

document.getElementById('locateBtn').addEventListener('click', updateYardage);
document.getElementById('settingsBtn').addEventListener('click', () => settingsPanelEl.classList.remove('hidden'));
document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsPanelEl.classList.add('hidden'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Load KML data (tee areas, pin locations, additional locations, and clubhouse)
loadKMLData();

render();

// Start auto-updating GPS every 1 minute
startAutoUpdate();
