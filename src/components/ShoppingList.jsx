import { useState, useEffect } from 'react';
import { getItems, addItem, updateItem, deleteItem, moveItemToList, getList, getLists } from '../services/storageService';
import ShoppingLists from './ShoppingLists';
import './ShoppingList.css';

const ShoppingList = ({ selectedStore }) => {
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeListId, setActiveListId] = useState(null);
  const [activeListName, setActiveListName] = useState('');
  const [moveItemId, setMoveItemId] = useState(null); // For moving items between lists
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetListId, setTargetListId] = useState(null);
  const [availableLists, setAvailableLists] = useState([]);

  // Load items from storage when activeListId changes
  useEffect(() => {
    const loadItems = async () => {
      if (!activeListId) return;

      setLoading(true);
      try {
        const storedItems = await getItems(activeListId);
        setItems(storedItems);

        // Get list name
        const list = await getList(activeListId);
        if (list) {
          setActiveListName(list.name);
        }
      } catch (error) {
        console.error('Error loading items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [activeListId]);

  // Load available lists for move dialog
  useEffect(() => {
    const loadLists = async () => {
      try {
        const lists = await getLists();
        setAvailableLists(lists);
      } catch (error) {
        console.error('Error loading lists for move dialog:', error);
      }
    };

    if (showMoveDialog) {
      loadLists();
    }
  }, [showMoveDialog]);

  // Add a new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim() || !activeListId) return;

    try {
      const newItem = {
        name: newItemText.trim(),
        completed: false,
        storeId: selectedStore?.id || null,
        listId: activeListId
      };

      const id = await addItem(newItem);
      setItems([...items, { ...newItem, id }]);
      setNewItemText('');
    } catch (error) {
      console.error('Error adding item:', error);
    }
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

  // Delete an item
  const handleDeleteItem = async (id) => {
    try {
      await deleteItem(id);
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Assign item to selected store
  const handleAssignToStore = async (item) => {
    if (!selectedStore) return;

    try {
      const updatedItem = { ...item, storeId: selectedStore.id };
      await updateItem(updatedItem);
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    } catch (error) {
      console.error('Error assigning item to store:', error);
    }
  };

  // Handle moving an item to another list
  const handleMoveItem = async (itemId, targetListId) => {
    if (!itemId || !targetListId) return;

    try {
      await moveItemToList(itemId, targetListId);

      // Remove the item from the current list's items
      setItems(items.filter(item => item.id !== itemId));
      setShowMoveDialog(false);
      setMoveItemId(null);
      setTargetListId(null);
    } catch (error) {
      console.error('Error moving item to another list:', error);
    }
  };

  // Handle list selection
  const handleListSelect = (listId) => {
    setActiveListId(listId);
  };

  // Handle list creation
  const handleListCreate = (list) => {
    // The list is already created in the storage service
    // Just update the active list ID
    setActiveListId(list.id);
  };

  // Handle list deletion
  const handleListDelete = (listId) => {
    // The items are already deleted in the storage service
    // Just make sure we're not still showing them
    if (activeListId === listId) {
      setItems([]);
    }
  };

  // Open move dialog
  const openMoveDialog = (itemId) => {
    setMoveItemId(itemId);
    setShowMoveDialog(true);
  };

  // Filter items by store if a store is selected
  const filteredItems = selectedStore
    ? items.filter(item => item.storeId === selectedStore.id)
    : items;

  return (
    <div className="shopping-list-container">
      <div className="lists-sidebar">
        <ShoppingLists
          activeListId={activeListId}
          onListSelect={handleListSelect}
          onListCreate={handleListCreate}
          onListDelete={handleListDelete}
        />
      </div>

      <div className="shopping-list">
        <h2>{activeListName || 'Shopping List'} {selectedStore && `for ${selectedStore.name}`}</h2>

        {activeListId && (
          <form onSubmit={handleAddItem} className="add-item-form">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add a new item..."
              aria-label="New item name"
            />
            <button type="submit" aria-label="Add item">Add</button>
          </form>
        )}

        {!activeListId ? (
          <p className="empty-list">Please select or create a shopping list</p>
        ) : loading ? (
          <p>Loading items...</p>
        ) : filteredItems.length === 0 ? (
          <p className="empty-list">No items in your list{selectedStore ? ' for this store' : ''}.</p>
        ) : (
          <ul className="items-list">
            {filteredItems.map(item => (
              <li key={item.id} className={`item ${item.completed ? 'completed' : ''}`}>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleComplete(item)}
                  />
                  <span className="checkmark"></span>
                </label>
                <span className="item-name">{item.name}</span>
                <div className="item-actions">
                  {selectedStore && !item.storeId && (
                    <button
                      onClick={() => handleAssignToStore(item)}
                      className="assign-btn"
                      aria-label={`Assign to ${selectedStore.name}`}
                    >
                      Assign
                    </button>
                  )}
                  <button
                    onClick={() => openMoveDialog(item.id)}
                    className="move-btn"
                    aria-label="Move to another list"
                  >
                    Move
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="delete-btn"
                    aria-label="Delete item"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Move Item Dialog */}
        {showMoveDialog && (
          <div className="move-dialog-overlay">
            <div className="move-dialog">
              <h3>Move Item to Another List</h3>
              <p>Select a destination list:</p>

              <ul className="move-lists">
                {availableLists
                  .filter(list => list.id !== activeListId)
                  .map(list => (
                    <li key={list.id}>
                      <button
                        onClick={() => handleMoveItem(moveItemId, list.id)}
                        className="move-list-btn"
                      >
                        {list.name}
                      </button>
                    </li>
                  ))
                }
              </ul>

              <div className="dialog-actions">
                <button
                  onClick={() => setShowMoveDialog(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
