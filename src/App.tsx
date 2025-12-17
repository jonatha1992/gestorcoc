import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EquipmentListPage from './pages/EquipmentListPage';
import EquipmentFormPage from './pages/EquipmentFormPage';
import DeliveryPage from './pages/DeliveryPage';
import ReceptionPage from './pages/ReceptionPage';
import './style.css';

function App() {
    return (
        <Router>
            <div className="min-h-screen">
                {/* Navigation */}
                <nav className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-2 sm:px-4">
                        <div className="flex justify-between h-12 sm:h-14">
                            <div className="flex space-x-2 sm:space-x-4 overflow-x-auto">
                                <Link
                                    to="/"
                                    className="inline-flex items-center px-1 pt-1 text-sm sm:text-base font-semibold text-gray-900 hover:text-primary-600 transition-colors whitespace-nowrap"
                                >
                                    📦 Equipamiento
                                </Link>
                                <Link
                                    to="/equipos"
                                    className="inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap"
                                >
                                    Equipos
                                </Link>
                                <Link
                                    to="/nuevo-equipo"
                                    className="inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap"
                                >
                                    Nuevo
                                </Link>
                                <Link
                                    to="/entrega"
                                    className="inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap"
                                >
                                    Entrega
                                </Link>
                                <Link
                                    to="/recepcion"
                                    className="inline-flex items-center px-1 pt-1 text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap"
                                >
                                    Recepción
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto py-2 px-2 sm:py-4 sm:px-4">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/equipos" element={<EquipmentListPage />} />
                        <Route path="/nuevo-equipo" element={<EquipmentFormPage />} />
                        <Route path="/editar-equipo/:id" element={<EquipmentFormPage />} />
                        <Route path="/entrega" element={<DeliveryPage />} />
                        <Route path="/recepcion" element={<ReceptionPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
