import { fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';

describe('Shopping List Management', () => {
  let lists;
  
  beforeEach(() => {
    // Clear localStorage and reset lists
    localStorage.clear();
    localStorage.getItem.mockReturnValue(null);
    lists = [];
    
    // Reset DOM
    document.body.innerHTML = `
      <div id="app">
        <button id="addListBtn">Add List</button>
        <div id="locationModal" class="hidden">
          <input id="storeAddress" value="Test Store">
          <input id="notifyRadius" value="100">
          <button id="saveLocationBtn">Save</button>
        </div>
        <div id="addModal" class="hidden">
          <input id="itemInput" value="">
          <button id="confirmAddBtn">Add Item</button>
        </div>
        <div id="lists"></div>
      </div>
    `;

    // Re-import app.js to reset state
    require('../app.js');
  });

  describe('List Creation', () => {
    test('should show location modal when add list button is clicked', () => {
      const addListBtn = document.getElementById('addListBtn');
      const locationModal = document.getElementById('locationModal');
      
      fireEvent.click(addListBtn);
      
      expect(locationModal).not.toHaveClass('hidden');
    });

    test('should create new list with valid store address', () => {
      const saveLocationBtn = document.getElementById('saveLocationBtn');
      const storeAddress = document.getElementById('storeAddress');
      const notifyRadius = document.getElementById('notifyRadius');
      const listsContainer = document.getElementById('lists');
      
      storeAddress.value = 'Test Store';
      notifyRadius.value = '100';
      
      fireEvent.click(saveLocationBtn);
      
      const savedLists = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedLists).toHaveLength(1);
      expect(savedLists[0]).toMatchObject({
        store: 'Test Store',
        radius: 100,
        items: []
      });
      expect(listsContainer.innerHTML).toContain('Test Store');
    });

    test('should not create list without store address', () => {
      const saveLocationBtn = document.getElementById('saveLocationBtn');
      const storeAddress = document.getElementById('storeAddress');
      
      storeAddress.value = '';
      
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      fireEvent.click(saveLocationBtn);
      
      expect(alertMock).toHaveBeenCalledWith('Please enter a store address');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Item Management', () => {
    beforeEach(() => {
      // Create a test list
      lists.push({
        id: 1,
        store: 'Test Store',
        radius: 100,
        items: []
      });
      localStorage.getItem.mockReturnValue(JSON.stringify(lists));
    });

    test('should add item to list', () => {
      const itemInput = document.getElementById('itemInput');
      const confirmAddBtn = document.getElementById('confirmAddBtn');
      
      itemInput.value = 'Test Item';
      
      fireEvent.click(confirmAddBtn);
      
      const savedLists = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedLists[0].items).toHaveLength(1);
      expect(savedLists[0].items[0]).toMatchObject({
        name: 'Test Item',
        completed: false
      });
    });

    test('should not add empty item', () => {
      const confirmAddBtn = document.getElementById('confirmAddBtn');
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      fireEvent.click(confirmAddBtn);
      
      expect(alertMock).toHaveBeenCalledWith('Please enter an item name');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should toggle item completion status', () => {
      // Add a test item
      lists[0].items.push({
        id: 1,
        name: 'Test Item',
        completed: false
      });
      localStorage.getItem.mockReturnValue(JSON.stringify(lists));
      
      // Re-render lists to update DOM
      require('../app.js').renderLists();
      
      const checkbox = document.querySelector('input[type="checkbox"]');
      
      fireEvent.click(checkbox);
      
      const savedLists = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedLists[0].items[0].completed).toBe(true);
    });

    test('should delete item', () => {
      // Add a test item
      lists[0].items.push({
        id: 1,
        name: 'Test Item',
        completed: false
      });
      localStorage.getItem.mockReturnValue(JSON.stringify(lists));
      
      // Re-render lists to update DOM
      require('../app.js').renderLists();
      
      const deleteBtn = document.querySelector('button[onclick^="deleteItem"]');
      
      fireEvent.click(deleteBtn);
      
      const savedLists = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedLists[0].items).toHaveLength(0);
    });
  });
});