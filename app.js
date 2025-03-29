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

// Event Listeners
addListBtn.addEventListener('click', () => showLocationModal());

// Location Modal Events
useCurrentLocationBtn.addEventListener('click', getCurrentLocation);
enterAddressBtn.addEventListener('click', () => {
    addressInput.classList.remove('hidden');
});
notifyRadiusInput.addEventListener('input', (e) => {
    radiusValue.textContent = e.target.value;
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
}

function hideLocationModal() {
    locationModal.classList.add('hidden');
    addressInput.classList.add('hidden');
    storeAddressInput.value = '';
}

function getCurrentLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                reverseGeocode(latitude, longitude);
            },
            error => {
                alert('Error getting location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await response.json();
        storeAddressInput.value = data.display_name;
        addressInput.classList.remove('hidden');
    } catch (error) {
        alert('Error getting address: ' + error.message);
    }
}

function saveLocation() {
    const address = storeAddressInput.value;
    const radius = parseInt(notifyRadiusInput.value);
    
    if (!address) {
        alert('Please enter a store address');
        return;
    }

    const newList = {
        id: Date.now(),
        store: address,
        radius,
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
        recognition.continuous = false; // Only capture a single utterance
        recognition.interimResults = true; // Show results as they come in

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
            // Display interim results with placeholder styling
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
            // Reset button state on error
            voiceInputBtn.innerHTML = originalButtonText;
            voiceInputBtn.disabled = false;
            voiceInputBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            itemInput.placeholder = '📝 Enter item name';
        };

        recognition.onend = () => {
            // Reset button state when recognition ends
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
            // Reset button state if start fails
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
        // Create a canvas to process the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Scale image if too large
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
            
            // For demo purposes, simulate OCR with a timeout
            // In production, this would use Tesseract.js or a similar OCR library
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
        // Fetch coordinates if missing
        if (!list.coordinates && list.store) {
            const coords = await getAddressCoordinates(list.store);
            if (coords) {
                list.coordinates = coords;
                listsUpdated = true;
            } else {
                // Skip this list if coordinates can't be found
                continue;
            }
        }

        // Check distance if coordinates are available
        if (list.coordinates) {
            const distance = calculateDistance(
                userLat,
                userLon,
                list.coordinates.lat,
                list.coordinates.lon
            );

            // Trigger notification if within radius and not recently notified
            if (distance <= list.radius && !list.notified) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    const itemCount = list.items.filter(item => !item.completed).length;
                    if (itemCount > 0) {
                        const notification = new Notification('🛍️ Nearby Store Alert!', {
                            body: `You're near ${list.store} (${Math.round(distance)}m away)! You have ${itemCount} items left.`,
                            icon: 'icons/icon-192.svg',
                            tag: `shoppy-list-${list.id}` // Use tag to prevent duplicate notifications
                        });
                        list.notified = true;
                        listsUpdated = true;
                        // Set a timeout to allow re-notification after 30 minutes
                        setTimeout(() => {
                            const currentList = lists.find(l => l.id === list.id);
                            if (currentList) {
                                currentList.notified = false;
                                localStorage.setItem('shoppingLists', JSON.stringify(lists));
                            }
                        }, 1800000);
                    }
                } else if ('Notification' in window && Notification.permission !== 'denied') {
                    // Request permission if not granted or denied
                    Notification.requestPermission();
                }
            } else if (distance > list.radius && list.notified) {
                // Reset notified status if user moves out of range (optional)
                // list.notified = false;
                // listsUpdated = true;
            }
        }
    }
    // Save updated lists to local storage if changes were made
    if (listsUpdated) {
        localStorage.setItem('shoppingLists', JSON.stringify(lists));
    }
}

// Start location monitoring with improved options and error handling
if ('geolocation' in navigator) {
    const watchId = navigator.geolocation.watchPosition(
        position => {
            const { latitude, longitude } = position.coords;
            checkNearbyStores(latitude, longitude);
        },
        error => {
            console.error('Geolocation error:', error.message);
            // Optionally inform the user about the error
            // alert(`Geolocation error: ${error.message}`);
        },
        {
            enableHighAccuracy: true, // Request more accurate position
            maximumAge: 60000,       // Use cached position up to 1 minute old
            timeout: 10000           // Wait up to 10 seconds for position
        }
    );
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}