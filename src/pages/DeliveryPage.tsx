import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Equipment } from '../types';
import { getEquipmentByQR } from '../services/equipmentService';
import { createDelivery } from '../services/deliveryService';
import { QRScanner } from '../services/qrService';

export default function DeliveryPage() {
    const navigate = useNavigate();
    const [responsable, setResponsable] = useState('');
    const [notas, setNotas] = useState('');
    const [equipos, setEquipos] = useState<Equipment[]>([]);
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef<QRScanner | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup: detener scanner al desmontar
            if (scannerRef.current) {
                scannerRef.current.stopScanning();
            }
        };
    }, []);

    const handleStartScan = async () => {
        try {
            setScanning(true);
            scannerRef.current = new QRScanner();

            await scannerRef.current.startScanning(
                'qr-reader',
                async (decodedText) => {
                    // Buscar equipo por QR
                    const equipment = await getEquipmentByQR(decodedText);

                    if (equipment) {
                        // Verificar si ya está en la lista
                        if (equipos.find(e => e.id === equipment.id)) {
                            alert('Este equipo ya está en la lista');
                        } else {
                            setEquipos(prev => [...prev, equipment]);
                            alert(`✅ ${equipment.nombre} agregado`);
                        }
                    } else {
                        alert('❌ Equipo no encontrado');
                    }
                },
                (error) => {
                    console.error('Scanner error:', error);
                }
            );
        } catch (error) {
            console.error('Error starting scanner:', error);
            alert('Error al iniciar el escáner. Verifica los permisos de cámara.');
            setScanning(false);
        }
    };

    const handleStopScan = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stopScanning();
            scannerRef.current = null;
        }
        setScanning(false);
    };

    const handleRemoveEquipo = (id: string) => {
        setEquipos(prev => prev.filter(e => e.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!responsable.trim()) {
            alert('Por favor ingresa el nombre del responsable');
            return;
        }

        if (equipos.length === 0) {
            alert('Debes escanear al menos un equipo');
            return;
        }

        try {
            setLoading(true);
            const equipoIds = equipos.map(e => e.id);
            await createDelivery(responsable, equipoIds, notas);
            alert('✅ Entrega registrada exitosamente');
            navigate('/');
        } catch (error) {
            console.error('Error creating delivery:', error);
            alert('Error al registrar la entrega');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Registrar Entrega</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información de la entrega */}
                <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de la Entrega</h2>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="responsable" className="label">
                                Responsable / Área *
                            </label>
                            <input
                                type="text"
                                id="responsable"
                                className="input-field"
                                value={responsable}
                                onChange={(e) => setResponsable(e.target.value)}
                                placeholder="Nombre del responsable o área"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="notas" className="label">
                                Notas (Opcional)
                            </label>
                            <textarea
                                id="notas"
                                className="input-field"
                                rows={3}
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Observaciones adicionales..."
                            />
                        </div>
                    </div>
                </div>

                {/* Escáner QR */}
                <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Escanear Equipos</h2>

                    <div className="mb-4">
                        {!scanning ? (
                            <button
                                type="button"
                                onClick={handleStartScan}
                                className="btn-primary w-full"
                            >
                                📷 Iniciar Escáner
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleStopScan}
                                className="btn-danger w-full"
                            >
                                ⏹️ Detener Escáner
                            </button>
                        )}
                    </div>

                    {/* QR Reader Container */}
                    <div
                        id="qr-reader"
                        className={`${scanning ? 'block' : 'hidden'} w-full rounded-lg overflow-hidden`}
                    />
                </div>

                {/* Lista de equipos escaneados */}
                <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Equipos a Entregar ({equipos.length})
                    </h2>

                    {equipos.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">
                            No hay equipos escaneados. Usa el escáner para agregar equipos.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {equipos.map((eq) => (
                                <div
                                    key={eq.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="text-2xl">✅</div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{eq.nombre}</p>
                                            <p className="text-sm text-gray-600">
                                                {eq.marca} {eq.modelo} - Serie: {eq.numeroSerie}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveEquipo(eq.id)}
                                        className="text-red-600 hover:text-red-800 font-semibold"
                                    >
                                        ✕ Quitar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading || equipos.length === 0}
                        className="btn-primary flex-1"
                    >
                        {loading ? 'Guardando...' : '✅ Registrar Entrega'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="btn-secondary flex-1"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}
