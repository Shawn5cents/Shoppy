import { useState } from 'react';
import { addList, updateList, deleteList } from '../services/storageService';
import './ListManager.css';

const ListManager = ({ lists, activeListId, onListChange, onListsUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState(null);

  // Add a new list
  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const newList = {
        name: newListName.trim(),
        isDefault: lists.length === 0 // Make default if it's the first list
      };

      const id = await addList(newList);
      const updatedLists = [...lists, { ...newList, id }];
      onListsUpdate(updatedLists);
      
      // Select the new list
      onListChange(id);
      
      // Reset form
      setNewListName('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding list:', error);
    }
  };

  // Edit a list
  const handleEditList = async (e) => {
    e.preventDefault();
    if (!editingList || !newListName.trim()) return;

    try {
      const updatedList = {
        ...editingList,
        name: newListName.trim()
      };

      await updateList(updatedList);
      const updatedLists = lists.map(list => 
        list.id === editingList.id ? updatedList : list
      );
      
      onListsUpdate(updatedLists);
      
      // Reset form
      setNewListName('');
      setEditingList(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  // Delete a list
  const handleDeleteList = async (listId) => {
    if (!listId) return;
    
    try {
      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this list? All items in this list will be deleted.')) {
        return;
      }
      
      await deleteList(listId);
      const updatedLists = lists.filter(list => list.id !== listId);
      onListsUpdate(updatedLists);
      
      // If the active list was deleted, select another list
      if (listId === activeListId && updatedLists.length > 0) {
        const defaultList = updatedLists.find(list => list.isDefault);
        onListChange(defaultList ? defaultList.id : updatedLists[0].id);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert(error.message);
    }
  };

  // Set a list as default
  const handleSetDefault = async (listId) => {
    if (!listId) return;
    
    try {
      const list = lists.find(l => l.id === listId);
      if (!list) return;
      
      const updatedList = { ...list, isDefault: true };
      await updateList(updatedList);
      
      const updatedLists = lists.map(l => 
        l.id === listId ? updatedList : { ...l, isDefault: false }
      );
      
      onListsUpdate(updatedLists);
    } catch (error) {
      console.error('Error setting default list:', error);
    }
  };

  // Open edit modal
  const openEditModal = (list) => {
    setEditingList(list);
    setNewListName(list.name);
    setShowEditModal(true);
  };

  return (
    <div className="list-manager">
      <div className="list-manager-header">
        <h2>My Lists</h2>
        <button 
          className="add-list-btn"
          onClick={() => setShowAddModal(true)}
          aria-label="Add new list"
        >
          +
        </button>
      </div>

      <div className="lists-container">
        {lists.length === 0 ? (
          <p className="empty-lists">No lists yet. Create one to get started!</p>
        ) : (
          <ul className="lists">
            {lists.map(list => (
              <li 
                key={list.id} 
                className={`list-item ${activeListId === list.id ? 'active' : ''}`}
              >
                <div 
                  className="list-name"
                  onClick={() => onListChange(list.id)}
                >
                  {list.name}
                  {list.isDefault && <span className="default-badge">Default</span>}
                </div>
                <div className="list-actions">
                  {!list.isDefault && (
                    <button 
                      onClick={() => handleSetDefault(list.id)}
                      className="default-btn"
                      aria-label="Set as default"
                      title="Set as default"
                    >
                      ★
                    </button>
                  )}
                  <button 
                    onClick={() => openEditModal(list)}
                    className="edit-btn"
                    aria-label="Edit list"
                    title="Edit list"
                  >
                    ✎
                  </button>
                  <button 
                    onClick={() => handleDeleteList(list.id)}
                    className="delete-btn"
                    aria-label="Delete list"
                    title="Delete list"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add List Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New List</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="close-btn"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddList}>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name"
                autoFocus
              />
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                  disabled={!newListName.trim()}
                >
                  Add List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit List</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="close-btn"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditList}>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name"
                autoFocus
              />
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                  disabled={!newListName.trim()}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListManager;
