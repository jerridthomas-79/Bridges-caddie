const STORAGE_KEY = 'bridges-caddie-v1';

const holes = [
  { num: 1, par: 4, hcp: 1, defaultCenter: null },
  { num: 2, par: 4, hcp: 7, defaultCenter: null },
  { num: 3, par: 4, hcp: 5, defaultCenter: null },
  { num: 4, par: 3, hcp: 9, defaultCenter: null },
  { num: 5, par: 5, hcp: 3, defaultCenter: null },
  { num: 6, par: 4, hcp: 2, defaultCenter: null },
  { num: 7, par: 4, hcp: 8, defaultCenter: null },
  { num: 8, par: 3, hcp: 6, defaultCenter: null },
  { num: 9, par: 5, hcp: 4, defaultCenter: null },
];

let state = {
  currentHole: 1,
  savedCenters: loadSavedCenters(),
  lastPosition: null,
};

const holeNameEl = document.getElementById('holeName');
const yardageEl = document.getElementById('yardage');
const parEl = document.getElementById('par');
const hcpEl = document.getElementById('hcp');
const gpsStatusEl = document.getElementById('gpsStatus');
const noticeEl = document.getElementById('notice');
const holesGridEl = document.getElementById('holesGrid');
const settingsPanelEl = document.getElementById('settingsPanel');
const settingsListEl = document.getElementById('settingsList');
const exportBoxEl = document.getElementById('exportBox');

function loadSavedCenters() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCenters() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedCenters));
  render();
}

function getHole() {
  return holes.find(h => h.num === state.currentHole);
}

function getCenterForHole(holeNum) {
  return state.savedCenters[String(holeNum)] || holes.find(h => h.num === holeNum)?.defaultCenter || null;
}

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

function updateYardage() {
  showNotice('');
  gpsStatusEl.textContent = 'Reading GPS…';
  requestLocation({
    onSuccess(position) {
      gpsStatusEl.textContent = `Accuracy about ${Math.round(position.accuracy)} ft`;
      const center = getCenterForHole(state.currentHole);
      if (!center) {
        yardageEl.textContent = '--';
        showNotice('No center point saved yet for this hole. Stand on the green and tap “Set center from my location.”');
        return;
      }
      yardageEl.textContent = distanceInYards(position, center);
    },
    onError(message) {
      gpsStatusEl.textContent = message;
      showNotice('Turn on iPhone Location Services and allow Safari/Home Screen access.');
    }
  });
}

function markGreenCenter() {
  showNotice('');
  requestLocation({
    onSuccess(position) {
      state.savedCenters[String(state.currentHole)] = { lat: position.lat, lng: position.lng };
      saveCenters();
      gpsStatusEl.textContent = `Saved with accuracy about ${Math.round(position.accuracy)} ft`;
      showNotice(`Hole ${state.currentHole} center saved on this iPhone.`);
      updateYardage();
      renderSettings();
    },
    onError(message) {
      gpsStatusEl.textContent = message;
      showNotice('Could not save center point.');
    }
  });
}

function renderHoles() {
  holesGridEl.innerHTML = '';
  holes.forEach(hole => {
    const btn = document.createElement('button');
    btn.className = 'hole-chip' + (hole.num === state.currentHole ? ' active' : '');
    const hasPoint = !!getCenterForHole(hole.num);
    btn.innerHTML = `Hole ${hole.num}<small>Par ${hole.par} • ${hasPoint ? 'mapped' : 'not mapped'}</small>`;
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
      <span class="tiny">${center ? `<code>${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}</code>` : 'No point saved yet'}</span>
    `;
    settingsListEl.appendChild(row);
  });
}

function render() {
  const hole = getHole();
  holeNameEl.textContent = `Hole ${hole.num}`;
  parEl.textContent = hole.par;
  hcpEl.textContent = hole.hcp;
  if (!getCenterForHole(hole.num)) {
    yardageEl.textContent = '--';
  }
  renderHoles();
  renderSettings();
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
document.getElementById('markGreenBtn').addEventListener('click', markGreenCenter);
document.getElementById('settingsBtn').addEventListener('click', () => settingsPanelEl.classList.remove('hidden'));
document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsPanelEl.classList.add('hidden'));

document.getElementById('exportBtn').addEventListener('click', () => {
  exportBoxEl.value = JSON.stringify(state.savedCenters, null, 2);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all saved green center points?')) return;
  state.savedCenters = {};
  saveCenters();
  exportBoxEl.value = '';
  showNotice('All saved points were reset.');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ============ KML PARSING & TEE AREA DETECTION ============

// Store parsed tee areas in memory
let teeAreas = [];

// Parse Coursemap.kml and extract tee area boundaries
async function loadTeeAreas() {
  try {
    const response = await fetch('./Coursemap.kml');
    const kmlText = await response.text();
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
    // Find all Placemarks with "Tee Area" in their name
    const placemarks = kmlDoc.querySelectorAll('Placemark');
    
    placemarks.forEach(placemark => {
      const name = placemark.querySelector('name')?.textContent || '';
      const match = name.match(/Hole (\d+) - Tee Area/);
      
      if (match) {
        const holeNum = parseInt(match[1]);
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
    });
    
    console.log('Loaded tee areas:', teeAreas);
  } catch (error) {
    console.error('Error loading tee areas:', error);
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

// Detect which hole the GPS position is in
function detectHoleFromPosition(position) {
  for (const teeArea of teeAreas) {
    if (isPointInPolygon(position, teeArea.coordinates)) {
      return teeArea.holeNum;
    }
  }
  return null;
}

// ============ MODIFIED FUNCTIONS ============

function updateYardage() {
  showNotice('');
  gpsStatusEl.textContent = 'Reading GPS…';
  requestLocation({
    onSuccess(position) {
      gpsStatusEl.textContent = `Accuracy about ${Math.round(position.accuracy)} ft`;
      
      // AUTO-DETECT HOLE FROM GPS
      const detectedHole = detectHoleFromPosition(position);
      if (detectedHole !== null) {
        state.currentHole = detectedHole;
        render();
      }
      
      const center = getCenterForHole(state.currentHole);
      if (!center) {
        yardageEl.textContent = '--';
        showNotice('No center point saved yet for this hole. Stand on the green and tap "Set center from my location."');
        return;
      }
      yardageEl.textContent = distanceInYards(position, center);
    },
    onError(message) {
      gpsStatusEl.textContent = message;
      showNotice('Turn on iPhone Location Services and allow Safari/Home Screen access.');
    }
  });
}

function markGreenCenter() {
  showNotice('');
  requestLocation({
    onSuccess(position) {
      // AUTO-DETECT HOLE FROM GPS
      const detectedHole = detectHoleFromPosition(position);
      if (detectedHole !== null) {
        state.currentHole = detectedHole;
      }
      
      state.savedCenters[String(state.currentHole)] = { lat: position.lat, lng: position.lng };
      saveCenters();
      gpsStatusEl.textContent = `Saved with accuracy about ${Math.round(position.accuracy)} ft`;
      showNotice(`Hole ${state.currentHole} center saved on this iPhone.`);
      updateYardage();
      renderSettings();
    },
    onError(message) {
      gpsStatusEl.textContent = message;
      showNotice('Could not save center point.');
    }
  });
}

// ============ INITIALIZATION ============
// Load tee areas when page loads
loadTeeAreas();

render();
updateYardage();
