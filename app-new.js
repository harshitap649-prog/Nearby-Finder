// App State Management
const appState = {
    currentScreen: 'home',
    selectedCategory: 'food',
    selectedRadius: 5,
    selectedPlace: null,
    savedPlaces: [],
    deferredPrompt: null,
    userLocation: null,
    isLoading: false
};

// Category mapping to OSM tags
const categoryMappings = {
    'food': 'amenity=restaurant',
    'hotels': 'tourism=hotel',
    'restrooms': 'amenity=toilets',
    'travel': 'tourism=attraction',
    'cafes': 'amenity=cafe',
    'shopping': 'shop',
    'emergency': 'amenity=hospital'
};

// DOM Elements
const elements = {
    homeScreen: document.getElementById('homeScreen'),
    mapScreen: document.getElementById('mapScreen'),
    detailsOverlay: document.getElementById('detailsOverlay'),
    detailsContent: document.getElementById('detailsContent'),
    placesList: document.getElementById('placesList'),
    searchInput: document.getElementById('searchInput'),
    installBtn: document.getElementById('installBtn')
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    getUserLocation();
    setupPWAInstall();
});

// App Initialization
function initializeApp() {
    console.log('DiscoverLocal App Initialized');
    showScreen('home');
    selectCategory('food');
    selectRadius(5);
}

// Get User's GPS Location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                appState.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('User location:', appState.userLocation);
                // Fetch places after getting location
                fetchRealPlaces();
            },
            (error) => {
                console.error('Error getting location:', error);
                // Fallback to default location (New York)
                appState.userLocation = { lat: 40.7128, lng: -74.0060 };
                fetchRealPlaces();
            }
        );
    } else {
        console.error('Geolocation not supported');
        appState.userLocation = { lat: 40.7128, lng: -74.0060 };
        fetchRealPlaces();
    }
}

// Fetch Real Places from Overpass API
async function fetchRealPlaces() {
    if (!appState.userLocation) {
        console.log('Waiting for user location...');
        return;
    }

    appState.isLoading = true;
    showLoadingState();

    try {
        const category = categoryMappings[appState.selectedCategory];
        const radiusInMeters = appState.selectedRadius * 1000;
        
        // Overpass API query
        const query = `[out:json][timeout:25];
        (
            node["${category}"](around:${radiusInMeters},${appState.userLocation.lat},${appState.userLocation.lng});
            way["${category}"](around:${radiusInMeters},${appState.userLocation.lat},${appState.userLocation.lng});
            relation["${category}"](around:${radiusInMeters},${appState.userLocation.lat},${appState.userLocation.lng});
        );
        out geom;`;
        
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        console.log('Fetching from:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`Found ${data.elements.length} places for ${category}`);
        
        // Process and display the results
        const processedPlaces = processOverpassData(data.elements);
        displayRealPlaces(processedPlaces);
        
    } catch (error) {
        console.error('Error fetching places:', error);
        showErrorState();
    } finally {
        appState.isLoading = false;
    }
}

// Process Overpass API Data
function processOverpassData(elements) {
    return elements.map(element => {
        let lat, lng;
        
        // Extract coordinates based on element type
        if (element.type === 'node') {
            lat = element.lat;
            lng = element.lon;
        } else if (element.type === 'way') {
            // For ways, use center of geometry if available
            if (element.center) {
                lat = element.center.lat;
                lng = element.center.lon;
            } else if (element.bounds) {
                lat = (element.bounds.minlat + element.bounds.maxlat) / 2;
                lng = (element.bounds.minlon + element.bounds.maxlon) / 2;
            }
        } else if (element.type === 'relation') {
            // For relations, use center if available
            if (element.center) {
                lat = element.center.lat;
                lng = element.center.lon;
            }
        }
        
        if (!lat || !lng) return null;
        
        // Calculate distance from user
        const distance = calculateDistance(
            appState.userLocation.lat,
            appState.userLocation.lng,
            lat,
            lng
        );
        
        return {
            id: element.id,
            name: element.tags?.name || 'Unknown Place',
            lat: lat,
            lng: lng,
            distance: distance,
            category: appState.selectedCategory,
            tags: element.tags || {},
            type: element.type
        };
    }).filter(place => place !== null); // Remove null entries
}

// Calculate Distance Between Two Points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Display Real Places in UI
function displayRealPlaces(places) {
    if (places.length === 0) {
        showNoPlacesFound();
        return;
    }
    
    // Sort by distance
    places.sort((a, b) => a.distance - b.distance);
    
    const placesHTML = places.map(place => createRealPlaceCard(place)).join('');
    
    elements.placesList.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">Nearby ${appState.selectedCategory.charAt(0).toUpperCase() + appState.selectedCategory.slice(1)} (${places.length} found)</h3>
        ${placesHTML}
    `;
    
    // Add click handlers to place cards
    document.querySelectorAll('.place-card').forEach(card => {
        card.addEventListener('click', function() {
            const placeId = this.dataset.placeId;
            showRealPlaceDetails(placeId);
        });
    });
}

// Create Real Place Card HTML
function createRealPlaceCard(place) {
    const photo = `https://picsum.photos/seed/${place.id}-${place.name}/400/400.jpg`;
    const categoryEmoji = getCategoryEmoji(place.category);
    
    return `
        <div class="place-card glass rounded-3xl overflow-hidden shadow-lg p-3 flex gap-4 cursor-pointer" data-place-id="${place.id}">
            <img src="${photo}" class="w-24 h-24 rounded-2xl object-cover">
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-gray-800">${place.name}</h4>
                    <span class="bg-green-100 text-green-600 text-[10px] px-2 py-1 rounded-full">Open Now</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">${categoryEmoji} ${getCategoryName(place.category)}</p>
                <p class="text-xs text-gray-400 mt-1">📍 ${place.distance.toFixed(1)} km away</p>
                <button onclick="event.stopPropagation(); openDirections(${place.lat}, ${place.lng}, '${place.name}')" class="mt-2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full hover:bg-purple-600 transition-colors">
                    🧭 Directions
                </button>
            </div>
        </div>
    `;
}

// Get Category Emoji
function getCategoryEmoji(category) {
    const emojis = {
        'food': '🍕',
        'hotels': '🏨',
        'restrooms': '🚻',
        'travel': '🌄',
        'cafes': '☕',
        'shopping': '🛍️',
        'emergency': '🚨'
    };
    return emojis[category] || '📍';
}

// Get Category Display Name
function getCategoryName(category) {
    const names = {
        'food': 'Restaurant',
        'hotels': 'Hotel',
        'restrooms': 'Restroom',
        'travel': 'Tourist Attraction',
        'cafes': 'Cafe',
        'shopping': 'Shop',
        'emergency': 'Hospital'
    };
    return names[category] || 'Place';
}

// Show Loading State
function showLoadingState() {
    elements.placesList.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">Searching Nearby...</h3>
        <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p class="text-gray-500 mt-2">Finding real places near you...</p>
        </div>
    `;
}

// Show No Places Found
function showNoPlacesFound() {
    elements.placesList.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">No Places Found</h3>
        <div class="glass rounded-3xl overflow-hidden shadow-lg p-6 text-center">
            <div class="text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <p class="text-lg font-semibold mb-2">No ${getCategoryName(appState.selectedCategory).toLowerCase()}s found nearby</p>
                <p class="text-sm">Try increasing the search radius or check your location</p>
            </div>
        </div>
    `;
}

// Show Error State
function showErrorState() {
    elements.placesList.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">Error</h3>
        <div class="glass rounded-3xl overflow-hidden shadow-lg p-6 text-center">
            <div class="text-red-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-lg font-semibold mb-2">Unable to fetch places</p>
                <p class="text-sm">Please check your internet connection and try again</p>
            </div>
        </div>
    `;
}

// Open Directions in Google Maps
function openDirections(lat, lng, name) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
}

// Show Real Place Details
function showRealPlaceDetails(placeId) {
    const allPlaces = document.querySelectorAll('.place-card');
    let foundPlace = null;
    
    // Find the place data from the DOM
    allPlaces.forEach(card => {
        if (card.dataset.placeId === placeId) {
            const name = card.querySelector('h4').textContent;
            const distance = card.querySelector('.text-gray-400').textContent;
            
            foundPlace = {
                id: placeId,
                name: name,
                lat: null, // We'll need to store this better
                lng: null,
                distance: distance,
                category: appState.selectedCategory
            };
        }
    });
    
    if (!foundPlace) return;
    
    appState.selectedPlace = foundPlace;
    renderRealDetailsOverlay(foundPlace);
    elements.detailsOverlay.classList.remove('hidden');
}

// Render Real Details Overlay
function renderRealDetailsOverlay(place) {
    const photo = `https://picsum.photos/seed/${place.id}-${place.name}/800/600.jpg`;
    
    elements.detailsContent.innerHTML = `
        <!-- Header with Image -->
        <div class="relative">
            <img src="${photo}" class="w-full h-64 object-cover">
            <div class="absolute top-4 right-4 flex gap-2">
                <button onclick="toggleSavePlace(${place.id})" class="glass-dark p-2 rounded-full">
                    <svg class="w-5 h-5 ${appState.savedPlaces.includes(place.id) ? 'text-red-500 fill-current' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </button>
                <button onclick="sharePlace(${place.id})" class="glass-dark p-2 rounded-full">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.732 2.684m4.732-2.684a3 3 0 00-4.732-2.684M3 12l6.732 6.732M21 12l-6.732 6.732"></path>
                    </svg>
                </button>
            </div>
            <button onclick="closeDetailsOverlay()" class="absolute top-4 left-4 glass-dark p-2 rounded-full">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>
        </div>
        
        <!-- Content -->
        <div class="p-6 overflow-y-auto" style="max-height: calc(100vh - 200px);">
            <h2 class="text-2xl font-bold text-gray-800">${place.name}</h2>
            <div class="flex items-center gap-4 mt-2">
                <span class="text-gray-600">${getCategoryEmoji(place.category)} ${getCategoryName(place.category)}</span>
                <span class="text-gray-600">${place.distance}</span>
                <span class="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">Open Now</span>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-3 mt-6">
                <button onclick="openDirections(${place.lat}, ${place.lng}, '${place.name}')" class="flex-1 bg-purple-500 text-white py-3 rounded-2xl font-semibold hover:bg-purple-600 transition-colors">
                    🧭 Directions
                </button>
                <button onclick="closeDetailsOverlay()" class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-2xl font-semibold hover:bg-gray-300 transition-colors">
                    ❌ Close
                </button>
            </div>
        </div>
    `;
}

// Event Listeners Setup
function setupEventListeners() {
    // Bottom Navigation
    document.querySelectorAll('[data-nav]').forEach(btn => {
        btn.addEventListener('click', function() {
            const screen = this.dataset.nav;
            handleBottomNav(screen);
        });
    });

    // Category Selection
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            const category = this.dataset.category;
            selectCategory(category);
            fetchRealPlaces(); // Fetch new places when category changes
        });
    });

    // Radius Filters
    document.querySelectorAll('.radius-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            const radius = parseInt(this.dataset.radius);
            selectRadius(radius);
            fetchRealPlaces(); // Fetch new places when radius changes
        });
    });

    // Search Input
    elements.searchInput.addEventListener('input', function() {
        handleSearch(this.value);
    });

    // Details Overlay Close
    elements.detailsOverlay.addEventListener('click', function(e) {
        if (e.target === this) {
            closeDetailsOverlay();
        }
    });

    // Install Button
    elements.installBtn.addEventListener('click', handlePWAInstall);
}

// Screen Management
function showScreen(screenName) {
    appState.currentScreen = screenName;
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show selected screen
    if (screenName === 'home') {
        elements.homeScreen.classList.remove('hidden');
    } else if (screenName === 'map') {
        elements.mapScreen.classList.remove('hidden');
    }
    
    // Update bottom navigation
    updateBottomNav(screenName);
}

function handleBottomNav(screenName) {
    if (screenName === 'home') {
        showScreen('home');
    } else if (screenName === 'explore') {
        showScreen('map');
    } else if (screenName === 'saved') {
        showSavedPlaces();
    } else if (screenName === 'profile') {
        showProfile();
    }
}

function updateBottomNav(activeNav) {
    document.querySelectorAll('[data-nav]').forEach(btn => {
        if (btn.dataset.nav === activeNav) {
            btn.classList.remove('text-gray-400');
            btn.classList.add('text-purple-500');
        } else {
            btn.classList.remove('text-purple-500');
            btn.classList.add('text-gray-400');
        }
    });
}

// Category Selection
function selectCategory(category) {
    appState.selectedCategory = category;
    
    // Update UI
    document.querySelectorAll('.category-item').forEach(item => {
        if (item.dataset.category === category) {
            item.querySelector('div').classList.add('bg-purple-100', 'border-2', 'border-purple-500');
        } else {
            item.querySelector('div').classList.remove('bg-purple-100', 'border-2', 'border-purple-500');
        }
    });
}

// Radius Selection
function selectRadius(radius) {
    appState.selectedRadius = radius;
    
    // Update UI
    document.querySelectorAll('.radius-filter').forEach(btn => {
        if (parseInt(btn.dataset.radius) === radius) {
            btn.classList.add('bg-purple-500', 'text-white');
            btn.classList.remove('hover:bg-white/50');
        } else {
            btn.classList.remove('bg-purple-500', 'text-white');
            btn.classList.add('hover:bg-white/50');
        }
    });
}

// Search Functionality (for real places)
function handleSearch(query) {
    if (!query.trim()) {
        fetchRealPlaces();
        return;
    }
    
    // This would require a more complex Overpass query for search
    // For now, just show a message
    elements.placesList.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">Search Results</h3>
        <div class="text-center py-8 text-gray-500">
            <p>Search functionality coming soon for real places!</p>
            <p class="text-sm mt-2">Try using the category filters instead.</p>
        </div>
    `;
}

// Close Details Overlay
function closeDetailsOverlay() {
    elements.detailsOverlay.classList.add('hidden');
    appState.selectedPlace = null;
}

// Placeholder functions for other features
function toggleSavePlace(placeId) {
    const index = appState.savedPlaces.indexOf(placeId);
    if (index > -1) {
        appState.savedPlaces.splice(index, 1);
    } else {
        appState.savedPlaces.push(placeId);
    }
    
    if (appState.selectedPlace && appState.selectedPlace.id === placeId) {
        renderRealDetailsOverlay(appState.selectedPlace);
    }
}

function sharePlace(placeId) {
    alert(`Share functionality for place ${placeId} coming soon!`);
}

function showSavedPlaces() {
    elements.placesList.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">Saved Places</h3>
        <div class="text-center py-8 text-gray-500">
            <p>Saved places feature coming soon!</p>
        </div>
    `;
    showScreen('home');
}

function showProfile() {
    elements.placesList.innerHTML = `
        <div class="text-center py-12">
            <div class="w-24 h-24 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Your Profile</h3>
            <p class="text-gray-600 mb-4">Manage your account and preferences</p>
        </div>
    `;
    showScreen('home');
}

// PWA Install Setup
function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        appState.deferredPrompt = e;
        elements.installBtn.classList.remove('hidden');
    });
}

function handlePWAInstall() {
    if (appState.deferredPrompt) {
        appState.deferredPrompt.prompt();
        appState.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('PWA installation accepted');
                elements.installBtn.classList.add('hidden');
            }
            appState.deferredPrompt = null;
        });
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered: ', registration);
    }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
    });
}
