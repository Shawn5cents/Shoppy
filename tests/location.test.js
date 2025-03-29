import '@testing-library/jest-dom';

describe('Location Features', () => {
  let lists;
  
  beforeEach(() => {
    // Clear localStorage and reset lists
    localStorage.clear();
    localStorage.getItem.mockReturnValue(null);
    lists = [];
    
    // Reset fetch mock
    fetch.mockReset();
    
    // Reset notification mock
    Notification.requestPermission.mockReset();
    
    // Reset geolocation mock
    navigator.geolocation.getCurrentPosition.mockReset();
    navigator.geolocation.watchPosition.mockReset();
  });

  describe('Geocoding', () => {
    test('should get coordinates from address', async () => {
      const mockResponse = [{
        lat: '40.7128',
        lon: '-74.0060',
        display_name: 'New York, NY'
      }];
      
      fetch.mockResolvedValueOnce({
        json: async () => mockResponse
      });
      
      const { getAddressCoordinates } = require('../app.js');
      const coords = await getAddressCoordinates('New York');
      
      expect(coords).toEqual({
        lat: 40.7128,
        lon: -74.0060
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('nominatim.openstreetmap.org/search')
      );
    });

    test('should handle geocoding errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const { getAddressCoordinates } = require('../app.js');
      const coords = await getAddressCoordinates('Invalid Address');
      
      expect(coords).toBeNull();
    });
  });

  describe('Distance Calculation', () => {
    test('should calculate distance between coordinates', () => {
      const { calculateDistance } = require('../app.js');
      
      // Test with known coordinates and distance
      // NYC to LA (approximately 3936km)
      const distance = calculateDistance(
        40.7128, -74.0060, // NYC
        34.0522, -118.2437 // LA
      );
      
      expect(Math.round(distance / 1000)).toBe(3936); // Convert to km and round
    });
  });

  describe('Location Monitoring', () => {
    beforeEach(() => {
      // Create a test list with coordinates
      lists.push({
        id: 1,
        store: 'Test Store',
        radius: 100,
        coordinates: {
          lat: 40.7128,
          lon: -74.0060
        },
        items: [{ id: 1, name: 'Test Item', completed: false }]
      });
      localStorage.getItem.mockReturnValue(JSON.stringify(lists));
    });

    test('should trigger notification when user is within radius', async () => {
      const { checkNearbyStores } = require('../app.js');
      
      // Position user 50 meters from store
      await checkNearbyStores(40.7129, -74.0061);
      
      expect(Notification).toHaveBeenCalledWith(
        '🛍️ Nearby Store Alert!',
        expect.objectContaining({
          body: expect.stringContaining('Test Store')
        })
      );
    });

    test('should not trigger notification when user is outside radius', async () => {
      const { checkNearbyStores } = require('../app.js');
      
      // Position user 1km from store
      await checkNearbyStores(40.7218, -74.0160);
      
      expect(Notification).not.toHaveBeenCalled();
    });

    test('should request notification permission if not granted', () => {
      // Set notification permission to 'default'
      Object.defineProperty(Notification, 'permission', {
        value: 'default',
        writable: true
      });
      
      require('../app.js');
      
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('Geolocation', () => {
    test('should handle successful geolocation', () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      };
      
      navigator.geolocation.getCurrentPosition.mockImplementation(
        successCallback => successCallback(mockPosition)
      );
      
      const { getCurrentLocation } = require('../app.js');
      getCurrentLocation();
      
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    test('should handle geolocation errors', () => {
      const mockError = {
        code: 1,
        message: 'User denied geolocation'
      };
      
      navigator.geolocation.getCurrentPosition.mockImplementation(
        (successCallback, errorCallback) => errorCallback(mockError)
      );
      
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      const { getCurrentLocation } = require('../app.js');
      getCurrentLocation();
      
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Error getting location')
      );
    });

    test('should watch position changes', () => {
      require('../app.js');
      
      expect(navigator.geolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 10000
        })
      );
    });
  });
});