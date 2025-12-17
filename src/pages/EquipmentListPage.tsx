import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Equipment, EquipmentCategory, EquipmentStatus } from '../types';
import { getAllEquipment, deleteEquipment } from '../services/equipmentService';
import { generateQRPDF } from '../services/qrService';

export default function EquipmentListPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<{
        categoria?: EquipmentCategory;
        estado?: EquipmentStatus;
        search?: string;
    }>({});

    useEffect(() => {
        loadEquipment();
    }, []);

    const loadEquipment = async () => {
        try {
            setLoading(true);
            const data = await getAllEquipment();
            setEquipment(data);
        } catch (error) {
            console.error('Error loading equipment:', error);
            alert('Error al cargar el equipamiento');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, nombre: string) => {
        if (window.confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
            try {
                await deleteEquipment(id);
                alert('Equipo eliminado exitosamente');
                loadEquipment();
            } catch (error) {
                console.error('Error deleting equipment:', error);
                alert('Error al eliminar el equipo');
            }
        }
    };

    const handlePrintQR = async (eq: Equipment) => {
        try {
            await generateQRPDF(eq.nombre, eq.id, eq.qrCode);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF');
        }
    };

    const filteredEquipment = equipment.filter(eq => {
        if (filter.categoria && eq.categoria !== filter.categoria) return false;
        if (filter.estado && eq.estado !== filter.estado) return false;
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            return (
                eq.nombre.toLowerCase().includes(searchLower) ||
                eq.numeroSerie.toLowerCase().includes(searchLower) ||
                eq.marca.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl text-gray-600">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Equipamiento</h1>
                <Link to="/nuevo-equipo" className="btn-primary">
                    ➕ Nuevo Equipo
                </Link>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label">Buscar</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Nombre, serie, marca..."
                            value={filter.search || ''}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Categoría</label>
                        <select
                            className="input-field"
                            value={filter.categoria || ''}
                            onChange={(e) => setFilter({ ...filter, categoria: e.target.value as EquipmentCategory || undefined })}
                        >
                            <option value="">Todas</option>
                            <option value="Cámara">Cámara</option>
                            <option value="Iluminación">Iluminación</option>
                            <option value="Audio">Audio</option>
                            <option value="Accesorios">Accesorios</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Estado</label>
                        <select
                            className="input-field"
                            value={filter.estado || ''}
                            onChange={(e) => setFilter({ ...filter, estado: e.target.value as EquipmentStatus || undefined })}
                        >
                            <option value="">Todos</option>
                            <option value="Disponible">Disponible</option>
                            <option value="En uso">En uso</option>
                            <option value="En mantenimiento">En mantenimiento</option>
                            <option value="Dado de baja">Dado de baja</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Equipment List */}
            {filteredEquipment.length === 0 ? (
                <div className="card text-center py-8">
                    <p className="text-gray-600 text-sm">No hay equipamiento registrado</p>
                    <Link to="/nuevo-equipo" className="btn-primary mt-3 inline-block">
                        Agregar primer equipo
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredEquipment.map((eq) => (
                        <div key={eq.id} className="card hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* QR Code - Left */}
                                <div className="flex-shrink-0">
                                    <img src={eq.qrCode} alt="QR" className="w-16 h-16 sm:w-20 sm:h-20" />
                                </div>

                                {/* Info - Center */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{eq.nombre}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${eq.estado === 'Disponible' ? 'bg-green-100 text-green-800' :
                                                eq.estado === 'En uso' ? 'bg-blue-100 text-blue-800' :
                                                    eq.estado === 'En mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                                            {eq.estado}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-1">{eq.categoria}</p>
                                    <div className="text-xs text-gray-700 space-y-0.5">
                                        <p><span className="font-medium">Marca:</span> {eq.marca} | <span className="font-medium">Modelo:</span> {eq.modelo}</p>
                                        <p><span className="font-medium">Serie:</span> {eq.numeroSerie}</p>
                                    </div>
                                </div>

                                {/* Actions - Right */}
                                <div className="flex-shrink-0 flex flex-col gap-1">
                                    <button
                                        onClick={() => handlePrintQR(eq)}
                                        className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition-colors whitespace-nowrap"
                                        title="Imprimir QR"
                                    >
                                        🖨️ QR
                                    </button>
                                    <Link
                                        to={`/editar-equipo/${eq.id}`}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors text-center whitespace-nowrap"
                                        title="Editar"
                                    >
                                        ✏️ Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(eq.id, eq.nombre)}
                                        className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors whitespace-nowrap"
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
