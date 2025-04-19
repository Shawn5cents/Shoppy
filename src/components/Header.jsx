import { useState, useEffect } from 'react';
import './Header.css';

const Header = ({ activeTab, onTabChange }) => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show the install button
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      // Hide the install button
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Clean up event listeners
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <header className="header">
      <div className="logo">
        <h1>Shoppy</h1>
      </div>
      
      <nav className="tabs">
        <button 
          className={activeTab === 'shopping-list' ? 'active' : ''}
          onClick={() => onTabChange('shopping-list')}
        >
          Shopping List
        </button>
        <button 
          className={activeTab === 'stores' ? 'active' : ''}
          onClick={() => onTabChange('stores')}
        >
          Stores
        </button>
        <button 
          className={activeTab === 'reminders' ? 'active' : ''}
          onClick={() => onTabChange('reminders')}
        >
          Reminders
        </button>
      </nav>
      
      {isInstallable && (
        <button className="install-btn" onClick={handleInstallClick}>
          Install App
        </button>
      )}
    </header>
  );
};

export default Header;
