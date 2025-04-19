import { useState, useEffect } from 'react'
import { registerSW } from 'virtual:pwa-register'
import Header from './components/Header'
import ShoppingList from './components/ShoppingList'
import StoreLocator from './components/StoreLocator'
import Reminders from './components/Reminders'
import { getItems, getFavoriteStores } from './services/storageService'
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

  // Load favorite stores on component mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        const stores = await getFavoriteStores()
        setFavoriteStores(stores)
      } catch (error) {
        console.error('Error loading stores:', error)
      }
    }

    loadStores()
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

      <main className="content">
        {activeTab === 'shopping-list' && (
          <ShoppingList
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
