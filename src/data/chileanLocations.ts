import { ChileanRegion } from '../types/profile';

export const chileanLocations: ChileanRegion[] = [
  {
    id: 'region-metropolitana',
    name: 'Región Metropolitana',
    comunas: [
      {
        id: 'santiago',
        name: 'Santiago',
        cities: ['Santiago Centro']
      },
      {
        id: 'providencia',
        name: 'Providencia',
        cities: ['Providencia']
      },
      {
        id: 'las-condes',
        name: 'Las Condes',
        cities: ['Las Condes']
      },
      {
        id: 'nunoa',
        name: 'Ñuñoa',
        cities: ['Ñuñoa']
      },
      {
        id: 'la-florida',
        name: 'La Florida',
        cities: ['La Florida']
      }
    ]
  },
  {
    id: 'valparaiso',
    name: 'Valparaíso',
    comunas: [
      {
        id: 'valparaiso-comuna',
        name: 'Valparaíso',
        cities: ['Valparaíso']
      },
      {
        id: 'vina-del-mar',
        name: 'Viña del Mar',
        cities: ['Viña del Mar']
      },
      {
        id: 'quilpue',
        name: 'Quilpué',
        cities: ['Quilpué']
      }
    ]
  },
  {
    id: 'biobio',
    name: 'Biobío',
    comunas: [
      {
        id: 'concepcion',
        name: 'Concepción',
        cities: ['Concepción']
      },
      {
        id: 'talcahuano',
        name: 'Talcahuano',
        cities: ['Talcahuano']
      }
    ]
  },
  {
    id: 'coquimbo',
    name: 'Coquimbo',
    comunas: [
      {
        id: 'la-serena',
        name: 'La Serena',
        cities: ['La Serena']
      },
      {
        id: 'coquimbo-comuna',
        name: 'Coquimbo',
        cities: ['Coquimbo']
      }
    ]
  },
  {
    id: 'ohiggins',
    name: "O'Higgins",
    comunas: [
      {
        id: 'rancagua',
        name: 'Rancagua',
        cities: ['Rancagua']
      },
      {
        id: 'san-fernando',
        name: 'San Fernando',
        cities: ['San Fernando']
      }
    ]
  }
];
