// App State Management
const appState = {
    currentScreen: 'home',
    selectedCategory: 'food',
    selectedRadius: 5,
    selectedPlace: null,
    savedPlaces: [],
    deferredPrompt: null
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
    renderPlacesList();
    setupPWAInstall();
});

// App Initialization
function initializeApp() {
    console.log('DiscoverLocal App Initialized');
    showScreen('home');
    selectCategory('food');
    selectRadius(5);
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
            renderPlacesList();
        });
    });

    // Radius Filters
    document.querySelectorAll('.radius-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            const radius = parseInt(this.dataset.radius);
            selectRadius(radius);
            renderPlacesList();
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

// Render Places List
function renderPlacesList() {
    const places = getPlacesByCategory(appState.selectedCategory);
    const filteredPlaces = filterPlacesByRadius(places, appState.selectedRadius);
    
    elements.placesList.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">Nearby Popular</h3>
        ${filteredPlaces.length > 0 ? 
            filteredPlaces.map(place => createPlaceCard(place)).join('') :
            '<div class="text-center py-8 text-gray-500">No places found in this area</div>'
        }
    `;
    
    // Add click handlers to place cards
    document.querySelectorAll('.place-card').forEach(card => {
        card.addEventListener('click', function() {
            const placeId = parseInt(this.dataset.placeId);
            showPlaceDetails(placeId);
        });
    });
}

// Create Place Card HTML
function createPlaceCard(place) {
    return `
        <div class="place-card glass rounded-3xl overflow-hidden shadow-lg p-3 flex gap-4 cursor-pointer" data-place-id="${place.id}">
            <img src="${place.image}" class="w-24 h-24 rounded-2xl object-cover">
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-gray-800">${place.name}</h4>
                    <span class="bg-green-100 text-green-600 text-[10px] px-2 py-1 rounded-full">${place.status}</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">⭐ ${place.rating} (${place.reviews} reviews)</p>
                <p class="text-xs text-gray-400 mt-1">📍 ${place.distance} km away</p>
            </div>
        </div>
    `;
}

// Filter Places by Radius
function filterPlacesByRadius(places, radius) {
    return places.filter(place => place.distance <= radius);
}

// Search Functionality
function handleSearch(query) {
    if (!query.trim()) {
        renderPlacesList();
        return;
    }
    
    const allPlaces = getAllPlaces();
    const filtered = allPlaces.filter(place => 
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        place.description.toLowerCase().includes(query.toLowerCase())
    );
    
    elements.placesList.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">Search Results</h3>
        ${filtered.length > 0 ? 
            filtered.map(place => createPlaceCard(place)).join('') :
            '<div class="text-center py-8 text-gray-500">No results found</div>'
        }
    `;
}

// Show Place Details
function showPlaceDetails(placeId) {
    const allPlaces = getAllPlaces();
    const place = allPlaces.find(p => p.id === placeId);
    
    if (!place) return;
    
    appState.selectedPlace = place;
    renderDetailsOverlay(place);
    elements.detailsOverlay.classList.remove('hidden');
}

// Render Details Overlay
function renderDetailsOverlay(place) {
    elements.detailsContent.innerHTML = `
        <!-- Header with Image -->
        <div class="relative">
            <img src="${place.image}" class="w-full h-64 object-cover">
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
                <span class="text-gray-600">⭐ ${place.rating} (${place.reviews} reviews)</span>
                <span class="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">${place.status}</span>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-3 mt-6">
                <button onclick="getDirections(${place.id})" class="flex-1 bg-purple-500 text-white py-3 rounded-2xl font-semibold hover:bg-purple-600 transition-colors">
                    🧭 Directions
                </button>
                <button onclick="callPlace(${place.id})" class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-2xl font-semibold hover:bg-gray-300 transition-colors">
                    📞 Call
                </button>
            </div>
            
            <!-- Expandable Sections -->
            <div class="mt-6 space-y-4">
                <!-- About Section -->
                <div class="border rounded-2xl overflow-hidden">
                    <button onclick="toggleSection('about')" class="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50">
                        <span class="font-semibold">About</span>
                        <svg class="w-5 h-5 transform transition-transform" id="about-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div id="about-section" class="expandable-section">
                        <div class="p-4 pt-0 text-gray-600">
                            <p>${place.about}</p>
                            <div class="mt-3 space-y-2">
                                <p class="flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    ${place.address}
                                </p>
                                ${place.phone ? `
                                <p class="flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                    </svg>
                                    ${place.phone}
                                </p>
                                ` : ''}
                                ${place.website ? `
                                <p class="flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                                    </svg>
                                    <a href="${place.website}" target="_blank" class="text-purple-500 hover:underline">${place.website}</a>
                                </p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Photos Section -->
                <div class="border rounded-2xl overflow-hidden">
                    <button onclick="toggleSection('photos')" class="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50">
                        <span class="font-semibold">Photos</span>
                        <svg class="w-5 h-5 transform transition-transform" id="photos-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div id="photos-section" class="expandable-section">
                        <div class="p-4 pt-0">
                            <div class="grid grid-cols-3 gap-2">
                                ${place.photos.map(photo => `
                                    <img src="${photo}" class="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Reviews Section -->
                <div class="border rounded-2xl overflow-hidden">
                    <button onclick="toggleSection('reviews')" class="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50">
                        <span class="font-semibold">Reviews</span>
                        <svg class="w-5 h-5 transform transition-transform" id="reviews-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div id="reviews-section" class="expandable-section">
                        <div class="p-4 pt-0 space-y-4">
                            ${place.userReviews.map(review => `
                                <div class="flex gap-3">
                                    <img src="${review.avatar}" class="w-10 h-10 rounded-full">
                                    <div class="flex-1">
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <p class="font-semibold text-gray-800">${review.name}</p>
                                                <div class="flex items-center gap-1">
                                                    ${generateStars(review.rating)}
                                                    <span class="text-xs text-gray-500">${review.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="text-gray-600 mt-1">${review.comment}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Toggle Expandable Section
function toggleSection(sectionName) {
    const section = document.getElementById(`${sectionName}-section`);
    const arrow = document.getElementById(`${sectionName}-arrow`);
    
    section.classList.toggle('expanded');
    arrow.classList.toggle('rotate-180');
}

// Generate Star Rating
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<span class="text-yellow-400">⭐</span>';
        } else {
            stars += '<span class="text-gray-300">⭐</span>';
        }
    }
    return stars;
}

// Close Details Overlay
function closeDetailsOverlay() {
    elements.detailsOverlay.classList.add('hidden');
    appState.selectedPlace = null;
}

// Place Actions
function getDirections(placeId) {
    const allPlaces = getAllPlaces();
    const place = allPlaces.find(p => p.id === placeId);
    
    if (place) {
        // Mock directions - in real app would open maps
        console.log(`Getting directions to ${place.name}`);
        alert(`Directions to ${place.name} would open in maps app`);
    }
}

function callPlace(placeId) {
    const allPlaces = getAllPlaces();
    const place = allPlaces.find(p => p.id === placeId);
    
    if (place && place.phone) {
        // Mock call - in real app would open phone
        console.log(`Calling ${place.phone}`);
        alert(`Would call ${place.phone}`);
    }
}

function toggleSavePlace(placeId) {
    const index = appState.savedPlaces.indexOf(placeId);
    if (index > -1) {
        appState.savedPlaces.splice(index, 1);
    } else {
        appState.savedPlaces.push(placeId);
    }
    
    // Update UI
    if (appState.selectedPlace && appState.selectedPlace.id === placeId) {
        renderDetailsOverlay(appState.selectedPlace);
    }
}

function sharePlace(placeId) {
    const allPlaces = getAllPlaces();
    const place = allPlaces.find(p => p.id === placeId);
    
    if (place) {
        // Mock share - in real app would open share dialog
        console.log(`Sharing ${place.name}`);
        alert(`Share dialog for ${place.name}`);
    }
}

// Show Saved Places
function showSavedPlaces() {
    const allPlaces = getAllPlaces();
    const saved = allPlaces.filter(place => appState.savedPlaces.includes(place.id));
    
    elements.placesList.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-4">Saved Places</h3>
        ${saved.length > 0 ? 
            saved.map(place => createPlaceCard(place)).join('') :
            '<div class="text-center py-8 text-gray-500">No saved places yet</div>'
        }
    `;
    
    showScreen('home');
    
    // Re-add click handlers
    document.querySelectorAll('.place-card').forEach(card => {
        card.addEventListener('click', function() {
            const placeId = parseInt(this.dataset.placeId);
            showPlaceDetails(placeId);
        });
    });
}

// Show Profile
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
            <div class="space-y-2">
                <button class="w-full glass p-3 rounded-2xl text-left hover:bg-white/50">
                    <span class="font-semibold">Settings</span>
                </button>
                <button class="w-full glass p-3 rounded-2xl text-left hover:bg-white/50">
                    <span class="font-semibold">Privacy</span>
                </button>
                <button class="w-full glass p-3 rounded-2xl text-left hover:bg-white/50">
                    <span class="font-semibold">Help & Support</span>
                </button>
            </div>
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
