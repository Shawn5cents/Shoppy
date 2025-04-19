import { useState, useEffect } from 'react'
import { registerSW } from 'virtual:pwa-register'
import Header from './components/Header'
import GroceryGrid from './components/GroceryGrid'
import ListManager from './components/ListManager'
import StoreLocator from './components/StoreLocator'
import Reminders from './components/Reminders'
import { getItems, getFavoriteStores, getLists, getDefaultList, addList } from './services/storageService'
import './App.css'

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

function App() {
  const [activeTab, setActiveTab] = useState('shopping-list')
  const [selectedStore, setSelectedStore] = useState(null)
  const [favoriteStores, setFavoriteStores] = useState([])
  const [shoppingItems, setShoppingItems] = useState([])
  const [lists, setLists] = useState([])
  const [activeListId, setActiveListId] = useState(null)

  // Load lists, favorite stores on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load shopping lists
        let allLists = await getLists()

        // Create a default list if none exists
        if (allLists.length === 0) {
          await addList({ name: 'My Shopping List', isDefault: true })
          allLists = await getLists() // Reload lists after creating default
        }

        setLists(allLists)

        // Set active list to default list
        if (allLists.length > 0) {
          const defaultList = await getDefaultList()
          if (defaultList) {
            setActiveListId(defaultList.id)
          } else if (allLists[0]) {
            setActiveListId(allLists[0].id)
          }
        }

        // Load favorite stores
        const stores = await getFavoriteStores()
        setFavoriteStores(stores)
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    loadData()
  }, [])

  // Update shopping items when active tab changes to reminders
  useEffect(() => {
    if (activeTab === 'reminders') {
      const loadItems = async () => {
        try {
          const items = await getItems()
          setShoppingItems(items)
        } catch (error) {
          console.error('Error loading items:', error)
        }
      }

      loadItems()
    }
  }, [activeTab])

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  // Handle list change
  const handleListChange = (listId) => {
    setActiveListId(listId)
  }

  // Handle store selection
  const handleStoreSelect = (store) => {
    setSelectedStore(store)
    setActiveTab('shopping-list') // Switch to shopping list when store is selected
  }

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {activeTab === 'shopping-list' && (
        <ListManager
          lists={lists}
          activeListId={activeListId}
          onListChange={handleListChange}
          onListsUpdate={setLists}
        />
      )}

      <main className="content">
        {activeTab === 'shopping-list' && (
          <GroceryGrid
            activeListId={activeListId}
            selectedStore={selectedStore}
          />
        )}

        {activeTab === 'stores' && (
          <StoreLocator
            onStoreSelect={handleStoreSelect}
            onStoresUpdate={(stores) => setFavoriteStores(stores)}
          />
        )}

        {activeTab === 'reminders' && (
          <Reminders
            items={shoppingItems}
            favoriteStores={favoriteStores}
          />
        )}
      </main>
    </div>
  )
}

export default App
