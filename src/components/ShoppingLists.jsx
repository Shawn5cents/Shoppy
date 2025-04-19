import { useState, useEffect } from 'react';
import { getLists, addList, updateList, deleteList, getDefaultList } from '../services/storageService';
import './ShoppingLists.css';

const ShoppingLists = ({ activeListId, onListSelect, onListCreate, onListDelete }) => {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load lists on component mount
  useEffect(() => {
    const loadLists = async () => {
      try {
        const storedLists = await getLists();
        setLists(storedLists);
        
        // If no active list is selected, select the default list
        if (!activeListId) {
          const defaultList = await getDefaultList();
          if (defaultList) {
            onListSelect(defaultList.id);
          }
        }
      } catch (error) {
        console.error('Error loading shopping lists:', error);
        setError('Failed to load shopping lists');
      } finally {
        setLoading(false);
      }
    };

    loadLists();
  }, [activeListId, onListSelect]);

  // Handle creating a new list
  const handleCreateList = async (e) => {
    e.preventDefault();
    
    if (!newListName.trim()) {
      return;
    }
    
    try {
      const newList = {
        name: newListName.trim(),
        isDefault: lists.length === 0 // Make it default if it's the first list
      };
      
      const id = await addList(newList);
      const createdList = { ...newList, id };
      
      setLists([...lists, createdList]);
      setNewListName('');
      setIsCreating(false);
      
      // Select the new list
      onListSelect(id);
      
      // Notify parent component
      if (onListCreate) {
        onListCreate(createdList);
      }
    } catch (error) {
      console.error('Error creating shopping list:', error);
      setError('Failed to create shopping list');
    }
  };

  // Handle setting a list as default
  const handleSetDefault = async (list) => {
    if (list.isDefault) return; // Already default
    
    try {
      const updatedList = { ...list, isDefault: true };
      await updateList(updatedList);
      
      // Update local state
      setLists(lists.map(l => 
        l.id === list.id ? { ...l, isDefault: true } : { ...l, isDefault: false }
      ));
    } catch (error) {
      console.error('Error setting default list:', error);
      setError('Failed to set default list');
    }
  };

  // Handle deleting a list
  const handleDeleteList = async (id) => {
    if (!window.confirm('Are you sure you want to delete this list? All items in this list will be deleted.')) {
      return;
    }
    
    try {
      await deleteList(id);
      
      // Update local state
      const updatedLists = lists.filter(list => list.id !== id);
      setLists(updatedLists);
      
      // If the active list was deleted, select the default list
      if (id === activeListId) {
        const defaultList = updatedLists.find(list => list.isDefault);
        if (defaultList) {
          onListSelect(defaultList.id);
        }
      }
      
      // Notify parent component
      if (onListDelete) {
        onListDelete(id);
      }
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      setError('Failed to delete shopping list');
    }
  };

  return (
    <div className="shopping-lists">
      <h3>My Lists</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <p>Loading lists...</p>
      ) : (
        <>
          <ul className="lists">
            {lists.map(list => (
              <li 
                key={list.id} 
                className={`list-item ${activeListId === list.id ? 'active' : ''}`}
              >
                <button 
                  className="list-button"
                  onClick={() => onListSelect(list.id)}
                >
                  <span className="list-name">{list.name}</span>
                  {list.isDefault && <span className="default-badge">Default</span>}
                </button>
                <div className="list-actions">
                  {!list.isDefault && (
                    <button 
                      className="set-default-btn"
                      onClick={() => handleSetDefault(list)}
                      title="Set as default list"
                      aria-label="Set as default list"
                    >
                      ★
                    </button>
                  )}
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteList(list.id)}
                    title="Delete list"
                    aria-label="Delete list"
                    disabled={lists.length <= 1} // Can't delete the only list
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          {isCreating ? (
            <form onSubmit={handleCreateList} className="new-list-form">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name"
                autoFocus
              />
              <div className="form-actions">
                <button type="submit" disabled={!newListName.trim()}>Create</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsCreating(false);
                    setNewListName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button 
              className="create-list-btn"
              onClick={() => setIsCreating(true)}
            >
              + New List
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ShoppingLists;
