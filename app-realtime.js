// Real-time Overpass API App
const app = {
    userLocation: null,
    currentCategory: 'food',
    currentRadius: 5,
    categoryMap: {
        'food': 'amenity=restaurant',
        'hotels': 'tourism=hotel',
        'restrooms': 'amenity=toilets',
        'travel': 'tourism=attraction',
        'cafes': 'amenity=cafe',
        'shopping': 'shop',
        'emergency': 'amenity=hospital'
    }
};

// Get user location
function getUserLocation() {
    navigator.geolocation.getCurrentPosition(
        pos => {
            app.userLocation = {lat: pos.coords.latitude, lng: pos.coords.longitude};
            console.log('Got location:', app.userLocation);
            fetchPlaces();
        },
        error => {
            console.error('Location error:', error);
            app.userLocation = {lat: 40.7128, lng: -74.0060}; // NYC fallback
            fetchPlaces();
        }
    );
}

// Fetch real places from Overpass API
async function fetchPlaces() {
    if (!app.userLocation) {
        console.log('No location yet');
        return;
    }
    
    const category = app.categoryMap[app.currentCategory];
    const radius = app.currentRadius * 1000;
    const query = `[out:json];node["${category}"](around:${radius},${app.userLocation.lat},${app.userLocation.lng});out;`;
    
    console.log('Fetching places for:', category);
    
    try {
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await response.json();
        console.log('Found places:', data.elements.length);
        displayPlaces(data.elements);
    } catch (error) {
        console.error('Fetch error:', error);
        showError();
    }
}

// Display real places
function displayPlaces(places) {
    const container = document.getElementById('placesList');
    if (!container) {
        console.error('Places container not found');
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Add header
    const header = document.createElement('h3');
    header.className = 'text-lg font-bold text-gray-800 mb-4';
    header.textContent = `Nearby ${app.currentCategory} (${places.length} found)`;
    container.appendChild(header);
    
    if (places.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'text-center py-8 text-gray-500';
        noResults.innerHTML = '<p>No places found nearby. Try increasing the radius.</p>';
        container.appendChild(noResults);
        return;
    }
    
    // Sort by distance
    places.sort((a, b) => {
        const distA = getDistance(app.userLocation, {lat: a.lat, lng: a.lon});
        const distB = getDistance(app.userLocation, {lat: b.lat, lng: b.lon});
        return distA - distB;
    });
    
    // Create place cards
    places.forEach(place => {
        const dist = getDistance(app.userLocation, {lat: place.lat, lng: place.lon});
        const name = place.tags?.name || 'Unknown Place';
        const imageUrl = getCategoryImage(app.currentCategory);
        
        const card = document.createElement('div');
        card.className = 'glass rounded-3xl overflow-hidden shadow-lg p-3 flex gap-4 cursor-pointer place-card';
        card.innerHTML = `
            <img src="${imageUrl}" class="w-24 h-24 rounded-2xl object-cover">
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-gray-800">${name}</h4>
                    <span class="bg-green-100 text-green-600 text-[10px] px-2 py-1 rounded-full">Open Now</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">📍 ${dist.toFixed(1)} km away</p>
                <p class="text-xs text-gray-400 mt-1">📍 ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}</p>
                <button onclick="event.stopPropagation(); openDirections(${place.lat}, ${place.lon}, '${name.replace(/'/g, "\\'")}')" class="mt-2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full hover:bg-purple-600 transition-colors">
                    🧭 Directions
                </button>
            </div>
        `;
        container.appendChild(card);
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

// Calculate distance
function getDistance(p1, p2) {
    const R = 6371; // Earth's radius in km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
               Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
               Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Open Google Maps directions
function openDirections(lat, lng, name) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
    console.log('Opening directions:', url);
    window.open(url, '_blank');
}

// Show error
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

// Setup event listeners
function setupListeners() {
    // Category clicks
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            // Update visual state
            document.querySelectorAll('.category-item div').forEach(div => {
                div.classList.remove('bg-purple-100', 'border-2', 'border-purple-500');
            });
            this.querySelector('div').classList.add('bg-purple-100', 'border-2', 'border-purple-500');
            
            app.currentCategory = this.dataset.category;
            console.log('Category changed to:', app.currentCategory);
            fetchPlaces();
        });
    });
    
    // Radius clicks
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
            console.log('Radius changed to:', app.currentRadius);
            fetchPlaces();
        });
    });
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            console.log('Search:', this.value);
            // For now, just refetch places
            if (this.value.trim() === '') {
                fetchPlaces();
            }
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');
    setupListeners();
    getUserLocation();
    
    // Set initial category visual state
    const firstCategory = document.querySelector('.category-item[data-category="food"]');
    if (firstCategory) {
        firstCategory.querySelector('div').classList.add('bg-purple-100', 'border-2', 'border-purple-500');
    }
    
    // Set initial radius visual state
    const firstRadius = document.querySelector('.radius-filter[data-radius="5"]');
    if (firstRadius) {
        firstRadius.classList.add('bg-purple-500', 'text-white');
        firstRadius.classList.remove('hover:bg-white/50');
    }
});

// Make functions global for onclick handlers
window.openDirections = openDirections;
