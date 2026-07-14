import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { FiHome, FiPlusSquare, FiList } from 'react-icons/fi';
import HomePage from './pages/HomePage';
import PropertyDetail from './pages/PropertyDetail';
import AdminPage from './pages/AdminPage';
import PropertyForm from './pages/PropertyForm';
import ImportPage from './pages/ImportPage';

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
                <FiHome className="text-2xl" />
                BĐS
              </Link>
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Trang chủ
                </Link>
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isAdmin
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Quản lý
                </Link>
              </div>
            </div>
            <div className="flex sm:hidden items-center gap-2">
              <Link to="/" className={`p-2 rounded ${location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}>
                <FiHome size={20} />
              </Link>
              <Link to="/admin" className={`p-2 rounded ${isAdmin ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}>
                <FiList size={20} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/add" element={<PropertyForm />} />
        <Route path="/admin/edit/:id" element={<PropertyForm />} />
        <Route path="/admin/import" element={<ImportPage />} />
      </Routes>
    </div>
  );
}

export default App;
