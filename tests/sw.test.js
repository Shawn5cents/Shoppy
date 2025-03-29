describe('Service Worker', () => {
  let registration;
  
  beforeEach(() => {
    // Mock service worker registration
    registration = {
      scope: '/test-scope/',
      addEventListener: jest.fn()
    };
    
    // Mock service worker functions
    global.navigator.serviceWorker = {
      register: jest.fn().mockResolvedValue(registration),
      addEventListener: jest.fn()
    };
    
    // Mock window load event
    global.window = Object.assign(global.window || {}, {
      addEventListener: jest.fn((event, cb) => {
        if (event === 'load') cb();
      })
    });
    
    // Clear console mocks
    console.log = jest.fn();
    console.error = jest.fn();
  });

  test('should register service worker on load', () => {
    require('../sw.js');
    require('../app.js');
    
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
      './sw.js'
    );
  });

  test('should log successful registration', async () => {
    require('../sw.js');
    require('../app.js');
    
    await navigator.serviceWorker.register();
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('ServiceWorker registration successful'),
      expect.stringContaining('/test-scope/')
    );
  });

  test('should handle registration errors', async () => {
    const error = new Error('Registration failed');
    navigator.serviceWorker.register.mockRejectedValueOnce(error);
    
    require('../sw.js');
    require('../app.js');
    
    try {
      await navigator.serviceWorker.register();
    } catch (e) {
      expect(console.log).toHaveBeenCalledWith(
        'ServiceWorker registration failed: ',
        error
      );
    }
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      // Mock cache API
      global.caches = {
        open: jest.fn().mockResolvedValue({
          addAll: jest.fn(),
          put: jest.fn(),
          match: jest.fn()
        })
      };
      
      // Mock fetch API for cache tests
      global.fetch = jest.fn();
    });

    test('should cache required assets on install', async () => {
      const cacheMock = {
        addAll: jest.fn()
      };
      global.caches.open.mockResolvedValueOnce(cacheMock);
      
      const { install } = require('../sw.js');
      await install();
      
      expect(caches.open).toHaveBeenCalledWith(expect.any(String));
      expect(cacheMock.addAll).toHaveBeenCalledWith(
        expect.arrayContaining([
          '/',
          '/index.html',
          '/app.js',
          '/dist/output.css',
          '/icons/icon-192.svg'
        ])
      );
    });

    test('should use cached responses when offline', async () => {
      const cacheMock = {
        match: jest.fn().mockResolvedValue(new Response('cached data'))
      };
      global.caches.open.mockResolvedValueOnce(cacheMock);
      
      const { fetch: swFetch } = require('../sw.js');
      
      // Simulate offline scenario
      global.fetch.mockRejectedValueOnce(new Error('offline'));
      
      const response = await swFetch(new Request('/test.html'));
      
      expect(cacheMock.match).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    test('should update cache when online', async () => {
      const cacheMock = {
        put: jest.fn()
      };
      global.caches.open.mockResolvedValueOnce(cacheMock);
      
      const { fetch: swFetch } = require('../sw.js');
      
      // Simulate successful network request
      const networkResponse = new Response('fresh data');
      global.fetch.mockResolvedValueOnce(networkResponse.clone());
      
      await swFetch(new Request('/test.html'));
      
      expect(cacheMock.put).toHaveBeenCalledWith(
        expect.any(Request),
        expect.any(Response)
      );
    });
  });

  describe('Push Notifications', () => {
    beforeEach(() => {
      // Mock push notification event
      self.registration = {
        showNotification: jest.fn()
      };
    });

    test('should show notification on push', async () => {
      const { push } = require('../sw.js');
      
      const pushEvent = {
        data: {
          json: () => ({
            title: 'Test Notification',
            body: 'This is a test notification'
          })
        }
      };
      
      await push(pushEvent);
      
      expect(self.registration.showNotification).toHaveBeenCalledWith(
        'Test Notification',
        expect.objectContaining({
          body: 'This is a test notification'
        })
      );
    });

    test('should handle notification click', async () => {
      const { notificationclick } = require('../sw.js');
      
      const clientMock = {
        focus: jest.fn()
      };
      
      self.clients = {
        matchAll: jest.fn().mockResolvedValue([clientMock]),
        openWindow: jest.fn()
      };
      
      const event = {
        notification: {
          data: { url: '/test-url' },
          close: jest.fn()
        }
      };
      
      await notificationclick(event);
      
      expect(event.notification.close).toHaveBeenCalled();
      expect(clientMock.focus).toHaveBeenCalled();
    });
  });
});