ROLE_NAMES = {
    "ADMIN": "admin",
    "TURNO_CREV": "turno_crev",
    "TURNO_COC": "turno_coc",
}

DEFAULT_ROLES_CONFIG = [
    {
        "name": ROLE_NAMES["ADMIN"],
        "is_system": True,
        "permissions": [
            {"module": "equipamiento", "actions": ["read", "create", "update", "delete", "export"]},
            {"module": "hechos", "actions": ["read", "create", "update", "delete", "export"]},
            {"module": "camaras", "actions": ["read", "create", "update", "delete", "export"]},
            {"module": "catalogos", "actions": ["read", "create", "update", "delete"]},
            {"module": "documents", "actions": ["read", "create", "update", "delete"]},
            {"module": "utilities", "actions": ["read", "hash"]},
            {"module": "usuarios", "actions": ["read", "create", "update", "delete"]},
            {"module": "roles", "actions": ["read", "create", "update", "delete"]},
            {"module": "registros", "actions": ["read", "create", "update", "delete", "export"]},
        ],
    },
    {
        "name": ROLE_NAMES["TURNO_CREV"],
        "permissions": [
            {"module": "hechos", "actions": ["read", "create", "update"]},
            {"module": "equipamiento", "actions": ["read"]},
        ],
    },
    {
        "name": ROLE_NAMES["TURNO_COC"],
        "permissions": [
            {"module": "camaras", "actions": ["read", "create", "update"]},
            {"module": "equipamiento", "actions": ["read", "create", "update"]},
            {"module": "hechos", "actions": ["read"]},
        ],
    },
]

DEFAULT_CATALOGS = [
    {"name": "Categorias", "code": "CATEGORIAS"},
    {"name": "Ubicaciones", "code": "UBICACIONES"},
    {"name": "Estados Equipo", "code": "ESTADOS_EQUIPO"},
    {"name": "Tipos Camara", "code": "TIPOS_CAMARA"},
    {"name": "Tipos Solicitud", "code": "TIPOS_SOLICITUD"},
    {"name": "Tipos Delito", "code": "TIPOS_DELITO"},
    {"name": "Unidades", "code": "UNIDADES"},
    {"name": "Organismos", "code": "ORGANISMOS"},
]

DEFAULT_CATALOG_ITEMS = {
    "CATEGORIAS": [
        {"name": "Camara IP", "code": "CAT_CAM_IP"},
        {"name": "Servidor VMS", "code": "CAT_VMS"},
        {"name": "Switch PoE", "code": "CAT_SWITCH"},
        {"name": "Almacenamiento", "code": "CAT_STORAGE"},
    ],
    "UBICACIONES": [
        {"name": "Sala de Control", "code": "UB_CTRL"},
        {"name": "Datacenter", "code": "UB_DC"},
        {"name": "Patio Interno", "code": "UB_PATIO"},
        {"name": "Perimetro", "code": "UB_PERIM"},
    ],
    "ESTADOS_EQUIPO": [
        {"name": "Disponible", "code": "EST_DISP"},
        {"name": "En Reparacion", "code": "EST_REP"},
        {"name": "Entregado", "code": "EST_ENT"},
        {"name": "Baja", "code": "EST_BAJA"},
    ],
    "TIPOS_CAMARA": [
        {"name": "Domo", "code": "CAM_DOMO"},
        {"name": "Bullet", "code": "CAM_BULLET"},
        {"name": "PTZ", "code": "CAM_PTZ"},
        {"name": "Ojo de Pez", "code": "CAM_FISHEYE"},
    ],
    "TIPOS_SOLICITUD": [
        {"name": "Judicial", "code": "SOL_JUD"},
        {"name": "Administrativa", "code": "SOL_ADMIN"},
        {"name": "Interna", "code": "SOL_INT"},
    ],
    "TIPOS_DELITO": [
        {"name": "Robo", "code": "DEL_ROBO"},
        {"name": "Daños", "code": "DEL_DANIOS"},
        {"name": "Violencia", "code": "DEL_VIOL"},
    ],
    "UNIDADES": [
        {"name": "CREV Central", "code": "UNI_CREV"},
        {"name": "COC", "code": "UNI_COC"},
        {"name": "Guardia de Prevencion", "code": "UNI_GUARDIA"},
    ],
    "ORGANISMOS": [
        {"name": "Policia", "code": "ORG_POL"},
        {"name": "Fiscalia", "code": "ORG_FISC"},
        {"name": "Juzgado", "code": "ORG_JUZ"},
    ],
}
