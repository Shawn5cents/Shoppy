import { useState, useEffect } from 'react';
import { getReminders, addReminder, updateReminder, deleteReminder } from '../services/storageService';
import notificationService from '../services/notificationService';
import locationService from '../services/locationService';
import './Reminders.css';

const Reminders = ({ items, favoriteStores }) => {
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({
    itemId: '',
    storeId: '',
    type: 'time', // 'time' or 'location'
    time: '',
    message: ''
  });
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [loading, setLoading] = useState(true);
  const [locationWatchId, setLocationWatchId] = useState(null);

  // Load reminders and check notification permission
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load reminders
        const storedReminders = await getReminders();
        setReminders(storedReminders);

        // Check notification permission
        const permission = notificationService.checkPermission();
        setNotificationPermission(permission);

        // If we have location-based reminders and permission is granted, start watching location
        if (permission === 'granted' && storedReminders.some(r => r.type === 'location')) {
          startLocationWatch();
        }
      } catch (error) {
        console.error('Error initializing reminders:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Cleanup location watch on unmount
    return () => {
      if (locationWatchId) {
        locationService.clearWatch(locationWatchId);
      }
    };
  }, []);

  // Start watching location for location-based reminders
  const startLocationWatch = () => {
    if (!locationService.isGeolocationSupported()) {
      console.warn('Geolocation not supported');
      return;
    }

    const watchId = locationService.watchPosition((position) => {
      // Check location-based reminders
      reminders.forEach(reminder => {
        if (reminder.type === 'location' && reminder.storeId) {
          const store = favoriteStores.find(s => s.id === reminder.storeId);
          if (store && store.location) {
            const distance = locationService.calculateDistance(position, store.location);
            // If within 500 meters of the store
            if (distance <= 0.5) {
              const item = items.find(i => i.id === reminder.itemId);
              if (item && !item.completed) {
                notificationService.sendNotification(
                  'Shopping Reminder',
                  {
                    body: reminder.message || `Don't forget to buy ${item.name} at ${store.name}!`,
                    tag: `reminder-${reminder.id}`
                  }
                );
              }
            }
          }
        }
      });
    });

    setLocationWatchId(watchId);
  };

  // Request notification permission
  const requestPermission = async () => {
    try {
      const permission = await notificationService.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted' && reminders.some(r => r.type === 'location')) {
        startLocationWatch();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  // Handle input change for new reminder
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReminder({ ...newReminder, [name]: value });
  };

  // Add a new reminder
  const handleAddReminder = async (e) => {
    e.preventDefault();
    
    if (!newReminder.itemId || (newReminder.type === 'time' && !newReminder.time) || 
        (newReminder.type === 'location' && !newReminder.storeId)) {
      return;
    }

    try {
      const reminderToAdd = { ...newReminder };
      const id = await addReminder(reminderToAdd);
      
      const addedReminder = { ...reminderToAdd, id };
      setReminders([...reminders, addedReminder]);
      
      // Schedule notification for time-based reminder
      if (addedReminder.type === 'time' && notificationPermission === 'granted') {
        const reminderTime = new Date(addedReminder.time).getTime();
        const item = items.find(i => i.id === addedReminder.itemId);
        
        if (item && reminderTime > Date.now()) {
          notificationService.scheduleNotification(
            'Shopping Reminder',
            {
              body: addedReminder.message || `Don't forget to buy ${item.name}!`,
              tag: `reminder-${addedReminder.id}`
            },
            reminderTime
          );
        }
      }
      
      // Reset form
      setNewReminder({
        itemId: '',
        storeId: '',
        type: 'time',
        time: '',
        message: ''
      });
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  // Delete a reminder
  const handleDeleteReminder = async (id) => {
    try {
      await deleteReminder(id);
      setReminders(reminders.filter(reminder => reminder.id !== id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  return (
    <div className="reminders">
      <h2>Reminders</h2>
      
      {notificationPermission !== 'granted' && (
        <div className="notification-permission">
          <p>
            Reminders require notification permission.
            {notificationPermission === 'denied' 
              ? ' Please enable notifications in your browser settings.'
              : ''}
          </p>
          {notificationPermission === 'default' && (
            <button onClick={requestPermission} className="permission-btn">
              Enable Notifications
            </button>
          )}
        </div>
      )}
      
      <form onSubmit={handleAddReminder} className="add-reminder-form">
        <div className="form-group">
          <label htmlFor="itemId">Item:</label>
          <select
            id="itemId"
            name="itemId"
            value={newReminder.itemId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select an item</option>
            {items.filter(item => !item.completed).map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="type">Reminder Type:</label>
          <select
            id="type"
            name="type"
            value={newReminder.type}
            onChange={handleInputChange}
          >
            <option value="time">Time-based</option>
            <option value="location">Location-based</option>
          </select>
        </div>
        
        {newReminder.type === 'time' ? (
          <div className="form-group">
            <label htmlFor="time">Reminder Time:</label>
            <input
              type="datetime-local"
              id="time"
              name="time"
              value={newReminder.time}
              onChange={handleInputChange}
              required={newReminder.type === 'time'}
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="storeId">Store:</label>
            <select
              id="storeId"
              name="storeId"
              value={newReminder.storeId}
              onChange={handleInputChange}
              required={newReminder.type === 'location'}
            >
              <option value="">Select a store</option>
              {favoriteStores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="message">Custom Message (optional):</label>
          <input
            type="text"
            id="message"
            name="message"
            value={newReminder.message}
            onChange={handleInputChange}
            placeholder="Enter a custom reminder message"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={
            !newReminder.itemId || 
            (newReminder.type === 'time' && !newReminder.time) || 
            (newReminder.type === 'location' && !newReminder.storeId) ||
            notificationPermission !== 'granted'
          }
        >
          Add Reminder
        </button>
      </form>
      
      <div className="reminders-list">
        <h3>Your Reminders</h3>
        {loading ? (
          <p>Loading reminders...</p>
        ) : reminders.length === 0 ? (
          <p className="empty-list">No reminders set.</p>
        ) : (
          <ul>
            {reminders.map(reminder => {
              const item = items.find(i => i.id === reminder.itemId);
              const store = favoriteStores.find(s => s.id === reminder.storeId);
              
              return (
                <li key={reminder.id} className="reminder-item">
                  <div className="reminder-info">
                    <h4>{item ? item.name : 'Unknown Item'}</h4>
                    <p>
                      {reminder.type === 'time' 
                        ? `Time: ${new Date(reminder.time).toLocaleString()}`
                        : `Location: ${store ? store.name : 'Unknown Store'}`
                      }
                    </p>
                    {reminder.message && <p>Message: {reminder.message}</p>}
                  </div>
                  <button 
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="delete-btn"
                    aria-label="Delete reminder"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Reminders;
