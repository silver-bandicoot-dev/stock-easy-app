import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import DashboardView from './views/DashboardView'
import './index.css'

// Mock data pour tester
const mockProducts = [
  { 
    id: 1, 
    name: 'Product 1', 
    stock: 100, 
    salesPerDay: 5, 
    price: 29.99,
    isDeepOverstock: false 
  },
  { 
    id: 2, 
    name: 'Product 2', 
    stock: 0, 
    salesPerDay: 10, 
    price: 49.99,
    isDeepOverstock: false 
  },
  { 
    id: 3, 
    name: 'Product 3', 
    stock: 500, 
    salesPerDay: 2, 
    price: 19.99,
    isDeepOverstock: true 
  },
];

const TestApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          notificationsCount={3}
          onNotificationsClick={() => alert('Notifications clicked')}
        />
        
        <div className="flex">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          
          <main className="flex-1 lg:ml-0">
            {activeTab === 'dashboard' && (
              <DashboardView products={mockProducts} loading={false} />
            )}
            {activeTab !== 'dashboard' && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Vue {activeTab} - À implémenter
                </h2>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)
