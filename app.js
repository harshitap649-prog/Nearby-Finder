// Global variables
let map;
let userLocation = null;
let markers = [];
let currentRadius = 5; // Default radius in km
let selectedPlace = null;
let directionsRenderer = null;
let placesData = []; // Store places data for access

// Category mapping to OSM tags
const categoryMappings = {
    'restaurant': 'amenity=restaurant',
    'cafe': 'amenity=cafe',
    'food': 'amenity=fast_food',
    'hotel': 'tourism=hotel',
    'lodging': 'tourism=hotel',
    'toilet': 'amenity=toilets',
    'restroom': 'amenity=toilets',
    'park': 'leisure=park',
    'museum': 'tourism=museum',
    'tourist_attraction': 'tourism=attraction',
    'travel_agency': 'shop=travel_agency',
    'parking': 'amenity=parking',
    'fuel': 'amenity=fuel',
    'bank': 'amenity=bank',
    'pharmacy': 'amenity=pharmacy',
    'hospital': 'amenity=hospital',
    'atm': 'amenity=atm'
};

// Initialize Map
map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: ' OpenStreetMap'
}).addTo(map);

// Get user's location and center map
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setView([userLocation.lat, userLocation.lng], 13);
                
                // Add user location marker
                L.marker([userLocation.lat, userLocation.lng])
                    .addTo(map)
                    .bindPopup('Your Location')
                    .openPopup();
                
                // Fetch nearby places for default radius
                fetchNearbyPlaces(currentRadius);
            },
            (error) => {
                console.error('Error getting location:', error);
                // Fallback to default location
                userLocation = { lat: 51.505, lng: -0.09 }; // London fallback
                fetchNearbyPlaces(currentRadius);
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser');
        userLocation = { lat: 51.505, lng: -0.09 }; // London fallback
        fetchNearbyPlaces(currentRadius);
    }
}

// Free Overpass API integration
async function fetchFreePlaces(lat, lng, category) {
    const radiusInMeters = currentRadius * 1000;
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node["${category}"](around:${radiusInMeters},${lat},${lng});out;`;

    try {
        console.log(`Fetching ${category} places around ${lat},${lng}`);
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`Found ${data.elements.length} places for category: ${category}`);
        return data.elements.map(place => ({
            id: place.id,
            name: place.tags.name || 'Unnamed Place',
            lat: place.lat,
            lng: place.lon,
            tags: place.tags,
            category: category
        }));
    } catch (error) {
        console.error(`Error fetching ${category} places:`, error);
        return [];
    }
}

// Fetch all nearby places using Overpass API
async function fetchNearbyPlaces(radius) {
    if (!userLocation) {
        console.log('User location not available yet');
        return;
    }

    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    placesData = [];

    currentRadius = radius;
    console.log(`Fetching places within ${radius}km of`, userLocation);

    try {
        // Fetch multiple categories in parallel
        const categories = [
            'amenity=restaurant',
            'amenity=cafe', 
            'amenity=fast_food',
            'tourism=hotel',
            'amenity=toilets',
            'leisure=park',
            'tourism=museum',
            'tourism=attraction',
            'amenity=parking',
            'amenity=bank',
            'amenity=pharmacy'
        ];

        const promises = categories.map(category => {
            const [key, value] = category.split('=');
            return fetchFreePlaces(userLocation.lat, userLocation.lng, category);
        });

        const results = await Promise.all(promises);
        const allPlaces = results.flat();
        
        console.log(`Total places found: ${allPlaces.length}`);
        
        if (allPlaces.length > 0) {
            displayPlaces(allPlaces);
            allPlaces.forEach(place => {
                addMarkerToMap(place);
            });
        } else {
            displayNoPlacesFound();
        }
    } catch (error) {
        console.error('Error fetching places:', error);
        displaySamplePlaces();
    }
}

// Add marker to map for each place
function addMarkerToMap(place) {
    const marker = L.marker([place.lat, place.lng])
        .addTo(map)
        .bindPopup(place.name);
    
    // Add click event to marker
    marker.on('click', () => showPlaceDetails(place));
    
    markers.push(marker);
}

// Get user-friendly category name
function getCategoryName(category) {
    const categoryNames = {
        'amenity=restaurant': 'Restaurant',
        'amenity=cafe': 'Cafe',
        'amenity=fast_food': 'Fast Food',
        'tourism=hotel': 'Hotel',
        'amenity=toilets': 'Restroom',
        'leisure=park': 'Park',
        'tourism=museum': 'Museum',
        'tourism=attraction': 'Tourist Attraction',
        'amenity=parking': 'Parking',
        'amenity=bank': 'Bank',
        'amenity=pharmacy': 'Pharmacy'
    };
    return categoryNames[category] || 'Place';
}

// Display places in the UI
function displayPlaces(places) {
    // Store places data for access
    placesData = places;
    
    const placesSection = document.querySelector('section.space-y-4');
    const placesHTML = places.map(place => {
        const photo = `https://picsum.photos/seed/${place.id}/400/400.jpg`;
        const rating = Math.random() > 0.3 ? `⭐ ${(Math.random() * 2 + 3).toFixed(1)} (${Math.floor(Math.random() * 500 + 10)} reviews)` : 'No ratings';
        const distance = calculateDistance(userLocation, { lat: place.lat, lng: place.lng });
        
        return `
            <div class="glass rounded-3xl overflow-hidden shadow-lg p-3 flex gap-4 cursor-pointer hover:shadow-xl transition-shadow" onclick="showPlaceDetails('${place.id}')">
                <img src="${photo}" class="w-24 h-24 rounded-2xl object-cover">
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold">${place.name}</h4>
                        <span class="bg-green-100 text-green-600 text-[10px] px-2 py-1 rounded-full">Open Now</span>
                    </div>
                    <p class="text-xs text-gray-500">${rating}</p>
                    <p class="text-xs text-gray-400 mt-1"> 📍 ${distance.toFixed(1)} km away</p>
                    <p class="text-xs text-gray-400 mt-1">${getCategoryName(place.category)}</p>
                </div>
            </div>
        `;
    }).join('');
    
    placesSection.innerHTML = '<h3 class="text-lg font-bold text-gray-800">Nearby Popular</h3>' + placesHTML;
}

// Calculate distance between two points
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Display no places found message
function displayNoPlacesFound() {
    const placesSection = document.querySelector('section.space-y-4');
    placesSection.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800">Nearby Popular</h3>
        <div class="glass rounded-3xl overflow-hidden shadow-lg p-6 text-center">
            <div class="text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <p class="text-lg font-semibold mb-2">No places found nearby</p>
                <p class="text-sm">Try increasing the search radius or check your location</p>
            </div>
        </div>
    `;
}

// Fallback sample data
function displaySamplePlaces() {
    console.log('Using sample data - API likely failed');
    const samplePlaces = [
        {
            id: 'sample1',
            name: "The Daily Grind",
            lat: userLocation.lat + 0.01,
            lng: userLocation.lng + 0.01,
            category: 'amenity=restaurant',
            tags: { name: "The Daily Grind" }
        }
    ];
    displayPlaces(samplePlaces);
}

// Radius button event listeners
document.querySelectorAll('header button').forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('header button').forEach(btn => {
            btn.classList.remove('bg-indigo-500', 'text-white');
        });
        
        // Add active class to clicked button
        this.classList.add('bg-indigo-500', 'text-white');
        
        // Extract radius from button text
        const radiusText = this.textContent;
        if (radiusText.includes('5km')) currentRadius = 5;
        else if (radiusText.includes('10km')) currentRadius = 10;
        else if (radiusText.includes('45km')) currentRadius = 45;
        
        // Fetch places for new radius
        fetchNearbyPlaces(currentRadius);
    });
});

// PWA Install Logic
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.classList.add('hidden');
        }
        deferredPrompt = null;
    }
});

// Show place details in modal
function showPlaceDetails(placeId) {
    const place = placesData.find(p => p.id == placeId);
    if (!place) return;
    
    selectedPlace = place;
    
    const photo = `https://picsum.photos/seed/${place.id}/800/600.jpg`;
    const rating = Math.random() > 0.3 ? `⭐ ${(Math.random() * 2 + 3).toFixed(1)} (${Math.floor(Math.random() * 500 + 10)} reviews)` : 'No ratings';
    const address = place.tags["addr:street"] || place.tags["addr:housenumber"] || 'Address not available';
    const phone = place.tags.phone || 'Phone not available';
    const website = place.tags.website || null;
    const distance = calculateDistance(userLocation, { lat: place.lat, lng: place.lng });
    
    // Create modal HTML
    const modalHTML = `
        <div id="placeModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div class="relative">
                    <img src="${photo}" class="w-full h-48 object-cover rounded-t-3xl">
                    <button onclick="closePlaceModal()" class="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="p-6">
                    <h2 class="text-2xl font-bold mb-2">${place.name}</h2>
                    <p class="text-gray-600 mb-4">${rating} • ${getCategoryName(place.category)}</p>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex items-center gap-3 text-gray-700">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <span>${address}</span>
                        </div>
                        
                        ${phone !== 'Phone not available' ? `
                        <div class="flex items-center gap-3 text-gray-700">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <span>${phone}</span>
                        </div>
                        ` : ''}
                        
                        <div class="flex items-center gap-3 text-gray-700">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                            <span>📍 ${distance.toFixed(1)} km away</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="getDirections()" class="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-semibold hover:bg-indigo-700 transition-colors">
                            🧭 Get Directions
                        </button>
                        ${website ? `<a href="${website}" target="_blank" class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-2xl font-semibold hover:bg-gray-300 transition-colors text-center">🌐 Website</a>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close place modal
function closePlaceModal() {
    const modal = document.getElementById('placeModal');
    if (modal) {
        modal.remove();
    }
    selectedPlace = null;
}

// Get directions to selected place using Google Maps URL
function getDirections() {
    if (!selectedPlace || !userLocation) {
        alert('Location or place not available');
        return;
    }
    
    closePlaceModal();
    
    // Create Google Maps directions URL with coordinates
    const destination = `${selectedPlace.lat},${selectedPlace.lng}`;
    const origin = `${userLocation.lat},${userLocation.lng}`;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    
    // Open in new tab
    window.open(directionsUrl, '_blank');
}

// Initialize the app - no Google Maps API needed
getUserLocation();

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}