import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delivery, Equipment } from '../types';
import { getPendingDeliveries, createReception, validateReception } from '../services/deliveryService';
import { getEquipmentById, getEquipmentByQR } from '../services/equipmentService';
import { QRScanner } from '../services/qrService';

export default function ReceptionPage() {
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    const [deliveredEquipment, setDeliveredEquipment] = useState<Equipment[]>([]);
    const [receivedEquipment, setReceivedEquipment] = useState<Equipment[]>([]);
    const [observaciones, setObservaciones] = useState('');
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingDeliveries, setLoadingDeliveries] = useState(true);
    const scannerRef = useRef<QRScanner | null>(null);

    useEffect(() => {
        loadPendingDeliveries();
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stopScanning();
            }
        };
    }, []);

    const loadPendingDeliveries = async () => {
        try {
            setLoadingDeliveries(true);
            const pending = await getPendingDeliveries();
            setDeliveries(pending);
        } catch (error) {
            console.error('Error loading deliveries:', error);
            alert('Error al cargar las entregas pendientes');
        } finally {
            setLoadingDeliveries(false);
        }
    };

    const handleSelectDelivery = async (delivery: Delivery) => {
        setSelectedDelivery(delivery);
        setReceivedEquipment([]);

        // Cargar información de los equipos entregados
        try {
            const equipmentPromises = delivery.equipos.map(id => getEquipmentById(id));
            const equipment = await Promise.all(equipmentPromises);
            setDeliveredEquipment(equipment.filter(e => e !== null) as Equipment[]);
        } catch (error) {
            console.error('Error loading equipment:', error);
            alert('Error al cargar los equipos');
        }
    };

    const handleStartScan = async () => {
        if (!selectedDelivery) {
            alert('Primero selecciona una entrega');
            return;
        }

        try {
            setScanning(true);
            scannerRef.current = new QRScanner();

            await scannerRef.current.startScanning(
                'qr-reader',
                async (decodedText) => {
                    const equipment = await getEquipmentByQR(decodedText);

                    if (equipment) {
                        // Verificar si el equipo está en la entrega
                        if (!selectedDelivery.equipos.includes(equipment.id)) {
                            alert('⚠️ Este equipo NO está en la entrega seleccionada');
                            return;
                        }

                        // Verificar si ya fue escaneado
                        if (receivedEquipment.find(e => e.id === equipment.id)) {
                            alert('Este equipo ya fue escaneado');
                        } else {
                            setReceivedEquipment(prev => [...prev, equipment]);
                            alert(`✅ ${equipment.nombre} recibido`);
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
            alert('Error al iniciar el escáner');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDelivery) {
            alert('Selecciona una entrega');
            return;
        }

        const receivedIds = receivedEquipment.map(e => e.id);
        const validation = validateReception(selectedDelivery.equipos, receivedIds);

        if (!validation.isValid) {
            const confirmMsg = `⚠️ ATENCIÓN: Faltan ${validation.missing.length} equipo(s).\n\n¿Deseas continuar de todos modos?`;
            if (!window.confirm(confirmMsg)) {
                return;
            }
        }

        try {
            setLoading(true);
            await createReception(
                selectedDelivery.id,
                receivedIds,
                validation.missing,
                observaciones
            );
            alert('✅ Recepción registrada exitosamente');
            navigate('/');
        } catch (error) {
            console.error('Error creating reception:', error);
            alert('Error al registrar la recepción');
        } finally {
            setLoading(false);
        }
    };

    const isEquipmentReceived = (equipmentId: string) => {
        return receivedEquipment.some(e => e.id === equipmentId);
    };

    if (loadingDeliveries) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl text-gray-600">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="px-4 py-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Registrar Recepción</h1>

            {deliveries.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-600 text-lg mb-4">No hay entregas pendientes de recepción</p>
                    <button onClick={() => navigate('/')} className="btn-primary">
                        Volver al inicio
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seleccionar entrega */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seleccionar Entrega</h2>
                        <div className="space-y-3">
                            {deliveries.map((delivery) => (
                                <button
                                    key={delivery.id}
                                    type="button"
                                    onClick={() => handleSelectDelivery(delivery)}
                                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedDelivery?.id === delivery.id
                                            ? 'border-primary-600 bg-primary-50'
                                            : 'border-gray-200 hover:border-primary-300'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                Responsable: {delivery.responsable}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Fecha: {delivery.fecha.toLocaleDateString()} - {delivery.equipos.length} equipo(s)
                                            </p>
                                            {delivery.notas && (
                                                <p className="text-sm text-gray-500 mt-1">Notas: {delivery.notas}</p>
                                            )}
                                        </div>
                                        {selectedDelivery?.id === delivery.id && (
                                            <span className="text-primary-600 font-semibold">✓ Seleccionado</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedDelivery && (
                        <>
                            {/* Equipos entregados */}
                            <div className="card">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Equipos Entregados ({deliveredEquipment.length})
                                </h2>
                                <div className="space-y-2">
                                    {deliveredEquipment.map((eq) => (
                                        <div
                                            key={eq.id}
                                            className={`flex items-center justify-between p-3 rounded-lg ${isEquipmentReceived(eq.id)
                                                    ? 'bg-green-50 border border-green-200'
                                                    : 'bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="text-2xl">
                                                    {isEquipmentReceived(eq.id) ? '✅' : '⏳'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{eq.nombre}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {eq.marca} {eq.modelo} - Serie: {eq.numeroSerie}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-semibold ${isEquipmentReceived(eq.id) ? 'text-green-600' : 'text-gray-500'
                                                }`}>
                                                {isEquipmentReceived(eq.id) ? 'Recibido' : 'Pendiente'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Escáner QR */}
                            <div className="card">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Escanear Equipos Recibidos</h2>

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

                                <div
                                    id="qr-reader"
                                    className={`${scanning ? 'block' : 'hidden'} w-full rounded-lg overflow-hidden`}
                                />

                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        ℹ️ Progreso: {receivedEquipment.length} de {deliveredEquipment.length} equipos escaneados
                                    </p>
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div className="card">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Observaciones</h2>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    placeholder="Notas sobre la recepción, equipos faltantes, daños, etc..."
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading || receivedEquipment.length === 0}
                                    className="btn-primary flex-1"
                                >
                                    {loading ? 'Guardando...' : '✅ Registrar Recepción'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </>
                    )}
                </form>
            )}
        </div>
    );
}
