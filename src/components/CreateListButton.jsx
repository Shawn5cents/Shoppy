import { useState } from 'react';
import { addList } from '../services/storageService';
import './CreateListButton.css';

const CreateListButton = ({ onListCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [listName, setListName] = useState('');

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!listName.trim()) return;

    try {
      const newList = {
        name: listName.trim(),
        isDefault: true // Make it default since it's the first list
      };

      const id = await addList(newList);
      
      // Reset form
      setListName('');
      setShowModal(false);
      
      // Notify parent
      if (onListCreated) {
        onListCreated(id);
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  return (
    <>
      <button 
        className="create-list-button"
        onClick={() => setShowModal(true)}
      >
        <span className="icon">+</span>
        <span className="text">Create Your First List</span>
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New List</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="close-btn"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateList}>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="List name"
                autoFocus
              />
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                  disabled={!listName.trim()}
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateListButton;
