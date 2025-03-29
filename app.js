// DOM Elements
const addListBtn = document.getElementById('addListBtn');
const locationModal = document.getElementById('locationModal');
const addModal = document.getElementById('addModal');
const listsContainer = document.getElementById('lists');

// Location Modal Elements
const useCurrentLocationBtn = document.getElementById('useCurrentLocation');
const enterAddressBtn = document.getElementById('enterAddress');
const addressInput = document.getElementById('addressInput');
const storeAddressInput = document.getElementById('storeAddress');
const notifyRadiusInput = document.getElementById('notifyRadius');
const radiusValue = document.getElementById('radiusValue');
const cancelLocationBtn = document.getElementById('cancelLocation');
const saveLocationBtn = document.getElementById('saveLocation');

// Add Item Modal Elements
const itemInput = document.getElementById('itemInput');
const voiceInputBtn = document.getElementById('voiceInput');
const cameraInputBtn = document.getElementById('cameraInput');
const galleryInputBtn = document.getElementById('galleryInput');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const imageOverlay = document.getElementById('imageOverlay');
const cancelAddBtn = document.getElementById('cancelAdd');
const confirmAddBtn = document.getElementById('confirmAdd');

// State
let currentList = null;
let lists = JSON.parse(localStorage.getItem('shoppingLists')) || [];
let map = null;
let currentMarker = null;
let radiusCircle = null;

// Event Listeners
addListBtn.addEventListener('click', () => showLocationModal());

// Location Modal Events
useCurrentLocationBtn.addEventListener('click', getCurrentLocation);
enterAddressBtn.addEventListener('click', () => {
    addressInput.classList.remove('hidden');
});

// Update radius value and circle on input change
notifyRadiusInput.addEventListener('input', (e) => {
    const radius = parseInt(e.target.value);
    radiusValue.textContent = radius;
    updateRadiusCircle(radius);
});

cancelLocationBtn.addEventListener('click', hideLocationModal);
saveLocationBtn.addEventListener('click', saveLocation);

// Add Item Modal Events
voiceInputBtn.addEventListener('click', startVoiceInput);
cameraInputBtn.addEventListener('click', startCameraInput);
galleryInputBtn.addEventListener('click', startGalleryInput);
cancelAddBtn.addEventListener('click', hideAddModal);
confirmAddBtn.addEventListener('click', addItem);

// Functions
function showLocationModal() {
    locationModal.classList.remove('hidden');
    locationModal.classList.add('animate-fade');
    
    // Initialize map if not already done
    if (!map) {
        // Try to get user's location for initial map center
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    initializeMap([position.coords.latitude, position.coords.longitude]);
                },
                () => {
                    // Default to a central location if geolocation fails
                    initializeMap([40.7128, -74.0060]);
                }
            );
        } else {
            initializeMap([40.7128, -74.0060]);
        }
    } else {
        // Force map to recalculate its size when shown
        setTimeout(() => map.invalidateSize(), 100);
    }
}

function initializeMap(center) {
    map = L.map('locationMap').setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add click handler to map
    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        setMarkerAndAddress(lat, lng);
    });

    // Force map to recalculate its size
    setTimeout(() => map.invalidateSize(), 100);
}

function updateRadiusCircle(radius) {
    if (currentMarker) {
        if (radiusCircle) {
            radiusCircle.setRadius(radius);
        } else {
            radiusCircle = L.circle(currentMarker.getLatLng(), {
                radius: radius,
                color: '#E20074',
                fillColor: '#E20074',
                fillOpacity: 0.1,
                weight: 1
            }).addTo(map);
        }
    }
}

function hideLocationModal() {
    locationModal.classList.add('hidden');
    storeAddressInput.value = '';
    if (currentMarker) {
        currentMarker.remove();
        currentMarker = null;
    }
    if (radiusCircle) {
        radiusCircle.remove();
        radiusCircle = null;
    }
}

function getCurrentLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 16);
                setMarkerAndAddress(latitude, longitude);
            },
            error => {
                alert('Error getting location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

async function setMarkerAndAddress(lat, lon) {
    // Update or create marker
    if (currentMarker) {
        currentMarker.setLatLng([lat, lon]);
    } else {
        currentMarker = L.marker([lat, lon], {
            draggable: true
        }).addTo(map);

        // Update address when marker is dragged
        currentMarker.on('dragend', function(e) {
            const position = e.target.getLatLng();
            reverseGeocode(position.lat, position.lng);
            updateRadiusCircle(parseInt(notifyRadiusInput.value));
        });
    }

    // Update radius circle
    updateRadiusCircle(parseInt(notifyRadiusInput.value));

    // Center map on marker
    map.setView([lat, lon], map.getZoom());

    // Get address for location
    reverseGeocode(lat, lon);
}

async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await response.json();
        storeAddressInput.value = data.display_name;
    } catch (error) {
        alert('Error getting address: ' + error.message);
    }
}

// Add search functionality to address input
storeAddressInput.addEventListener('keypress', async function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const address = this.value;
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
            );
            const data = await response.json();
            if (data && data[0]) {
                const { lat, lon } = data[0];
                setMarkerAndAddress(parseFloat(lat), parseFloat(lon));
            } else {
                alert('Location not found');
            }
        } catch (error) {
            alert('Error searching location: ' + error.message);
        }
    }
});

function saveLocation() {
    const address = storeAddressInput.value;
    const radius = parseInt(notifyRadiusInput.value);
    
    if (!address || !currentMarker) {
        alert('Please select a store location on the map');
        return;
    }

    const coords = currentMarker.getLatLng();
    const newList = {
        id: Date.now(),
        store: address,
        radius,
        coordinates: {
            lat: coords.lat,
            lon: coords.lng
        },
        items: []
    };

    lists.push(newList);
    localStorage.setItem('shoppingLists', JSON.stringify(lists));
    hideLocationModal();
    renderLists();
    currentList = newList;
    showAddModal();
}

function showAddModal() {
    addModal.classList.remove('hidden');
    addModal.classList.add('animate-fade');
    itemInput.focus();
}

function hideAddModal() {
    addModal.classList.add('hidden');
    imagePreview.classList.add('hidden');
    itemInput.value = '';
    previewImage.src = '';
}

function startVoiceInput() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        const originalButtonText = voiceInputBtn.innerHTML;
        voiceInputBtn.innerHTML = '👂 Listening...';
        voiceInputBtn.disabled = true;
        voiceInputBtn.classList.add('opacity-75', 'cursor-not-allowed');

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            itemInput.value = finalTranscript || interimTranscript;
            itemInput.placeholder = finalTranscript ? '📝 Enter item name' : '🗣️ Speak now...';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            let errorMessage = 'Speech recognition error';
            if (event.error === 'no-speech') {
                errorMessage = 'No speech detected. Please try again.';
            } else if (event.error === 'audio-capture') {
                errorMessage = 'Microphone error. Please check permissions.';
            } else if (event.error === 'not-allowed') {
                errorMessage = 'Permission denied. Please allow microphone access.';
            }
            alert(errorMessage);
            voiceInputBtn.innerHTML = originalButtonText;
            voiceInputBtn.disabled = false;
            voiceInputBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            itemInput.placeholder = '📝 Enter item name';
        };

        recognition.onend = () => {
            voiceInputBtn.innerHTML = originalButtonText;
            voiceInputBtn.disabled = false;
            voiceInputBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            itemInput.placeholder = '📝 Enter item name';
        };

        try {
            recognition.start();
        } catch (e) {
            console.error("Could not start recognition:", e);
            alert("Could not start voice recognition. Please try again.");
            voiceInputBtn.innerHTML = originalButtonText;
            voiceInputBtn.disabled = false;
            voiceInputBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            itemInput.placeholder = '📝 Enter item name';
        }
    } else {
        alert('Speech recognition is not supported by your browser. Try Chrome or Edge.');
    }
}

function startCameraInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processImage(file);
        }
    };

    input.click();
}

function startGalleryInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processImage(file);
        }
    };

    input.click();
}

function processImage(file) {
    imagePreview.classList.remove('hidden');
    previewImage.src = URL.createObjectURL(file);
    imageOverlay.classList.remove('hidden');
    
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            const MAX_SIZE = 1024;
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_SIZE || height > MAX_SIZE) {
                const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            setTimeout(() => {
                imageOverlay.classList.add('hidden');
                itemInput.value = 'Scanned Item ' + new Date().toLocaleTimeString();
            }, 1500);
        };
        
        img.onerror = () => {
            throw new Error('Failed to load image');
        };
        
        img.src = URL.createObjectURL(file);
    } catch (error) {
        imageOverlay.classList.add('hidden');
        alert('Error processing image: ' + error.message);
    }
}

function addItem() {
    const itemName = itemInput.value.trim();
    
    if (!itemName) {
        alert('Please enter an item name');
        return;
    }

    const item = {
        id: Date.now(),
        name: itemName,
        completed: false
    };

    currentList.items.push(item);
    localStorage.setItem('shoppingLists', JSON.stringify(lists));
    hideAddModal();
    renderLists();
}

function renderLists() {
    listsContainer.innerHTML = '';
    
    lists.forEach(list => {
        const listElement = document.createElement('div');
        listElement.className = 'bg-gray-800 p-4 rounded-lg shadow-lg';
        
        listElement.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold">🏪 ${list.store}</h3>
                <div class="flex gap-2">
                    <span class="text-gray-400">📍 ${list.radius}m</span>
                    <button onclick="deleteList(${list.id})" class="text-gray-400 hover:text-red-500">🗑️</button>
                </div>
            </div>
            <div class="space-y-2">
                ${list.items.map(item => `
                    <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox"
                                   ${item.completed ? 'checked' : ''}
                                   onchange="toggleItem(${list.id}, ${item.id})"
                                   class="rounded bg-gray-600 border-gray-500 text-tmobile focus:ring-tmobile">
                            <span class="${item.completed ? 'line-through text-gray-400' : ''}">
                                ${item.completed ? '✅' : '📝'} ${item.name}
                            </span>
                        </label>
                        <button onclick="deleteItem(${list.id}, ${item.id})" class="text-gray-400 hover:text-red-500">🗑️</button>
                    </div>
                `).join('')}
            </div>
            <button onclick="addToList(${list.id})" class="mt-4 w-full bg-tmobile text-white p-2 rounded hover:bg-opacity-90">
                ✨ Add Item
            </button>
        `;
        
        listsContainer.appendChild(listElement);
    });
}

function deleteList(listId) {
    if (confirm('Are you sure you want to delete this list?')) {
        lists = lists.filter(list => list.id !== listId);
        localStorage.setItem('shoppingLists', JSON.stringify(lists));
        renderLists();
    }
}

function toggleItem(listId, itemId) {
    const list = lists.find(l => l.id === listId);
    const item = list.items.find(i => i.id === itemId);
    item.completed = !item.completed;
    localStorage.setItem('shoppingLists', JSON.stringify(lists));
    renderLists();
}

function deleteItem(listId, itemId) {
    const list = lists.find(l => l.id === listId);
    list.items = list.items.filter(item => item.id !== itemId);
    localStorage.setItem('shoppingLists', JSON.stringify(lists));
    renderLists();
}

function addToList(listId) {
    currentList = lists.find(list => list.id === listId);
    showAddModal();
}

// Initial render
renderLists();

// Handle notifications
if ('Notification' in window) {
    Notification.requestPermission();
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}

// Helper function to get coordinates from an address using Nominatim API
async function getAddressCoordinates(address) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();
        if (data && data[0]) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        console.warn(`Coordinates not found for address: ${address}`);
        return null;
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return null;
    }
}

// Check for nearby stores and trigger notifications
async function checkNearbyStores(userLat, userLon) {
    let listsUpdated = false;
    for (const list of lists) {
        // Use stored coordinates or fetch them if missing
        const coordinates = list.coordinates || await getAddressCoordinates(list.store);
        if (!coordinates) continue;

        const distance = calculateDistance(
            userLat,
            userLon,
            coordinates.lat,
            coordinates.lon
        );

        // Trigger notification if within radius and not recently notified
        if (distance <= list.radius && !list.notified) {
            if ('Notification' in window && Notification.permission === 'granted') {
                const itemCount = list.items.filter(item => !item.completed).length;
                if (itemCount > 0) {
                    const notification = new Notification('🛍️ Nearby Store Alert!', {
                        body: `You're near ${list.store} (${Math.round(distance)}m away)! You have ${itemCount} items left.`,
                        icon: 'icons/icon-192.svg',
                        tag: `shoppy-list-${list.id}`
                    });
                    list.notified = true;
                    listsUpdated = true;
                    setTimeout(() => {
                        const currentList = lists.find(l => l.id === list.id);
                        if (currentList) {
                            currentList.notified = false;
                            localStorage.setItem('shoppingLists', JSON.stringify(lists));
                        }
                    }, 1800000); // Re-notify after 30 minutes
                }
            } else if ('Notification' in window && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }

    if (listsUpdated) {
        localStorage.setItem('shoppingLists', JSON.stringify(lists));
    }
}

// Start location monitoring
if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(
        position => {
            const { latitude, longitude } = position.coords;
            checkNearbyStores(latitude, longitude);
        },
        error => {
            console.error('Geolocation error:', error.message);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 60000,
            timeout: 10000
        }
    );
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
