/**
 * Realistic Geospatial & Environmental Dataset for North Eastern Region (NER)
 * Covers the 8 northeastern states with known slope-failure hotspots
 * DISCLAIMER: DEMO / PROTOTYPE DATA ONLY - NOT VALIDATED SCIENTIFIC READINGS
 */

import { MonitoredLocation, AlertNotification, ModelPerformanceMetrics, StateRiskSummary } from '../types/landslide';

export const INITIAL_MONITORED_LOCATIONS: MonitoredLocation[] = [
  // 1. Arunachal Pradesh - High/Critical Zones
  {
    id: 'ner-ar-01',
    name: 'Papum Pare Highway Sector 4',
    district: 'Papum Pare',
    state: 'Arunachal Pradesh',
    latitude: 27.14,
    longitude: 93.65,
    risk_probability: 0.89,
    risk_level: 'CRITICAL',
    confidence: 0.92,
    parameters: {
      rainfall_1h: 38,
      rainfall_24h: 184,
      rainfall_7d: 412,
      soil_moisture: 91,
      slope: 44,
      elevation: 1120,
      temperature: 21,
      ndvi: 0.38,
      geological_susceptibility: 'Severe',
      land_use: 'Highway Cut Slope / Unconsolidated Debris',
      road_distance: 15,
      historical_landslide_frequency: 14,
      ground_saturation: 94,
      pore_water_pressure: 42.5
    },
    population_exposure: 4200,
    critical_infrastructure: ['NH-415 Arterial Highway', 'Banderdewa Power Grid'],
    last_updated: '2 mins ago',
    has_active_geofence: true,
    geofence_radius_km: 4.0
  },
  {
    id: 'ner-ar-02',
    name: 'Tawang-Bhalukpong Mountain Corridor',
    district: 'West Kameng',
    state: 'Arunachal Pradesh',
    latitude: 27.42,
    longitude: 92.48,
    risk_probability: 0.78,
    risk_level: 'VERY_HIGH',
    confidence: 0.88,
    parameters: {
      rainfall_1h: 22,
      rainfall_24h: 138,
      rainfall_7d: 310,
      soil_moisture: 84,
      slope: 48,
      elevation: 2450,
      temperature: 13,
      ndvi: 0.52,
      geological_susceptibility: 'High',
      land_use: 'High Altitude Military Transit Road',
      road_distance: 25,
      historical_landslide_frequency: 9,
      ground_saturation: 86,
      pore_water_pressure: 34.0
    },
    population_exposure: 1850,
    critical_infrastructure: ['Trans-Arunachal Highway', 'BRO Heavy Supply Route'],
    last_updated: '5 mins ago',
    has_active_geofence: true,
    geofence_radius_km: 3.5
  },
  {
    id: 'ner-ar-03',
    name: 'Upper Subansiri River Escarpment',
    district: 'Upper Subansiri',
    state: 'Arunachal Pradesh',
    latitude: 28.02,
    longitude: 94.15,
    risk_probability: 0.62,
    risk_level: 'HIGH',
    confidence: 0.85,
    parameters: {
      rainfall_1h: 14,
      rainfall_24h: 96,
      rainfall_7d: 215,
      soil_moisture: 73,
      slope: 39,
      elevation: 1680,
      temperature: 18,
      ndvi: 0.65,
      geological_susceptibility: 'High',
      land_use: 'Terraced Cultivation / River Fluvial Slope',
      road_distance: 120,
      historical_landslide_frequency: 6,
      ground_saturation: 76,
      pore_water_pressure: 26.2
    },
    population_exposure: 920,
    critical_infrastructure: ['Daporijo Link Bridge'],
    last_updated: '12 mins ago',
    has_active_geofence: false,
    geofence_radius_km: 2.0
  },

  // 2. Sikkim
  {
    id: 'ner-sk-01',
    name: 'NH-10 29th Mile Teesta Corridor',
    district: 'Gangtok',
    state: 'Sikkim',
    latitude: 27.28,
    longitude: 88.52,
    risk_probability: 0.86,
    risk_level: 'CRITICAL',
    confidence: 0.94,
    parameters: {
      rainfall_1h: 31,
      rainfall_24h: 162,
      rainfall_7d: 388,
      soil_moisture: 89,
      slope: 52,
      elevation: 980,
      temperature: 19,
      ndvi: 0.41,
      geological_susceptibility: 'Severe',
      land_use: 'Teesta Gorge Fragile Phyllite / Schist',
      road_distance: 10,
      historical_landslide_frequency: 21,
      ground_saturation: 92,
      pore_water_pressure: 39.8
    },
    population_exposure: 6100,
    critical_infrastructure: ['NH-10 Lifeline Highway', 'Teesta Low Dam Stage III Canal'],
    last_updated: '4 mins ago',
    has_active_geofence: true,
    geofence_radius_km: 4.5
  },
  {
    id: 'ner-sk-02',
    name: 'Mangan-Chungthang Valley Slope',
    district: 'Mangan',
    state: 'Sikkim',
    latitude: 27.54,
    longitude: 88.56,
    risk_probability: 0.74,
    risk_level: 'VERY_HIGH',
    confidence: 0.89,
    parameters: {
      rainfall_1h: 18,
      rainfall_24h: 124,
      rainfall_7d: 285,
      soil_moisture: 82,
      slope: 46,
      elevation: 1820,
      temperature: 15,
      ndvi: 0.58,
      geological_susceptibility: 'High',
      land_use: 'Glacial Outwash Fluvial Terrace',
      road_distance: 40,
      historical_landslide_frequency: 11,
      ground_saturation: 84,
      pore_water_pressure: 31.5
    },
    population_exposure: 2300,
    critical_infrastructure: ['Lachen-Lachung Connecting Bridge', 'Hydroelectric Substation'],
    last_updated: '8 mins ago',
    has_active_geofence: true,
    geofence_radius_km: 3.0
  },

  // 3. Meghalaya
  {
    id: 'ner-mg-01',
    name: 'Sohra Cherrapunji Escarpment',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    latitude: 25.31,
    longitude: 91.73,
    risk_probability: 0.79,
    risk_level: 'VERY_HIGH',
    confidence: 0.91,
    parameters: {
      rainfall_1h: 42,
      rainfall_24h: 210,
      rainfall_7d: 580,
      soil_moisture: 93,
      slope: 41,
      elevation: 1350,
      temperature: 19,
      ndvi: 0.35,
      geological_susceptibility: 'High',
      land_use: 'Karst Sandstone Escarpment / High Runoff',
      road_distance: 30,
      historical_landslide_frequency: 16,
      ground_saturation: 96,
      pore_water_pressure: 44.1
    },
    population_exposure: 3400,
    critical_infrastructure: ['Cherrapunji-Shella Border Route', 'Seven Sisters Scenic Overlook'],
    last_updated: '3 mins ago',
    has_active_geofence: true,
    geofence_radius_km: 3.5
  },
  {
    id: 'ner-mg-02',
    name: 'Shillong Bypass Mawryngkneng',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    latitude: 25.62,
    longitude: 92.05,
    risk_probability: 0.56,
    risk_level: 'HIGH',
    confidence: 0.84,
    parameters: {
      rainfall_1h: 16,
      rainfall_24h: 88,
      rainfall_7d: 194,
      soil_moisture: 71,
      slope: 36,
      elevation: 1540,
      temperature: 20,
      ndvi: 0.62,
      geological_susceptibility: 'Moderate',
      land_use: 'Four-Lane Hill Cut Slope',
      road_distance: 10,
      historical_landslide_frequency: 5,
      ground_saturation: 73,
      pore_water_pressure: 22.0
    },
    population_exposure: 1500,
    critical_infrastructure: ['NH-6 National Highway'],
    last_updated: '15 mins ago',
    has_active_geofence: false,
    geofence_radius_km: 2.0
  },

  // 4. Manipur
  {
    id: 'ner-mn-01',
    name: 'Tupul-Noney Railway Incline',
    district: 'Noney',
    state: 'Manipur',
    latitude: 24.88,
    longitude: 93.63,
    risk_probability: 0.88,
    risk_level: 'CRITICAL',
    confidence: 0.95,
    parameters: {
      rainfall_1h: 36,
      rainfall_24h: 175,
      rainfall_7d: 395,
      soil_moisture: 92,
      slope: 45,
      elevation: 920,
      temperature: 23,
      ndvi: 0.32,
      geological_susceptibility: 'Severe',
      land_use: 'Disupur Shale Cut Slope / Construction Siltation',
      road_distance: 20,
      historical_landslide_frequency: 18,
      ground_saturation: 95,
      pore_water_pressure: 46.0
    },
    population_exposure: 5200,
    critical_infrastructure: ['Jiribam-Imphal Rail Line Yard', 'Ijei River Culvert'],
    last_updated: '1 min ago',
    has_active_geofence: true,
    geofence_radius_km: 5.0
  },
  {
    id: 'ner-mn-02',
    name: 'Senapati NH-2 Mountain Cut',
    district: 'Senapati',
    state: 'Manipur',
    latitude: 25.26,
    longitude: 94.02,
    risk_probability: 0.64,
    risk_level: 'HIGH',
    confidence: 0.83,
    parameters: {
      rainfall_1h: 12,
      rainfall_24h: 82,
      rainfall_7d: 178,
      soil_moisture: 72,
      slope: 38,
      elevation: 1250,
      temperature: 21,
      ndvi: 0.55,
      geological_susceptibility: 'High',
      land_use: 'Terraced Hillsides / Road Berm',
      road_distance: 15,
      historical_landslide_frequency: 7,
      ground_saturation: 75,
      pore_water_pressure: 25.4
    },
    population_exposure: 2800,
    critical_infrastructure: ['NH-2 Imphal-Dimapur Lifeline'],
    last_updated: '20 mins ago',
    has_active_geofence: false,
    geofence_radius_km: 2.5
  },

  // 5. Mizoram
  {
    id: 'ner-mz-01',
    name: 'Aizawl City Eastern Ridge',
    district: 'Aizawl',
    state: 'Mizoram',
    latitude: 23.73,
    longitude: 92.72,
    risk_probability: 0.81,
    risk_level: 'VERY_HIGH',
    confidence: 0.90,
    parameters: {
      rainfall_1h: 28,
      rainfall_24h: 146,
      rainfall_7d: 320,
      soil_moisture: 87,
      slope: 42,
      elevation: 1180,
      temperature: 22,
      ndvi: 0.44,
      geological_susceptibility: 'Severe',
      land_use: 'Dense Urban Ridge Housing / Siltstone Beds',
      road_distance: 5,
      historical_landslide_frequency: 13,
      ground_saturation: 88,
      pore_water_pressure: 37.8
    },
    population_exposure: 7800,
    critical_infrastructure: ['Bawngkawn Junction', 'Aizawl Water Supply Main'],
    last_updated: '6 mins ago',
    has_active_geofence: true,
    geofence_radius_km: 3.5
  },
  {
    id: 'ner-mz-02',
    name: 'Lunglei Western Slopes',
    district: 'Lunglei',
    state: 'Mizoram',
    latitude: 22.89,
    longitude: 92.74,
    risk_probability: 0.58,
    risk_level: 'HIGH',
    confidence: 0.81,
    parameters: {
      rainfall_1h: 15,
      rainfall_24h: 76,
      rainfall_7d: 165,
      soil_moisture: 69,
      slope: 35,
      elevation: 890,
      temperature: 24,
      ndvi: 0.63,
      geological_susceptibility: 'Moderate',
      land_use: 'Forested Foothills / Semi-Urban',
      road_distance: 45,
      historical_landslide_frequency: 4,
      ground_saturation: 70,
      pore_water_pressure: 21.3
    },
    population_exposure: 1900,
    critical_infrastructure: ['Lunglei-Thenzawl Highway'],
    last_updated: '25 mins ago',
    has_active_geofence: false,
    geofence_radius_km: 2.0
  },

  // 6. Nagaland
  {
    id: 'ner-nl-01',
    name: 'Kohima Bypass Peducha Sector',
    district: 'Kohima',
    state: 'Nagaland',
    latitude: 25.72,
    longitude: 94.04,
    risk_probability: 0.77,
    risk_level: 'VERY_HIGH',
    confidence: 0.87,
    parameters: {
      rainfall_1h: 25,
      rainfall_24h: 132,
      rainfall_7d: 290,
      soil_moisture: 85,
      slope: 43,
      elevation: 1440,
      temperature: 20,
      ndvi: 0.49,
      geological_susceptibility: 'High',
      land_use: 'Disang Shale Weathering Belt / Highway Cut',
      road_distance: 12,
      historical_landslide_frequency: 12,
      ground_saturation: 86,
      pore_water_pressure: 35.2
    },
    population_exposure: 3100,
    critical_infrastructure: ['NH-29 Heavy Freight Corridor', 'Optic Fibre Backbone'],
    last_updated: '9 mins ago',
    has_active_geofence: true,
    geofence_radius_km: 3.0
  },
  {
    id: 'ner-nl-02',
    name: 'Mokokchung Hill Crest',
    district: 'Mokokchung',
    state: 'Nagaland',
    latitude: 26.32,
    longitude: 94.52,
    risk_probability: 0.48,
    risk_level: 'MODERATE',
    confidence: 0.82,
    parameters: {
      rainfall_1h: 8,
      rainfall_24h: 54,
      rainfall_7d: 110,
      soil_moisture: 58,
      slope: 28,
      elevation: 1320,
      temperature: 21,
      ndvi: 0.71,
      geological_susceptibility: 'Moderate',
      land_use: 'Dense Mixed Agro-Forestry',
      road_distance: 60,
      historical_landslide_frequency: 3,
      ground_saturation: 59,
      pore_water_pressure: 14.5
    },
    population_exposure: 1200,
    critical_infrastructure: ['District Hospital Link Road'],
    last_updated: '30 mins ago',
    has_active_geofence: false,
    geofence_radius_km: 1.5
  },

  // 7. Assam
  {
    id: 'ner-as-01',
    name: 'Dima Hasao Haflong Hill Railway',
    district: 'Dima Hasao',
    state: 'Assam',
    latitude: 25.18,
    longitude: 93.02,
    risk_probability: 0.84,
    risk_level: 'VERY_HIGH',
    confidence: 0.93,
    parameters: {
      rainfall_1h: 34,
      rainfall_24h: 158,
      rainfall_7d: 360,
      soil_moisture: 88,
      slope: 40,
      elevation: 680,
      temperature: 25,
      ndvi: 0.42,
      geological_susceptibility: 'Severe',
      land_use: 'Barail Series Unstable Sandstone-Shale Rail Cut',
      road_distance: 18,
      historical_landslide_frequency: 15,
      ground_saturation: 90,
      pore_water_pressure: 41.2
    },
    population_exposure: 4900,
    critical_infrastructure: ['Lumding-Badarpur Broad Gauge Rail Link', 'NH-54E Highway'],
    last_updated: '5 mins ago',
    has_active_geofence: true,
    geofence_radius_km: 4.0
  },
  {
    id: 'ner-as-02',
    name: 'Guwahati Nilachal Hill Slopes',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    latitude: 26.16,
    longitude: 91.70,
    risk_probability: 0.42,
    risk_level: 'MODERATE',
    confidence: 0.85,
    parameters: {
      rainfall_1h: 6,
      rainfall_24h: 46,
      rainfall_7d: 95,
      soil_moisture: 52,
      slope: 26,
      elevation: 210,
      temperature: 28,
      ndvi: 0.54,
      geological_susceptibility: 'Moderate',
      land_use: 'Gneissic Hill Cutting / Dense Habitation',
      road_distance: 8,
      historical_landslide_frequency: 4,
      ground_saturation: 54,
      pore_water_pressure: 12.0
    },
    population_exposure: 5500,
    critical_infrastructure: ['Kamakhya Access Road'],
    last_updated: '40 mins ago',
    has_active_geofence: false,
    geofence_radius_km: 1.5
  },

  // 8. Tripura
  {
    id: 'ner-tr-01',
    name: 'Jampui Hills Ridge Border Area',
    district: 'North Tripura',
    state: 'Tripura',
    latitude: 23.95,
    longitude: 92.28,
    risk_probability: 0.38,
    risk_level: 'MODERATE',
    confidence: 0.80,
    parameters: {
      rainfall_1h: 5,
      rainfall_24h: 42,
      rainfall_7d: 85,
      soil_moisture: 48,
      slope: 24,
      elevation: 740,
      temperature: 26,
      ndvi: 0.68,
      geological_susceptibility: 'Low',
      land_use: 'Orange Orchard Slopes / Shifting Cultivation',
      road_distance: 70,
      historical_landslide_frequency: 2,
      ground_saturation: 50,
      pore_water_pressure: 9.8
    },
    population_exposure: 850,
    critical_infrastructure: ['Vanghmun Village Corridor'],
    last_updated: '45 mins ago',
    has_active_geofence: false,
    geofence_radius_km: 1.5
  },
  {
    id: 'ner-tr-02',
    name: 'Baramura Hill Range Highway Cut',
    district: 'Khowai',
    state: 'Tripura',
    latitude: 23.88,
    longitude: 91.56,
    risk_probability: 0.28,
    risk_level: 'LOW',
    confidence: 0.84,
    parameters: {
      rainfall_1h: 2,
      rainfall_24h: 22,
      rainfall_7d: 50,
      soil_moisture: 38,
      slope: 18,
      elevation: 250,
      temperature: 29,
      ndvi: 0.72,
      geological_susceptibility: 'Low',
      land_use: 'Secondary Bamboo Forest / Regraded Highway Slope',
      road_distance: 15,
      historical_landslide_frequency: 1,
      ground_saturation: 40,
      pore_water_pressure: 6.2
    },
    population_exposure: 400,
    critical_infrastructure: ['NH-8 Agartala Link Road'],
    last_updated: '50 mins ago',
    has_active_geofence: false,
    geofence_radius_km: 1.0
  }
];

export const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: 'alert-01',
    locationId: 'ner-ar-01',
    locationName: 'Papum Pare Highway Sector 4',
    district: 'Papum Pare',
    state: 'Arunachal Pradesh',
    risk_probability: 0.89,
    risk_level: 'CRITICAL',
    timestamp: '12:41 IST',
    timeAgo: '2 minutes ago',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    primary_factors: [
      'Cumulative 24-hour rainfall exceeded 180 mm (Critical threshold)',
      'Soil saturation at 94% with high pore-water pressure',
      'Steep slope (44°) in unconsolidated debris deposit',
      'High geological susceptibility along active highway cut'
    ],
    recommended_actions: [
      'Immediate field verification and precautionary evacuation assessment.',
      'Deploy district emergency response patrol to NH-415.',
      'Halt heavy vehicle movement along vulnerable hillside cut.'
    ]
  },
  {
    id: 'alert-02',
    locationId: 'ner-mn-01',
    locationName: 'Tupul-Noney Railway Incline',
    district: 'Noney',
    state: 'Manipur',
    risk_probability: 0.88,
    risk_level: 'CRITICAL',
    timestamp: '12:35 IST',
    timeAgo: '8 minutes ago',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    primary_factors: [
      'Heavy torrential storm burst: 36 mm in 1 hour',
      'Disupur Shale formation saturated with rapid erosion',
      'High mudflow and slope slumping potential along Ijei riverbank',
      'Historical landslide epicenter (2022 disaster zone)'
    ],
    recommended_actions: [
      'Issue red warning alert to NF Railway safety engineers.',
      'Evacuate lower construction camps along river confluence.',
      'Pre-position State Disaster Response Force (SDRF) units at Noney base.'
    ]
  },
  {
    id: 'alert-03',
    locationId: 'ner-sk-01',
    locationName: 'NH-10 29th Mile Teesta Corridor',
    district: 'Gangtok',
    state: 'Sikkim',
    risk_probability: 0.86,
    risk_level: 'CRITICAL',
    timestamp: '12:28 IST',
    timeAgo: '15 minutes ago',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    primary_factors: [
      'Continuous 7-day cumulative rainfall of 388 mm',
      'River toe-erosion along Teesta basin triggering rockfall',
      'Steep slope angle of 52° in weathered schist rock'
    ],
    recommended_actions: [
      'Coordinate with BRO Project Swastik for rapid rock clearing.',
      'Divert Siliguri-Gangtok transit traffic to alternate Lava-Algarah route.',
      'Sound community siren warning in 29th Mile settlement.'
    ]
  },
  {
    id: 'alert-04',
    locationId: 'ner-as-01',
    locationName: 'Dima Hasao Haflong Hill Railway',
    district: 'Dima Hasao',
    state: 'Assam',
    risk_probability: 0.84,
    risk_level: 'VERY_HIGH',
    timestamp: '12:15 IST',
    timeAgo: '28 minutes ago',
    severity: 'HIGH',
    status: 'ACTIVE',
    primary_factors: [
      '158 mm / 24h rainfall in Barail mountain range',
      'High ground saturation (90%) causing track foundation instability',
      'Past track washaway history in 2022 and 2024'
    ],
    recommended_actions: [
      'Impose 15 km/h train speed restriction along Hill Section.',
      'Inspect bridge piers 4 & 5 for embankment slippage.',
      'Alert Assam State Disaster Management Authority (ASDMA).'
    ]
  },
  {
    id: 'alert-05',
    locationId: 'ner-mz-01',
    locationName: 'Aizawl City Eastern Ridge',
    district: 'Aizawl',
    state: 'Mizoram',
    risk_probability: 0.81,
    risk_level: 'VERY_HIGH',
    timestamp: '12:02 IST',
    timeAgo: '41 minutes ago',
    severity: 'HIGH',
    status: 'ACTIVE',
    primary_factors: [
      'High soil moisture (87%) across dense residential slope',
      'Overburdened drainage system with localized waterlogging',
      'Slope gradient of 42° on friable siltstone bedding'
    ],
    recommended_actions: [
      'Advise residents of lower terraced buildings to seek temporary shelter.',
      'Deploy Aizawl Municipal Corporation (AMC) slope inspection team.',
      'Inspect retaining walls for fresh tension fissures.'
    ]
  },
  {
    id: 'alert-06',
    locationId: 'ner-mg-01',
    locationName: 'Sohra Cherrapunji Escarpment',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    risk_probability: 0.79,
    risk_level: 'VERY_HIGH',
    timestamp: '11:45 IST',
    timeAgo: '58 minutes ago',
    severity: 'HIGH',
    status: 'ACTIVE',
    primary_factors: [
      'Heavy monsoon precipitation: 210 mm in 24h',
      'High runoff velocity dislodging slope colluvium',
      'Rapid rise in pore water pressure'
    ],
    recommended_actions: [
      'Monitor Shella border road culverts.',
      'Notify East Khasi Hills district disaster response committee.',
      'Caution tour operators against gorge hiking trails.'
    ]
  }
];

export const DEMO_STATE_RISK_SUMMARY: StateRiskSummary[] = [
  {
    state: 'Arunachal Pradesh',
    avgRisk: 0.78,
    highRiskZones: 14,
    criticalZones: 3,
    alerts: 8,
    totalMonitored: 34
  },
  {
    state: 'Sikkim',
    avgRisk: 0.71,
    highRiskZones: 9,
    criticalZones: 2,
    alerts: 5,
    totalMonitored: 26
  },
  {
    state: 'Meghalaya',
    avgRisk: 0.63,
    highRiskZones: 7,
    criticalZones: 1,
    alerts: 4,
    totalMonitored: 22
  },
  {
    state: 'Mizoram',
    avgRisk: 0.59,
    highRiskZones: 6,
    criticalZones: 1,
    alerts: 3,
    totalMonitored: 19
  },
  {
    state: 'Nagaland',
    avgRisk: 0.55,
    highRiskZones: 5,
    criticalZones: 0,
    alerts: 2,
    totalMonitored: 18
  },
  {
    state: 'Manipur',
    avgRisk: 0.48,
    highRiskZones: 4,
    criticalZones: 1,
    alerts: 2,
    totalMonitored: 17
  },
  {
    state: 'Assam',
    avgRisk: 0.42,
    highRiskZones: 3,
    criticalZones: 1,
    alerts: 1,
    totalMonitored: 28
  },
  {
    state: 'Tripura',
    avgRisk: 0.31,
    highRiskZones: 1,
    criticalZones: 0,
    alerts: 0,
    totalMonitored: 12
  }
];

export const DEMO_MODEL_PERFORMANCE: ModelPerformanceMetrics = {
  accuracy: 0.884,
  precision: 0.862,
  recall: 0.897,
  f1Score: 0.879,
  rocAuc: 0.931,
  falseAlarmRate: 0.082,
  lastTrained: '2026-08-28 (Prototype Evaluation Cohort)',
  testDatasetSize: 4250,
  modelArchitecture: 'Ensemble Gradient Boosted Trees (XGBoost + Random Forest)'
};
