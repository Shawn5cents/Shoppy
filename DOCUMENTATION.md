# Shoppy - Technical Documentation

## 1. Overview

Shoppy is a Progressive Web App (PWA) for managing shopping lists with store locator and reminders. It is built with React and uses IndexedDB for local storage, ensuring all data stays on the user's device.

## 2. Architecture

### 2.1 Component Structure

- **App.jsx**: Main application component, handles routing between tabs
- **Header.jsx**: App header with navigation tabs and install button
- **ShoppingList.jsx**: Shopping list management
- **ShoppingLists.jsx**: Multiple lists management (create, select, delete lists)
- **StoreLocator.jsx**: Store search and map display
- **Reminders.jsx**: Time and location-based reminders

### 2.2 Services

- **storageService.js**: IndexedDB operations for data persistence
- **locationService.js**: Geolocation and store search functionality
- **notificationService.js**: Browser notifications for reminders

### 2.3 Data Flow

1. User interactions trigger state changes in React components
2. State changes trigger storage operations via service functions
3. Data is persisted to IndexedDB
4. Components re-render based on updated state

## 3. Key Features

### 3.1 Shopping List Management

- Add, edit, delete shopping items
- Mark items as complete
- Filter items by store
- Create and manage multiple shopping lists
- Move items between lists

### 3.2 Store Locator

- Search for stores using OpenStreetMap's Nominatim API
- Display stores on an interactive map using Leaflet
- Save favorite stores for quick access

### 3.3 Reminders

- Create time-based reminders for shopping items
- Create location-based reminders that trigger when near a store
- Receive browser notifications for reminders

### 3.4 PWA Features

- Service worker for offline functionality
- App manifest for installability
- Push notifications for reminders

## 4. Data Storage

All data is stored locally using IndexedDB with the following stores:

- **shoppingLists**: Multiple shopping lists
- **shoppingItems**: Shopping list items (with listId to associate with a list)
- **favoriteStores**: Saved store locations
- **reminders**: Time and location-based reminders
- **settings**: App settings

## 5. APIs Used

- **Geolocation API**: For getting user's current location
- **Notifications API**: For displaying reminders
- **OpenStreetMap Nominatim API**: For store search
- **IndexedDB**: For local data storage

## 6. Performance Considerations

- Lazy loading of components for faster initial load
- Service worker caching for offline functionality
- Optimized map rendering with Leaflet

## 7. Security and Privacy

- All data stays on the user's device
- No external servers or APIs used for data storage
- Permissions requested only when needed (location, notifications)

## 8. Future Enhancements

- Sharing shopping lists via QR codes
- Barcode scanning for adding items
- Voice input for adding items
- Enhanced offline map caching
- Categories and tags for items
- List sorting and filtering options

## 9. Known Limitations

- Location-based reminders require the app to be open in the background
- Notification support varies by browser
- OpenStreetMap API has usage limits
- Limited offline map functionality

## 10. Troubleshooting

- **Notifications not working**: Check browser permissions
- **Location not updating**: Ensure location permissions are granted
- **Map not loading**: Check internet connection
- **Data not saving**: Check browser storage settings
