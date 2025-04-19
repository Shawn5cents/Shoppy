// Check if geolocation is supported
const isGeolocationSupported = () => {
  return 'geolocation' in navigator;
};

// Get current position
const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// Watch position (for location-based reminders)
const watchPosition = (callback) => {
  if (!isGeolocationSupported()) {
    throw new Error('Geolocation not supported');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (error) => {
      console.error('Error watching position:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
};

// Clear watch
const clearWatch = (watchId) => {
  if (!isGeolocationSupported()) {
    return;
  }

  navigator.geolocation.clearWatch(watchId);
};

// Calculate distance between two points in kilometers (Haversine formula)
const calculateDistance = (point1, point2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Search for nearby places using OpenStreetMap's Nominatim API
const searchNearbyPlaces = async (query, location, radius = 5) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=10&lat=${location.lat}&lon=${location.lng}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch places');
    }
    
    const places = await response.json();
    
    // Filter places by distance and add distance property
    return places
      .map(place => ({
        id: place.place_id,
        name: place.display_name.split(',')[0],
        address: place.display_name,
        location: {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        },
        distance: calculateDistance(location, {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        })
      }))
      .filter(place => place.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

export default {
  isGeolocationSupported,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  calculateDistance,
  searchNearbyPlaces
};
