import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import locationService from '../services/locationService';
import { getFavoriteStores, addFavoriteStore, deleteFavoriteStore } from '../services/storageService';
import './StoreLocator.css';

// Fix Leaflet icon issue
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Component to recenter map when location changes
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

const StoreLocator = ({ onStoreSelect }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyStores, setNearbyStores] = useState([]);
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  // Get current location on component mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const position = await locationService.getCurrentPosition();
        setCurrentLocation(position);
        setLocationError(null);
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Could not get your location. Please enable location services.');
        // Default location (fallback)
        setCurrentLocation({ lat: 40.7128, lng: -74.0060 }); // New York City
      }
    };

    getLocation();
  }, []);

  // Load favorite stores
  useEffect(() => {
    const loadFavoriteStores = async () => {
      try {
        const stores = await getFavoriteStores();
        setFavoriteStores(stores);
      } catch (error) {
        console.error('Error loading favorite stores:', error);
      }
    };

    loadFavoriteStores();
  }, []);

  // Search for stores
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !currentLocation) return;

    setLoading(true);
    try {
      const stores = await locationService.searchNearbyPlaces(searchQuery, currentLocation, 10);
      setNearbyStores(stores);
    } catch (error) {
      console.error('Error searching for stores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add store to favorites
  const handleAddToFavorites = async (store) => {
    try {
      await addFavoriteStore(store);
      setFavoriteStores([...favoriteStores, store]);
    } catch (error) {
      console.error('Error adding store to favorites:', error);
    }
  };

  // Remove store from favorites
  const handleRemoveFromFavorites = async (storeId) => {
    try {
      await deleteFavoriteStore(storeId);
      setFavoriteStores(favoriteStores.filter(store => store.id !== storeId));
    } catch (error) {
      console.error('Error removing store from favorites:', error);
    }
  };

  // Check if a store is in favorites
  const isStoreFavorite = (storeId) => {
    return favoriteStores.some(store => store.id === storeId);
  };

  return (
    <div className="store-locator">
      <h2>Store Locator</h2>
      
      {locationError && (
        <div className="error-message">{locationError}</div>
      )}
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for stores (e.g., grocery, supermarket)"
          aria-label="Search for stores"
        />
        <button type="submit" disabled={loading || !currentLocation} aria-label="Search">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {currentLocation && (
        <div className="map-container">
          <MapContainer
            center={[currentLocation.lat, currentLocation.lng]}
            zoom={13}
            style={{ height: '300px', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap position={[currentLocation.lat, currentLocation.lng]} />
            
            {/* Current location marker */}
            <Marker position={[currentLocation.lat, currentLocation.lng]}>
              <Popup>Your location</Popup>
            </Marker>
            
            {/* Store markers */}
            {nearbyStores.map(store => (
              <Marker 
                key={store.id} 
                position={[store.location.lat, store.location.lng]}
              >
                <Popup>
                  <div>
                    <h3>{store.name}</h3>
                    <p>{store.address}</p>
                    <p>Distance: {store.distance.toFixed(2)} km</p>
                    <button onClick={() => onStoreSelect(store)}>Select Store</button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
      
      <div className="stores-list">
        <h3>Search Results</h3>
        {loading ? (
          <p>Searching for stores...</p>
        ) : nearbyStores.length === 0 ? (
          <p>No stores found. Try a different search term.</p>
        ) : (
          <ul>
            {nearbyStores.map(store => (
              <li key={store.id} className="store-item">
                <div className="store-info">
                  <h4>{store.name}</h4>
                  <p>{store.address}</p>
                  <p>Distance: {store.distance.toFixed(2)} km</p>
                </div>
                <div className="store-actions">
                  <button 
                    onClick={() => onStoreSelect(store)}
                    className="select-btn"
                    aria-label={`Select ${store.name}`}
                  >
                    Select
                  </button>
                  {isStoreFavorite(store.id) ? (
                    <button 
                      onClick={() => handleRemoveFromFavorites(store.id)}
                      className="unfavorite-btn"
                      aria-label={`Remove ${store.name} from favorites`}
                    >
                      ★ Unfavorite
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAddToFavorites(store)}
                      className="favorite-btn"
                      aria-label={`Add ${store.name} to favorites`}
                    >
                      ☆ Favorite
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        
        <h3>Favorite Stores</h3>
        {favoriteStores.length === 0 ? (
          <p>No favorite stores yet. Search and add stores to your favorites.</p>
        ) : (
          <ul>
            {favoriteStores.map(store => (
              <li key={store.id} className="store-item favorite">
                <div className="store-info">
                  <h4>{store.name}</h4>
                  <p>{store.address}</p>
                </div>
                <div className="store-actions">
                  <button 
                    onClick={() => onStoreSelect(store)}
                    className="select-btn"
                    aria-label={`Select ${store.name}`}
                  >
                    Select
                  </button>
                  <button 
                    onClick={() => handleRemoveFromFavorites(store.id)}
                    className="unfavorite-btn"
                    aria-label={`Remove ${store.name} from favorites`}
                  >
                    ★ Unfavorite
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StoreLocator;
