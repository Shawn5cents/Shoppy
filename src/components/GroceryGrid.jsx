import { useState, useEffect } from 'react';
import { getItems, addItem, updateItem, deleteItem } from '../services/storageService';
import CreateListButton from './CreateListButton';
import './GroceryGrid.css';

// Icons for common grocery items
const groceryIcons = {
  avocado: '/icons/avocado.svg',
  bananas: '/icons/bananas.svg',
  cabbage: '/icons/cabbage.svg',
  carrots: '/icons/carrots.svg',
  cucumber: '/icons/cucumber.svg',
  cheese: '/icons/cheese.svg',
  'cottage cheese': '/icons/cottage-cheese.svg',
  eggs: '/icons/eggs.svg',
  milk: '/icons/milk.svg',
  bread: '/icons/bread.svg',
  apples: '/icons/apples.svg',
  chicken: '/icons/chicken.svg',
  beef: '/icons/beef.svg',
  fish: '/icons/fish.svg',
  rice: '/icons/rice.svg',
  pasta: '/icons/pasta.svg',
  cereal: '/icons/cereal.svg',
  yogurt: '/icons/yogurt.svg',
  butter: '/icons/butter.svg',
  tomatoes: '/icons/tomatoes.svg',
  potatoes: '/icons/potatoes.svg',
  onions: '/icons/onions.svg',
  garlic: '/icons/garlic.svg',
  // Household items
  'laundry soap': '/icons/laundry-soap.svg',
  'dish soap': '/icons/dish-soap.svg',
  'dishwasher tabs': '/icons/dishwasher-tabs.svg',
  'toilet paper': '/icons/toilet-paper.svg',
  wipes: '/icons/wipes.svg',
  'paper towels': '/icons/paper-towels.svg',
  shampoo: '/icons/shampoo.svg',
  toothpaste: '/icons/toothpaste.svg',
  'trash bags': '/icons/trash-bags.svg',
  coffee: '/icons/coffee.svg',
  default: '/icons/grocery.svg'
};

const GroceryGrid = ({ activeListId, selectedStore }) => {
  const [items, setItems] = useState([]);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);

  // Load items when activeListId changes
  useEffect(() => {
    const loadItems = async () => {
      if (!activeListId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const storedItems = await getItems(activeListId);
        setItems(storedItems);

        // Get recently used items (last 6 items added)
        const sortedByDate = [...storedItems].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Get unique items by name
        const uniqueRecent = [];
        const uniqueNames = new Set();

        for (const item of sortedByDate) {
          if (!uniqueNames.has(item.name.toLowerCase())) {
            uniqueNames.add(item.name.toLowerCase());
            uniqueRecent.push(item);
            if (uniqueRecent.length >= 6) break;
          }
        }

        setRecentlyUsed(uniqueRecent);
      } catch (error) {
        console.error('Error loading items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [activeListId]);

  // Get icon for an item
  const getItemIcon = (itemName) => {
    const name = itemName.toLowerCase();

    // Check if we have an exact match
    if (groceryIcons[name]) {
      return groceryIcons[name];
    }

    // Check if the item name contains any of our icon keys
    for (const [key, icon] of Object.entries(groceryIcons)) {
      if (name.includes(key) && key !== 'default') {
        return icon;
      }
    }

    // Generate a color based on the item name for consistent icons
    const generateColorFromString = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 70%, 60%)`;
    };

    // Create a data URL for a colored circle with the first letter
    const color = generateColorFromString(name);
    const letter = name.charAt(0).toUpperCase();
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="${color}" />
        <circle cx="24" cy="24" r="18" fill="${color}" stroke="white" stroke-width="1" />
        <text x="24" y="30" font-family="Arial" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${letter}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Toggle item completion
  const handleToggleComplete = async (item) => {
    try {
      const updatedItem = { ...item, completed: !item.completed };
      await updateItem(updatedItem);
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  // Add a new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeListId) return;

    try {
      const newItem = {
        name: newItemName.trim(),
        completed: false,
        storeId: selectedStore?.id || null,
        listId: activeListId
      };

      const id = await addItem(newItem);
      const itemWithId = { ...newItem, id, createdAt: new Date().toISOString() };

      setItems([...items, itemWithId]);

      // Update recently used items
      const updatedRecent = [itemWithId, ...recentlyUsed.filter(item =>
        item.name.toLowerCase() !== newItem.name.toLowerCase()
      )].slice(0, 6);

      setRecentlyUsed(updatedRecent);
      setNewItemName('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  // Add a recently used item
  const handleAddRecentItem = async (recentItem) => {
    if (!activeListId) return;

    try {
      const newItem = {
        name: recentItem.name,
        completed: false,
        storeId: selectedStore?.id || null,
        listId: activeListId
      };

      const id = await addItem(newItem);
      setItems([...items, { ...newItem, id, createdAt: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error adding recent item:', error);
    }
  };

  // Filter items by store if a store is selected
  const filteredItems = selectedStore
    ? items.filter(item => item.storeId === selectedStore.id)
    : items;

  return (
    <div className="grocery-grid-container">
      {!activeListId ? (
        <div className="empty-list">
          <p>Please select or create a shopping list to view items.</p>
          <CreateListButton onListCreated={(id) => window.location.reload()} />
        </div>
      ) : loading ? (
        <p>Loading items...</p>
      ) : (
        <>
          {filteredItems.length === 0 ? (
            <p className="empty-list">No items in your list{selectedStore ? ' for this store' : ''}.</p>
          ) : (
            <>
              <div className="grocery-grid">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className={`grocery-item ${item.completed ? 'completed' : ''}`}
                    onClick={() => handleToggleComplete(item)}
                  >
                    <img
                      src={getItemIcon(item.name)}
                      alt={item.name}
                      className="grocery-icon"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = groceryIcons.default;
                      }}
                    />
                    <p className="grocery-name">{item.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {recentlyUsed.length > 0 && (
            <div className="recently-used">
              <h3 className="section-title">Recently Used</h3>
              <div className="grocery-grid">
                {recentlyUsed.map(item => (
                  <div
                    key={`recent-${item.id}`}
                    className="grocery-item"
                    onClick={() => handleAddRecentItem(item)}
                  >
                    <img
                      src={getItemIcon(item.name)}
                      alt={item.name}
                      className="grocery-icon"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = groceryIcons.default;
                      }}
                    />
                    <p className="grocery-name">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="add-item-button"
            onClick={() => setShowAddModal(true)}
            aria-label="Add item"
          >
            +
          </button>

          {showAddModal && (
            <div className="add-item-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title">Add New Item</h2>
                  <button
                    className="close-button"
                    onClick={() => setShowAddModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleAddItem} className="item-form">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Enter item name"
                    aria-label="Item name"
                    autoFocus
                  />
                  <button type="submit" disabled={!newItemName.trim()}>
                    Add Item
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GroceryGrid;
