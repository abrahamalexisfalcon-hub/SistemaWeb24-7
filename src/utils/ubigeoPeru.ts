export interface Distrito {
  nombre: string;
}

export interface Provincia {
  nombre: string;
  distritos: string[];
}

export interface Departamento {
  nombre: string;
  provincias: Provincia[];
}

export const UBIGEO_PERU: Departamento[] = [
  {
    nombre: 'Lima',
    provincias: [
      {
        nombre: 'Lima',
        distritos: [
          'Ancón',
          'Ate',
          'Barranco',
          'Breña',
          'Carabayllo',
          'Chaclacayo',
          'Chorrillos',
          'Cieneguilla',
          'Comas',
          'El Agustino',
          'Independencia',
          'Jesús María',
          'La Molina',
          'La Victoria',
          'Lima (Cercado)',
          'Lince',
          'Los Olivos',
          'Lurigancho-Chosica',
          'Lurín',
          'Magdalena del Mar',
          'Miraflores',
          'Pachacámac',
          'Pucusana',
          'Pueblo Libre',
          'Puente Piedra',
          'Punta Hermosa',
          'Punta Negra',
          'Rímac',
          'San Bartolo',
          'San Borja',
          'San Isidro',
          'San Juan de Lurigancho',
          'San Juan de Miraflores',
          'San Luis',
          'San Martín de Porres',
          'San Miguel',
          'Santa Anita',
          'Santa María del Mar',
          'Santa Rosa',
          'Santiago de Surco',
          'Surquillo',
          'Villa El Salvador',
          'Villa María del Triunfo',
        ],
      },
      {
        nombre: 'Barranca',
        distritos: ['Barranca', 'Paramonga', 'Pativilca', 'Supe', 'Supe Puerto'],
      },
      {
        nombre: 'Cañete',
        distritos: [
          'San Vicente de Cañete',
          'Asia',
          'Cerro Azul',
          'Chilca',
          'Imperial',
          'Lunahuaná',
          'Mala',
          'Nuevo Imperial',
          'Quilmaná',
          'San Antonio',
          'San Luis',
          'Santa Cruz de Flores',
        ],
      },
      {
        nombre: 'Huaral',
        distritos: ['Huaral', 'Aucallama', 'Chancay'],
      },
      {
        nombre: 'Huarochirí',
        distritos: ['Matucana', 'Ricardo Palma', 'San Antonio', 'Santa Eulalia'],
      },
      {
        nombre: 'Huaura',
        distritos: ['Huacho', 'Hualmay', 'Santa María', 'Carquín', 'Sayán', 'Végueta'],
      },
      {
        nombre: 'Canta',
        distritos: ['Canta', 'Santa Rosa de Quives'],
      },
      {
        nombre: 'Oyón',
        distritos: ['Oyón'],
      },
      {
        nombre: 'Yauyos',
        distritos: ['Yauyos'],
      },
      {
        nombre: 'Cajatambo',
        distritos: ['Cajatambo'],
      },
    ],
  },
  {
    nombre: 'Callao',
    provincias: [
      {
        nombre: 'Callao',
        distritos: [
          'Callao',
          'Bellavista',
          'Carmen de la Legua Reynoso',
          'La Perla',
          'La Punta',
          'Mi Perú',
          'Ventanilla',
        ],
      },
    ],
  },
  {
    nombre: 'Arequipa',
    provincias: [
      {
        nombre: 'Arequipa',
        distritos: [
          'Arequipa',
          'Alto Selva Alegre',
          'Cayma',
          'Cerro Colorado',
          'Characato',
          'Jacobo Hunter',
          'José Luis Bustamante y Rivero',
          'Mariano Melgar',
          'Miraflores',
          'Paucarpata',
          'Sabandía',
          'Sachaca',
          'Socabaya',
          'Tiabaya',
          'Yanahuara',
        ],
      },
      {
        nombre: 'Camaná',
        distritos: ['Camaná', 'José María Quimper', 'Samuel Pastor'],
      },
      {
        nombre: 'Caylloma',
        distritos: ['Chivay', 'Majes'],
      },
      {
        nombre: 'Islay',
        distritos: ['Mollendo', 'Cocachacra', 'Mejía', 'Punta de Bombón'],
      },
    ],
  },
  {
    nombre: 'La Libertad',
    provincias: [
      {
        nombre: 'Trujillo',
        distritos: [
          'Trujillo',
          'El Porvenir',
          'Florencia de Mora',
          'Huanchaco',
          'La Esperanza',
          'Laredo',
          'Moche',
          'Salaverry',
          'Víctor Larco Herrera',
        ],
      },
      {
        nombre: 'Chepén',
        distritos: ['Chepén', 'Pacanga'],
      },
      {
        nombre: 'Pacasmayo',
        distritos: ['San Pedro de Lloc', 'Pacasmayo'],
      },
      {
        nombre: 'Virú',
        distritos: ['Virú', 'Chao', 'Guadalupito'],
      },
    ],
  },
  {
    nombre: 'Piura',
    provincias: [
      {
        nombre: 'Piura',
        distritos: ['Piura', 'Castilla', 'Catacaos', 'Veintiséis de Octubre', 'Tambo Grande'],
      },
      {
        nombre: 'Sullana',
        distritos: ['Sullana', 'Bellavista', 'Marcavelica', 'Querecotillo'],
      },
      {
        nombre: 'Talara',
        distritos: ['Pariñas', 'El Alto', 'Los Órganos', 'Máncora'],
      },
      {
        nombre: 'Paita',
        distritos: ['Paita', 'Colán'],
      },
      {
        nombre: 'Sechura',
        distritos: ['Sechura', 'Vice'],
      },
    ],
  },
  {
    nombre: 'Lambayeque',
    provincias: [
      {
        nombre: 'Chiclayo',
        distritos: [
          'Chiclayo',
          'José Leonardo Ortiz',
          'La Victoria',
          'Monsefú',
          'Pimentel',
          'Pomalca',
          'Reque',
          'Santa Rosa',
        ],
      },
      {
        nombre: 'Ferreñafe',
        distritos: ['Ferreñafe', 'Pítipo'],
      },
      {
        nombre: 'Lambayeque',
        distritos: ['Lambayeque', 'Mochumí', 'Mórrope', 'Motupe', 'Olmos', 'Túcume'],
      },
    ],
  },
  {
    nombre: 'Cusco',
    provincias: [
      {
        nombre: 'Cusco',
        distritos: [
          'Cusco',
          'Ccorca',
          'Poroy',
          'San Jerónimo',
          'San Sebastián',
          'Santiago',
          'Saylla',
          'Wanchaq',
        ],
      },
      {
        nombre: 'Urubamba',
        distritos: ['Urubamba', 'Chinchero', 'Machupicchu', 'Maras', 'Ollantaytambo'],
      },
      {
        nombre: 'Calca',
        distritos: ['Calca', 'Pisac', 'San Salvador'],
      },
      {
        nombre: 'La Convención',
        distritos: ['Santa Ana', 'Echarati', 'Quillabamba'],
      },
    ],
  },
  {
    nombre: 'Junín',
    provincias: [
      {
        nombre: 'Huancayo',
        distritos: ['Huancayo', 'Chilca', 'El Tambo', 'Huancán', 'Pilcomayo', 'San Jerónimo de Tunán'],
      },
      {
        nombre: 'Chanchamayo',
        distritos: ['Chanchamayo', 'La Merced', 'Pichanaqui', 'San Ramón'],
      },
      {
        nombre: 'Satipo',
        distritos: ['Satipo', 'Mazamari', 'Pangoa'],
      },
      {
        nombre: 'Tarma',
        distritos: ['Tarma', 'Acobamba'],
      },
      {
        nombre: 'Yauli',
        distritos: ['La Oroya', 'Morococha'],
      },
    ],
  },
  {
    nombre: 'Ica',
    provincias: [
      {
        nombre: 'Ica',
        distritos: [
          'Ica',
          'La Tinguiña',
          'Los Aquijes',
          'Parcona',
          'Salas',
          'San Juan Bautista',
          'Subtanjalla',
        ],
      },
      {
        nombre: 'Chincha',
        distritos: ['Chincha Alta', 'Chincha Baja', 'Grocio Prado', 'Pueblo Nuevo', 'Sunampe'],
      },
      {
        nombre: 'Pisco',
        distritos: ['Pisco', 'Paracas', 'San Andrés', 'San Clemente', 'Túpac Amaru Inca'],
      },
      {
        nombre: 'Nazca',
        distritos: ['Nazca', 'Marcona', 'Vista Alegre'],
      },
      {
        nombre: 'Palpa',
        distritos: ['Palpa'],
      },
    ],
  },
  {
    nombre: 'Áncash',
    provincias: [
      {
        nombre: 'Huaraz',
        distritos: ['Huaraz', 'Independencia', 'Olleros'],
      },
      {
        nombre: 'Santa',
        distritos: ['Chimbote', 'Coishco', 'Nepeña', 'Nuevo Chimbote', 'Samanco', 'Santa'],
      },
      {
        nombre: 'Casma',
        distritos: ['Casma', 'Comandante Noel'],
      },
      {
        nombre: 'Huarmey',
        distritos: ['Huarmey', 'Culebras'],
      },
    ],
  },
  {
    nombre: 'Cajamarca',
    provincias: [
      {
        nombre: 'Cajamarca',
        distritos: ['Cajamarca', 'Baños del Inca', 'Llacanora'],
      },
      {
        nombre: 'Jaén',
        distritos: ['Jaén', 'Bellavista', 'Pucará'],
      },
      {
        nombre: 'Chota',
        distritos: ['Chota', 'Lajas', 'Tacabamba'],
      },
    ],
  },
  {
    nombre: 'San Martín',
    provincias: [
      {
        nombre: 'San Martín',
        distritos: ['Tarapoto', 'La Banda de Shilcayo', 'Morales', 'Cacatachi'],
      },
      {
        nombre: 'Moyobamba',
        distritos: ['Moyobamba', 'Calzada', 'Soritor'],
      },
      {
        nombre: 'Rioja',
        distritos: ['Rioja', 'Nueva Cajamarca'],
      },
    ],
  },
  {
    nombre: 'Loreto',
    provincias: [
      {
        nombre: 'Maynas',
        distritos: ['Iquitos', 'Belén', 'Punchana', 'San Juan Bautista'],
      },
      {
        nombre: 'Alto Amazonas',
        distritos: ['Yurimaguas'],
      },
    ],
  },
  {
    nombre: 'Ucayali',
    provincias: [
      {
        nombre: 'Coronel Portillo',
        distritos: ['Callería', 'Manantay', 'Yarinacocha', 'Campo Verde'],
      },
      {
        nombre: 'Padre Abad',
        distritos: ['Padre Abad', 'Irazola'],
      },
    ],
  },
  {
    nombre: 'Tacna',
    provincias: [
      {
        nombre: 'Tacna',
        distritos: [
          'Tacna',
          'Alto de la Alianza',
          'Ciudad Nueva',
          'Coronel Gregorio Albarracín Lanchipa',
          'Pocollay',
        ],
      },
    ],
  },
  {
    nombre: 'Puno',
    provincias: [
      {
        nombre: 'Puno',
        distritos: ['Puno', 'Acora', 'Capachica', 'Platería'],
      },
      {
        nombre: 'San Román',
        distritos: ['Juliaca', 'Cabana', 'Caracoto'],
      },
    ],
  },
  {
    nombre: 'Huánuco',
    provincias: [
      {
        nombre: 'Huánuco',
        distritos: ['Huánuco', 'Amarilis', 'Pillco Marca', 'Santa María del Valle'],
      },
      {
        nombre: 'Leoncio Prado',
        distritos: ['Rupa-Rupa', 'Castillo Grande', 'Luyando'],
      },
    ],
  },
  {
    nombre: 'Ayacucho',
    provincias: [
      {
        nombre: 'Huamanga',
        distritos: ['Ayacucho', 'Carmen Alto', 'Jesús Nazareno', 'San Juan Bautista'],
      },
    ],
  },
  {
    nombre: 'Apurímac',
    provincias: [
      {
        nombre: 'Abancay',
        distritos: ['Abancay', 'Tamburco'],
      },
      {
        nombre: 'Andahuaylas',
        distritos: ['Andahuaylas', 'San Jerónimo', 'Talavera'],
      },
    ],
  },
  {
    nombre: 'Huancavelica',
    provincias: [
      {
        nombre: 'Huancavelica',
        distritos: ['Huancavelica', 'Ascensión'],
      },
    ],
  },
  {
    nombre: 'Moquegua',
    provincias: [
      {
        nombre: 'Mariscal Nieto',
        distritos: ['Moquegua', 'Samegua', 'Torata'],
      },
      {
        nombre: 'Ilo',
        distritos: ['Ilo', 'El Algarrobal', 'Pacocha'],
      },
    ],
  },
  {
    nombre: 'Pasco',
    provincias: [
      {
        nombre: 'Pasco',
        distritos: ['Chaupimarca', 'Yanacancha'],
      },
      {
        nombre: 'Oxapampa',
        distritos: ['Oxapampa', 'Pozuzo', 'Villa Rica'],
      },
    ],
  },
  {
    nombre: 'Tumbes',
    provincias: [
      {
        nombre: 'Tumbes',
        distritos: ['Tumbes', 'Corrales', 'La Cruz', 'San Jacinto'],
      },
      {
        nombre: 'Zarumilla',
        distritos: ['Zarumilla', 'Aguas Verdes'],
      },
      {
        nombre: 'Contralmirante Villar',
        distritos: ['Zorritos', 'Canoas de Punta Sal'],
      },
    ],
  },
  {
    nombre: 'Amazonas',
    provincias: [
      {
        nombre: 'Chachapoyas',
        distritos: ['Chachapoyas', 'Huancas', 'Levanto'],
      },
      {
        nombre: 'Bagua',
        distritos: ['Bagua', 'La Peca'],
      },
      {
        nombre: 'Utcubamba',
        distritos: ['Bagua Grande'],
      },
    ],
  },
  {
    nombre: 'Madre de Dios',
    provincias: [
      {
        nombre: 'Tambopata',
        distritos: ['Tambopata', 'Inambari', 'Las Piedras'],
      },
    ],
  },
];

/**
 * Busca departamento, provincia y distrito a partir del nombre del distrito guardado
 */
export function buscarUbicacionPorDistrito(nombreDistrito?: string | null): {
  departamento: string;
  provincia: string;
  distrito: string;
} {
  if (!nombreDistrito || !nombreDistrito.trim()) {
    return {
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'Villa El Salvador',
    };
  }

  const limpio = nombreDistrito.trim().toLowerCase();

  for (const dep of UBIGEO_PERU) {
    for (const prov of dep.provincias) {
      for (const dist of prov.distritos) {
        if (dist.toLowerCase() === limpio) {
          return {
            departamento: dep.nombre,
            provincia: prov.nombre,
            distrito: dist,
          };
        }
      }
    }
  }

  // Fallback si no hubo coincidencia exacta
  return {
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: nombreDistrito.trim(),
  };
}
