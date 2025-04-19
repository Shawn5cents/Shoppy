import { openDB } from 'idb';

const DB_NAME = 'shoppy-db';
const DB_VERSION = 2; // Increased version for schema update
const STORES = {
  SHOPPING_LISTS: 'shoppingLists',
  SHOPPING_ITEMS: 'shoppingItems',
  FAVORITE_STORES: 'favoriteStores',
  REMINDERS: 'reminders',
  SETTINGS: 'settings'
};

// Initialize the database
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.SHOPPING_LISTS)) {
        const listsStore = db.createObjectStore(STORES.SHOPPING_LISTS, { keyPath: 'id', autoIncrement: true });
        listsStore.createIndex('name', 'name', { unique: false });
        listsStore.createIndex('isDefault', 'isDefault', { unique: false });

        // Create a default shopping list
        const listsStore2 = transaction.objectStore(STORES.SHOPPING_LISTS);
        listsStore2.add({
          name: 'My Shopping List',
          isDefault: true,
          createdAt: new Date().toISOString()
        });
      }

      if (!db.objectStoreNames.contains(STORES.SHOPPING_ITEMS)) {
        const itemsStore = db.createObjectStore(STORES.SHOPPING_ITEMS, { keyPath: 'id', autoIncrement: true });
        itemsStore.createIndex('completed', 'completed', { unique: false });
        itemsStore.createIndex('storeId', 'storeId', { unique: false });
        itemsStore.createIndex('listId', 'listId', { unique: false }); // Add index for list ID
      } else if (oldVersion === 1 && newVersion === 2) {
        // Add listId index to existing items store if upgrading from v1 to v2
        const itemsStore = transaction.objectStore(STORES.SHOPPING_ITEMS);
        if (!itemsStore.indexNames.contains('listId')) {
          itemsStore.createIndex('listId', 'listId', { unique: false });

          // Get the default list ID
          const listsStore = transaction.objectStore(STORES.SHOPPING_LISTS);
          const defaultList = await listsStore.index('isDefault').get(true);
          const defaultListId = defaultList ? defaultList.id : 1;

          // Update all existing items to belong to the default list
          const items = await itemsStore.getAll();
          for (const item of items) {
            itemsStore.put({ ...item, listId: defaultListId });
          }
        }
      }

      if (!db.objectStoreNames.contains(STORES.FAVORITE_STORES)) {
        db.createObjectStore(STORES.FAVORITE_STORES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.REMINDERS)) {
        const remindersStore = db.createObjectStore(STORES.REMINDERS, { keyPath: 'id', autoIncrement: true });
        remindersStore.createIndex('itemId', 'itemId', { unique: false });
        remindersStore.createIndex('storeId', 'storeId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
    }
  });
};

// Shopping Lists CRUD operations
export const getLists = async () => {
  const db = await initDB();
  return db.getAll(STORES.SHOPPING_LISTS);
};

export const getList = async (id) => {
  const db = await initDB();
  return db.get(STORES.SHOPPING_LISTS, id);
};

export const getDefaultList = async () => {
  const db = await initDB();
  try {
    // Use getAllFromIndex and find the first one that is default
    const lists = await db.getAllFromIndex(STORES.SHOPPING_LISTS, 'isDefault');
    return lists.find(list => list.isDefault === true);
  } catch (error) {
    console.error('Error getting default list:', error);
    // Fallback: get all lists and find the default one
    const allLists = await db.getAll(STORES.SHOPPING_LISTS);
    return allLists.find(list => list.isDefault === true);
  }
};

export const addList = async (list) => {
  const db = await initDB();
  // If this is the first list or marked as default, ensure it's the only default
  if (list.isDefault) {
    const tx = db.transaction(STORES.SHOPPING_LISTS, 'readwrite');
    const store = tx.objectStore(STORES.SHOPPING_LISTS);
    const existingLists = await store.index('isDefault').getAll(true);

    for (const existingList of existingLists) {
      await store.put({ ...existingList, isDefault: false });
    }

    const id = await store.add({
      ...list,
      createdAt: new Date().toISOString()
    });

    await tx.done;
    return id;
  } else {
    return db.add(STORES.SHOPPING_LISTS, {
      ...list,
      createdAt: new Date().toISOString()
    });
  }
};

export const updateList = async (list) => {
  const db = await initDB();

  // If setting this list as default, update other lists
  if (list.isDefault) {
    const tx = db.transaction(STORES.SHOPPING_LISTS, 'readwrite');
    const store = tx.objectStore(STORES.SHOPPING_LISTS);
    const existingLists = await store.index('isDefault').getAll(true);

    for (const existingList of existingLists) {
      if (existingList.id !== list.id) {
        await store.put({ ...existingList, isDefault: false });
      }
    }

    await store.put({
      ...list,
      updatedAt: new Date().toISOString()
    });

    await tx.done;
    return list.id;
  } else {
    return db.put(STORES.SHOPPING_LISTS, {
      ...list,
      updatedAt: new Date().toISOString()
    });
  }
};

export const deleteList = async (id) => {
  const db = await initDB();
  const tx = db.transaction([STORES.SHOPPING_LISTS, STORES.SHOPPING_ITEMS], 'readwrite');

  // Check if this is the default list
  const list = await tx.objectStore(STORES.SHOPPING_LISTS).get(id);
  if (list && list.isDefault) {
    // Can't delete the default list if it's the only list
    const allLists = await tx.objectStore(STORES.SHOPPING_LISTS).getAll();
    if (allLists.length <= 1) {
      throw new Error("Cannot delete the only shopping list");
    }

    // Make another list the default
    const newDefault = allLists.find(l => l.id !== id);
    if (newDefault) {
      await tx.objectStore(STORES.SHOPPING_LISTS).put({
        ...newDefault,
        isDefault: true,
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Delete all items in this list
  const itemsStore = tx.objectStore(STORES.SHOPPING_ITEMS);
  const items = await itemsStore.index('listId').getAll(id);
  for (const item of items) {
    await itemsStore.delete(item.id);
  }

  // Delete the list itself
  await tx.objectStore(STORES.SHOPPING_LISTS).delete(id);

  await tx.done;
  return id;
};

// Shopping Items CRUD operations
export const getItems = async (listId = null) => {
  const db = await initDB();

  if (listId) {
    return db.getAllFromIndex(STORES.SHOPPING_ITEMS, 'listId', listId);
  } else {
    // If no listId provided, get the default list's items
    const defaultList = await getDefaultList();
    if (defaultList) {
      return db.getAllFromIndex(STORES.SHOPPING_ITEMS, 'listId', defaultList.id);
    }
    return [];
  }
};

export const addItem = async (item) => {
  const db = await initDB();

  // If no listId provided, use the default list
  if (!item.listId) {
    const defaultList = await getDefaultList();
    if (defaultList) {
      item.listId = defaultList.id;
    } else {
      // Create a default list if none exists
      const listId = await addList({ name: 'My Shopping List', isDefault: true });
      item.listId = listId;
    }
  }

  return db.add(STORES.SHOPPING_ITEMS, {
    ...item,
    completed: item.completed || false,
    createdAt: new Date().toISOString()
  });
};

export const updateItem = async (item) => {
  const db = await initDB();
  return db.put(STORES.SHOPPING_ITEMS, {
    ...item,
    updatedAt: new Date().toISOString()
  });
};

export const deleteItem = async (id) => {
  const db = await initDB();
  return db.delete(STORES.SHOPPING_ITEMS, id);
};

export const moveItemToList = async (itemId, newListId) => {
  const db = await initDB();
  const tx = db.transaction(STORES.SHOPPING_ITEMS, 'readwrite');
  const store = tx.objectStore(STORES.SHOPPING_ITEMS);

  const item = await store.get(itemId);
  if (item) {
    await store.put({
      ...item,
      listId: newListId,
      updatedAt: new Date().toISOString()
    });
  }

  await tx.done;
  return itemId;
};

// Favorite Stores CRUD operations
export const getFavoriteStores = async () => {
  const db = await initDB();
  return db.getAll(STORES.FAVORITE_STORES);
};

export const addFavoriteStore = async (store) => {
  const db = await initDB();
  return db.put(STORES.FAVORITE_STORES, {
    ...store,
    addedAt: new Date().toISOString()
  });
};

export const deleteFavoriteStore = async (id) => {
  const db = await initDB();
  return db.delete(STORES.FAVORITE_STORES, id);
};

// Reminders CRUD operations
export const getReminders = async () => {
  const db = await initDB();
  return db.getAll(STORES.REMINDERS);
};

export const addReminder = async (reminder) => {
  const db = await initDB();
  return db.add(STORES.REMINDERS, {
    ...reminder,
    createdAt: new Date().toISOString()
  });
};

export const updateReminder = async (reminder) => {
  const db = await initDB();
  return db.put(STORES.REMINDERS, {
    ...reminder,
    updatedAt: new Date().toISOString()
  });
};

export const deleteReminder = async (id) => {
  const db = await initDB();
  return db.delete(STORES.REMINDERS, id);
};

// Settings operations
export const getSetting = async (id) => {
  const db = await initDB();
  return db.get(STORES.SETTINGS, id);
};

export const saveSetting = async (setting) => {
  const db = await initDB();
  return db.put(STORES.SETTINGS, setting);
};

// Export constants
export { STORES };
