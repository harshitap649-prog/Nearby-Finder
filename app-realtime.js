// Complete Real-time Overpass API App
const app = {
    userLocation: null,
    currentCategory: 'food',
    currentRadius: 5,
    categoryMap: {
        'food': 'restaurant',
        'hotels': 'hotel',
        'restrooms': 'toilets',
        'travel': 'attraction',
        'cafes': 'cafe',
        'shopping': 'shop',
        'emergency': 'hospital'
    }
};

// Find user location and initialize map
function findMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            app.userLocation = {lat: lat, lng: lon};
            console.log('Found location:', lat, lon);
            
            // This moves your Leaflet map to your real location
            if (window.map) {
                map.setView([lat, lon], 14); 
            }
            
            fetchNearbyPlaces(lat, lon, app.categoryMap[app.currentCategory]);
        }, (error) => {
            console.error('Location error:', error);
            // Fallback to NYC
            app.userLocation = {lat: 40.7128, lng: -74.0060};
            if (window.map) {
                map.setView([40.7128, -74.0060], 14);
            }
            fetchNearbyPlaces(40.7128, -74.0060, app.categoryMap[app.currentCategory]);
        });
    } else {
        console.error('Geolocation not supported');
        app.userLocation = {lat: 40.7128, lng: -74.0060};
        fetchNearbyPlaces(40.7128, -74.0060, app.categoryMap[app.currentCategory]);
    }
}

// Fetch nearby places from Overpass API
async function fetchNearbyPlaces(lat, lon, type = 'restaurant') {
    console.log(`Fetching ${type} places near ${lat}, ${lon}`);
    
    // Overpass API Query
    const query = `[out:json];node["amenity"="${type}"](around:5000,${lat},${lon});out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(`Found ${data.elements.length} places`);
        
        displayPlaces(data.elements);
    } catch (error) {
        console.error('Fetch error:', error);
        showError();
    }
}

// Display places in the UI
function displayPlaces(elements) {
    const container = document.getElementById('placesList'); // Updated to match your HTML
    if (!container) {
        console.error('Places container not found');
        return;
    }
    
    container.innerHTML = ''; // Clear old results

    if (elements.length === 0) {
        container.innerHTML = `
            <h3 class="text-lg font-bold text-gray-800 mb-4">No Places Found</h3>
            <div class="text-center py-8 text-gray-500">
                <p>No places found nearby. Try a different category.</p>
            </div>
        `;
        return;
    }

    // Add header
    const header = document.createElement('h3');
    header.className = 'text-lg font-bold text-gray-800 mb-4';
    header.textContent = `Nearby ${app.currentCategory} (${elements.length} found)`;
    container.appendChild(header);

    // Sort by distance from user location
    if (app.userLocation) {
        elements.sort((a, b) => {
            const distA = getDistance(app.userLocation, {lat: a.lat, lng: a.lon});
            const distB = getDistance(app.userLocation, {lat: b.lat, lng: b.lon});
            return distA - distB;
        });
    }

    elements.forEach(place => {
        const name = place.tags.name || "Nearby Place";
        const imageUrl = getCategoryImage(app.currentCategory);
        const distance = app.userLocation ? getDistance(app.userLocation, {lat: place.lat, lng: place.lon}) : 0;
        
        const placeCard = document.createElement('div');
        placeCard.className = 'glass rounded-3xl overflow-hidden shadow-lg p-3 flex gap-4 cursor-pointer place-card mb-4';
        placeCard.innerHTML = `
            <img src="${imageUrl}" class="w-24 h-24 rounded-2xl object-cover">
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-gray-800">${name}</h4>
                    <span class="bg-green-100 text-green-600 text-[10px] px-2 py-1 rounded-full">Open Now</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">📍 ${distance.toFixed(1)} km away</p>
                <p class="text-xs text-gray-400 mt-1">📍 ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</p>
                <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}')" class="mt-2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full hover:bg-purple-600 transition-colors">
                    🧭 Directions
                </button>
            </div>
        `;
        container.appendChild(placeCard);
    });
}

// Get category image from Unsplash
function getCategoryImage(category) {
    const images = {
        'food': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop',
        'hotels': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop',
        'cafes': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
        'restrooms': 'https://images.unsplash.com/photo-1584622657118-04e9e932ed5e?w=400&h=400&fit=crop',
        'travel': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
        'shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
        'emergency': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop'
    };
    return images[category] || images['food'];
}

// Calculate distance between two points
function getDistance(p1, p2) {
    const R = 6371; // Earth's radius in km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
               Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
               Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Show error message
function showError() {
    const container = document.getElementById('placesList');
    if (!container) return;
    
    container.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">Error</h3>
        <div class="glass rounded-3xl overflow-hidden shadow-lg p-6 text-center">
            <div class="text-red-500">
                <p class="text-lg font-semibold mb-2">Unable to fetch places</p>
                <p class="text-sm">Please check your internet connection and try again</p>
            </div>
        </div>
    `;
}

// Setup event listeners for categories
function setupCategoryListeners() {
    // Food: onclick="fetchNearbyPlaces(userLat, userLon, 'restaurant')"
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            // Update visual state
            document.querySelectorAll('.category-item div').forEach(div => {
                div.classList.remove('bg-purple-100', 'border-2', 'border-purple-500');
            });
            this.querySelector('div').classList.add('bg-purple-100', 'border-2', 'border-purple-500');
            
            app.currentCategory = this.dataset.category;
            const type = app.categoryMap[app.currentCategory];
            
            if (app.userLocation) {
                fetchNearbyPlaces(app.userLocation.lat, app.userLocation.lng, type);
            } else {
                findMe(); // Will fetch after getting location
            }
        });
    });
}

// Setup radius filter listeners
function setupRadiusListeners() {
    document.querySelectorAll('.radius-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            // Update visual state
            document.querySelectorAll('.radius-filter').forEach(b => {
                b.classList.remove('bg-purple-500', 'text-white');
                b.classList.add('hover:bg-white/50');
            });
            this.classList.add('bg-purple-500', 'text-white');
            this.classList.remove('hover:bg-white/50');
            
            app.currentRadius = parseInt(this.dataset.radius);
            
            // Refetch places with new radius
            if (app.userLocation) {
                const type = app.categoryMap[app.currentCategory];
                fetchNearbyPlaces(app.userLocation.lat, app.userLocation.lng, type);
            }
        });
    });
}

// Global variables for onclick handlers
window.userLat = null;
window.userLon = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');
    
    // Setup listeners
    setupCategoryListeners();
    setupRadiusListeners();
    
    // Set initial visual states
    const firstCategory = document.querySelector('.category-item[data-category="food"]');
    if (firstCategory) {
        firstCategory.querySelector('div').classList.add('bg-purple-100', 'border-2', 'border-purple-500');
    }
    
    const firstRadius = document.querySelector('.radius-filter[data-radius="5"]');
    if (firstRadius) {
        firstRadius.classList.add('bg-purple-500', 'text-white');
        firstRadius.classList.remove('hover:bg-white/50');
    }
    
    // Get user location and fetch places
    findMe();
});

// Make functions global for onclick handlers
window.findMe = findMe;
window.fetchNearbyPlaces = fetchNearbyPlaces;
window.displayPlaces = displayPlaces;
