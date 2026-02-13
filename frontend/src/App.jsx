import { useState } from 'react'
import './index.css'
import 'leaflet/dist/leaflet.css'
import {
  LayoutDashboard,
  Map,
  Upload,
  BarChart3,
  FileText,
  Settings,
  Satellite,
  Shield,
} from 'lucide-react'
import Dashboard from './components/Dashboard'
import AnalyzePage from './components/AnalyzePage'
import PlotsPage from './components/PlotsPage'
import ReportsPage from './components/ReportsPage'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analyze', label: 'Analyze Images', icon: Satellite },
  { id: 'plots', label: 'Plot Registry', icon: Map },
  { id: 'reports', label: 'Reports', icon: FileText },
]

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />
      case 'analyze': return <AnalyzePage />
      case 'plots': return <PlotsPage />
      case 'reports': return <ReportsPage />
      default: return <Dashboard onNavigate={setActivePage} />
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Shield size={22} />
            </div>
            <div>
              <h1>LandWatch</h1>
              <p>CSIDC Monitoring</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          CSIDC Land Monitoring System v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
