import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EquipmentFormData } from '../types';
import { createEquipment, getEquipmentById, updateEquipment } from '../services/equipmentService';

export default function EquipmentFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const [formData, setFormData] = useState<EquipmentFormData>({
        nombre: '',
        categoria: 'Cámara',
        numeroSerie: '',
        marca: '',
        modelo: '',
        estado: 'Disponible',
        descripcion: '',
    });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(isEditing);

    useEffect(() => {
        if (isEditing && id) {
            loadEquipment(id);
        }
    }, [id, isEditing]);

    const loadEquipment = async (equipmentId: string) => {
        try {
            setLoadingData(true);
            const equipment = await getEquipmentById(equipmentId);
            if (equipment) {
                setFormData({
                    nombre: equipment.nombre,
                    categoria: equipment.categoria,
                    numeroSerie: equipment.numeroSerie,
                    marca: equipment.marca,
                    modelo: equipment.modelo,
                    estado: equipment.estado,
                    descripcion: equipment.descripcion || '',
                });
            } else {
                alert('Equipo no encontrado');
                navigate('/equipos');
            }
        } catch (error) {
            console.error('Error loading equipment:', error);
            alert('Error al cargar el equipo');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre || !formData.numeroSerie || !formData.marca || !formData.modelo) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }

        try {
            setLoading(true);
            if (isEditing && id) {
                await updateEquipment(id, formData);
                alert('Equipo actualizado exitosamente');
            } else {
                await createEquipment(formData);
                alert('Equipo creado exitosamente con código QR');
            }
            navigate('/equipos');
        } catch (error) {
            console.error('Error saving equipment:', error);
            alert('Error al guardar el equipo');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loadingData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl text-gray-600">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="px-4 py-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
            </h1>

            <form onSubmit={handleSubmit} className="card">
                <div className="space-y-6">
                    {/* Nombre */}
                    <div>
                        <label htmlFor="nombre" className="label">
                            Nombre / Tipo de Equipo *
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            className="input-field"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Cámara Sony A7 III"
                            required
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label htmlFor="categoria" className="label">
                            Categoría *
                        </label>
                        <select
                            id="categoria"
                            name="categoria"
                            className="input-field"
                            value={formData.categoria}
                            onChange={handleChange}
                            required
                        >
                            <option value="Cámara">Cámara</option>
                            <option value="Iluminación">Iluminación</option>
                            <option value="Audio">Audio</option>
                            <option value="Accesorios">Accesorios</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>

                    {/* Número de Serie */}
                    <div>
                        <label htmlFor="numeroSerie" className="label">
                            Número de Serie *
                        </label>
                        <input
                            type="text"
                            id="numeroSerie"
                            name="numeroSerie"
                            className="input-field"
                            value={formData.numeroSerie}
                            onChange={handleChange}
                            placeholder="Ej: SN123456789"
                            required
                        />
                    </div>

                    {/* Marca */}
                    <div>
                        <label htmlFor="marca" className="label">
                            Marca *
                        </label>
                        <input
                            type="text"
                            id="marca"
                            name="marca"
                            className="input-field"
                            value={formData.marca}
                            onChange={handleChange}
                            placeholder="Ej: Sony"
                            required
                        />
                    </div>

                    {/* Modelo */}
                    <div>
                        <label htmlFor="modelo" className="label">
                            Modelo *
                        </label>
                        <input
                            type="text"
                            id="modelo"
                            name="modelo"
                            className="input-field"
                            value={formData.modelo}
                            onChange={handleChange}
                            placeholder="Ej: A7 III"
                            required
                        />
                    </div>

                    {/* Estado */}
                    <div>
                        <label htmlFor="estado" className="label">
                            Estado *
                        </label>
                        <select
                            id="estado"
                            name="estado"
                            className="input-field"
                            value={formData.estado}
                            onChange={handleChange}
                            required
                        >
                            <option value="Disponible">Disponible</option>
                            <option value="En uso">En uso</option>
                            <option value="En mantenimiento">En mantenimiento</option>
                            <option value="Dado de baja">Dado de baja</option>
                        </select>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label htmlFor="descripcion" className="label">
                            Descripción (Opcional)
                        </label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            className="input-field"
                            rows={3}
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Información adicional sobre el equipo..."
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear y Generar QR'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/equipos')}
                            className="btn-secondary flex-1"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </form>

            {!isEditing && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        ℹ️ Al crear el equipo, se generará automáticamente un código QR único que podrás imprimir.
                    </p>
                </div>
            )}
        </div>
    );
}
