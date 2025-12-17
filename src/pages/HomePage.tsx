import { Link } from 'react-router-dom';

export default function HomePage() {
    return (
        <div className="px-2 py-3 sm:px-4 sm:py-4">
            <div className="text-center mb-3 sm:mb-4">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                    Gestión de Equipamiento
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                    Gestiona con códigos QR
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {/* Card: Equipos */}
                <Link to="/equipos" className="card hover:shadow-lg transition-shadow">
                    <div className="text-center">
                        <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">📋</div>
                        <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">
                            Equipos
                        </h2>
                        <p className="text-xs text-gray-600 hidden sm:block">
                            Lista completa
                        </p>
                    </div>
                </Link>

                {/* Card: Nuevo Equipo */}
                <Link to="/nuevo-equipo" className="card hover:shadow-lg transition-shadow">
                    <div className="text-center">
                        <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">➕</div>
                        <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">
                            Nuevo
                        </h2>
                        <p className="text-xs text-gray-600 hidden sm:block">
                            Dar de alta
                        </p>
                    </div>
                </Link>

                {/* Card: Entrega */}
                <Link to="/entrega" className="card hover:shadow-lg transition-shadow">
                    <div className="text-center">
                        <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">📤</div>
                        <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">
                            Entrega
                        </h2>
                        <p className="text-xs text-gray-600 hidden sm:block">
                            Registrar entrega
                        </p>
                    </div>
                </Link>

                {/* Card: Recepción */}
                <Link to="/recepcion" className="card hover:shadow-lg transition-shadow">
                    <div className="text-center">
                        <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">📥</div>
                        <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">
                            Recepción
                        </h2>
                        <p className="text-xs text-gray-600 hidden sm:block">
                            Verificar recepción
                        </p>
                    </div>
                </Link>
            </div>

            {/* Features Section */}
            <div className="mt-4 sm:mt-6 card">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 text-center">
                    Características
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl mb-1">🔍</div>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5">QR</h4>
                        <p className="text-xs text-gray-600 hidden sm:block">
                            Genera y escanea QR
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl mb-1">📱</div>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5">Cámara</h4>
                        <p className="text-xs text-gray-600 hidden sm:block">
                            Escaneo con cámara
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl mb-1">✅</div>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5">Control</h4>
                        <p className="text-xs text-gray-600 hidden sm:block">
                            Verifica entregas
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
