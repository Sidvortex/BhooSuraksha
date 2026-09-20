/**
 * Citizen Portal Data: Crowdsourced reports, highway corridors, relief shelters,
 * emergency helplines, and safety action guides across Northeast India.
 */

import { 
  CitizenIncidentReport, 
  HighwayCorridor, 
  EmergencyReliefShelter 
} from '../types/landslide';

export const INITIAL_CITIZEN_REPORTS: CitizenIncidentReport[] = [
  {
    id: 'cit-rep-01',
    reporterName: 'Tashi D. Bhutia',
    reporterPhone: '+91 98765 43210',
    locationName: '29th Mile, NH-10 Corridor',
    district: 'Pakyong / Kalimpong Border',
    state: 'Sikkim',
    hazardType: 'ROCKFALL',
    severity: 'HIGH',
    description: 'Small rocks and loose shale rolling down onto road shoulder since 6:30 AM after steady drizzle. Half lane partially obstructed.',
    timestamp: 'Today, 07:15 AM',
    timeAgo: '45 mins ago',
    status: 'VERIFIED_DISPATCHED',
    nearestLandmark: 'Near Coronation Bridge checkpoint, KM 42',
    upvotes: 14,
    latitude: 27.18,
    longitude: 88.51
  },
  {
    id: 'cit-rep-02',
    reporterName: 'Kago Habung',
    reporterPhone: '+91 94360 11223',
    locationName: 'Nirjuli-Doimukh Link Road',
    district: 'Papum Pare',
    state: 'Arunachal Pradesh',
    hazardType: 'GROUND_CRACK',
    severity: 'CRITICAL',
    description: 'Long longitudinal crack (approx 2 inches wide and 18 meters long) opened on the cut slope above residential cluster. Water seeping from crack.',
    timestamp: 'Today, 06:40 AM',
    timeAgo: '1 hr 20 mins ago',
    status: 'PENDING_REVIEW',
    nearestLandmark: 'Opposite Government Polytechnic compound',
    upvotes: 28,
    latitude: 27.14,
    longitude: 93.66
  },
  {
    id: 'cit-rep-03',
    reporterName: 'Lalrinchhana Sailo',
    reporterPhone: '+91 98623 88990',
    locationName: 'Hunthar Veng Ridge Road',
    district: 'Aizawl',
    state: 'Mizoram',
    hazardType: 'TILTING_TREES',
    severity: 'MEDIUM',
    description: 'Pine trees and electric utility pole visibly leaning downhill toward the drainage channel. Retaining wall showing bulging.',
    timestamp: 'Yesterday, 05:20 PM',
    timeAgo: '14 hrs ago',
    status: 'VERIFIED_DISPATCHED',
    nearestLandmark: 'Below Presbyterian Church parking',
    upvotes: 9,
    latitude: 23.74,
    longitude: 92.71
  },
  {
    id: 'cit-rep-04',
    reporterName: 'Mewanba Nongrum',
    reporterPhone: '+91 97740 55667',
    locationName: 'Umiam-Shillong Bypass Curve',
    district: 'Ri-Bhoi',
    state: 'Meghalaya',
    hazardType: 'MUDDY_SPRING',
    severity: 'HIGH',
    description: 'Sudden gush of brown muddy water bursting out from the hill toe next to the highway drain. Usually dry rock surface.',
    timestamp: 'Today, 08:00 AM',
    timeAgo: 'Just now',
    status: 'PENDING_REVIEW',
    nearestLandmark: 'KM 14 mark near Barapani viewpoint',
    upvotes: 5,
    latitude: 25.68,
    longitude: 91.90
  }
];

export const INITIAL_HIGHWAY_CORRIDORS: HighwayCorridor[] = [
  {
    id: 'hw-nh10',
    name: 'NH-10 (Siliguri – Gangtok)',
    routeSpan: 'Sevoke – Teesta Bazaar – Rangpo – Singtam – Gangtok',
    state: 'Sikkim',
    status: 'RESTRICTED',
    riskProbability: 0.88,
    currentRainfall24h: 172,
    advisory: 'Single-lane convoy movement only between 29th Mile and Teesta Bazaar due to active scree fall. Heavy trucks diverted via Lava-Algarah.',
    emergencyContact: 'BRO Project Swastik Control Room: 03592-202288',
    alternateRoute: 'Via Gorubathan – Lava – Reshi – Rhenock – Rongli',
    lastCleared: 'Cleared partially 1 hour ago'
  },
  {
    id: 'hw-nh29',
    name: 'NH-29 (Dimapur – Kohima)',
    routeSpan: 'Chumoukedima – Paglapahar – Medziphema – Kohima',
    state: 'Nagaland',
    status: 'CAUTION',
    riskProbability: 0.68,
    currentRainfall24h: 96,
    advisory: 'Paglapahar sector witnessing periodic minor debris wash. Maintain 30 km/h speed limit and do not stop under steep rock cuts.',
    emergencyContact: 'Nagaland Police Highway Patrol: 112 / 0370-2244279',
    alternateRoute: 'Old Dimapur-Kohima via Niuland (4x4 recommended)',
    lastCleared: 'Continuous monitoring by NHIDCL'
  },
  {
    id: 'hw-nh415',
    name: 'NH-415 (Banderdewa – Itanagar – Naharlagun)',
    routeSpan: 'Banderdewa – Karsingsa – Nirjuli – Naharlagun – Itanagar',
    state: 'Arunachal Pradesh',
    status: 'BLOCKED',
    riskProbability: 0.91,
    currentRainfall24h: 184,
    advisory: 'Major slope collapse at Karsingsa sinking zone. Earthmoving machinery deployed by PWD Highway. Expected clearance: 4-6 hours.',
    emergencyContact: 'Capital Police Control: 0360-2212233 / 112',
    alternateRoute: 'Via Gumto – Doimukh road open for light commercial and passenger vehicles',
    lastCleared: 'Excavators actively clearing debris'
  },
  {
    id: 'hw-nh6',
    name: 'NH-06 (Guwahati – Shillong – Silchar)',
    routeSpan: 'Jorabat – Nongpoh – Umiam – Shillong – Jowai – Ratacherra',
    state: 'Meghalaya',
    status: 'CAUTION',
    riskProbability: 0.62,
    currentRainfall24h: 122,
    advisory: 'Dense fog and slippery mud stretches between Umsning and Mawryngkneng. Avoid nighttime driving on Sonapur tunnel bypass.',
    emergencyContact: 'Meghalaya Highway Rescue: 1070 / 0364-2225289',
    alternateRoute: 'Main corridor open with safety marshals',
    lastCleared: 'Open with safety caution'
  },
  {
    id: 'hw-nh102',
    name: 'NH-102 (Imphal – Moreh Indo-Myanmar Highway)',
    routeSpan: 'Imphal – Thoubal – Kakching – Pallel – Tengnoupal – Moreh',
    state: 'Manipur',
    status: 'RESTRICTED',
    riskProbability: 0.74,
    currentRainfall24h: 118,
    advisory: 'Pallel to Tengnoupal ghat section prone to active soil creep and sinkholes. Heavy transport restricted during evening rain hours.',
    emergencyContact: 'Manipur Disaster Management Desk: 0385-2443441',
    alternateRoute: 'No direct bypass; wait at Pallel staging depot',
    lastCleared: 'Inspected this morning by BRTF'
  },
  {
    id: 'hw-nh53',
    name: 'NH-53 / NH-306 (Silchar – Kolasib – Aizawl)',
    routeSpan: 'Silchar – Vairengte – Bilkhawthlir – Kolasib – Durtlang – Aizawl',
    state: 'Mizoram',
    status: 'OPEN',
    riskProbability: 0.49,
    currentRainfall24h: 68,
    advisory: 'All sectors currently open for normal traffic. Watch for surface water pooling around Kawnpui bends.',
    emergencyContact: 'Mizoram Disaster Control Room: 0389-2335842 / 1070',
    alternateRoute: 'Standard highway corridor functional',
    lastCleared: 'Normal flow'
  }
];

export const INITIAL_RELIEF_SHELTERS: EmergencyReliefShelter[] = [
  {
    id: 'sh-01',
    name: 'Pakyong Indoor Sports Stadium & Safe Camp',
    locationName: 'Pakyong Town, Near Airport Ridge',
    district: 'Pakyong',
    state: 'Sikkim',
    capacity: 650,
    occupancy: 120,
    contactNumber: '+91 3592 257120',
    officerInCharge: 'Sub-Divisional Magistrate, Pakyong',
    facilities: ['Emergency Medical Post', 'Clean Drinking Water', 'Generator Backup', 'Separate Family Dorms', 'Bedding Kits'],
    lat: 27.24,
    lng: 88.59,
    elevationMeters: 1450
  },
  {
    id: 'sh-02',
    name: 'Doimukh Higher Secondary School Complex',
    locationName: 'Doimukh Central Stable Grounds',
    district: 'Papum Pare',
    state: 'Arunachal Pradesh',
    capacity: 800,
    occupancy: 245,
    contactNumber: '+91 360 2277314',
    officerInCharge: 'DDMA Nodal Officer, Yupia',
    facilities: ['Community Kitchen', '24/7 Paramedic Staff', 'Relief Supply Distribution', 'High-speed Starlink / Wi-Fi', 'Sanitation Blocks'],
    lat: 27.13,
    lng: 93.75,
    elevationMeters: 140
  },
  {
    id: 'sh-03',
    name: 'Durtlang Community Hall & Disaster Refuge',
    locationName: 'Durtlang North Ridge',
    district: 'Aizawl',
    state: 'Mizoram',
    capacity: 450,
    occupancy: 60,
    contactNumber: '+91 389 2361280',
    officerInCharge: 'Young Mizo Association (YMA) Volunteer Head',
    facilities: ['Reinforced Rock Foundation', 'Rainwater Harvesting Tank', 'First Aid Stock', 'Child Care Corner'],
    lat: 23.77,
    lng: 92.73,
    elevationMeters: 1220
  },
  {
    id: 'sh-04',
    name: 'Umsning Multi-Purpose Cyclone & Disaster Shelter',
    locationName: 'Umsning Block Headquarters',
    district: 'Ri-Bhoi',
    state: 'Meghalaya',
    capacity: 500,
    occupancy: 40,
    contactNumber: '+91 3638 263222',
    officerInCharge: 'Block Development Officer, Umsning',
    facilities: ['RCC Elevated Structure', 'Backup Solar Inverter', 'SDRF Staging Base', 'Emergency Rations'],
    lat: 25.75,
    lng: 91.89,
    elevationMeters: 920
  },
  {
    id: 'sh-05',
    name: 'Kohima Local Ground Relief Enclosure',
    locationName: 'Khuochiezie Stable Ground',
    district: 'Kohima',
    state: 'Nagaland',
    capacity: 900,
    occupancy: 95,
    contactNumber: '+91 370 2290045',
    officerInCharge: 'Nagaland State Disaster Management Authority (NSDMA) Desk',
    facilities: ['Ambulance Bay', 'Heating & Warm Blankets', 'Satellite Emergency Comm Desk', 'Community Volunteers'],
    lat: 25.67,
    lng: 94.11,
    elevationMeters: 1440
  }
];

export const EMERGENCY_HELPLINES = [
  { service: 'National Disaster Helpline (NDMA)', number: '1078', description: '24/7 Toll-free national emergency coordination' },
  { service: 'All India Emergency Response (Police / Fire / Ambulance)', number: '112', description: 'Immediate first responder dispatch' },
  { service: 'SDRF State Disaster Helpline', number: '1070', description: 'State Disaster Response Force rescue mobilization' },
  { service: 'District Disaster Control Room (DDMA)', number: '1077', description: 'District magistrate emergency situation room' },
  { service: 'Border Roads Organisation (BRO) Road Help', number: '1800-180-2763', description: 'Highway clearance, landslide blockage status' },
  { service: 'National Disaster Response Force (NDRF)', number: '011-24363260', description: 'Heavy search and rescue specialist deployment' }
];

export const LANDSLIDE_SIGNS_GUIDE = [
  {
    category: 'Early Warning Signs on Ground',
    items: [
      'New cracks, fractures, or ground bulging on hillsides, roads, or building foundations.',
      'Doors or windows suddenly jamming or sticking in residential frames.',
      'Underground utility pipes breaking or leaking unexpectedly.',
      'Fences, utility poles, retaining walls, or trees suddenly leaning downhill.',
      'Sudden emergence of new water springs, seeps, or localized water ponding on slopes that are normally dry.'
    ]
  },
  {
    category: 'Immediate Pre-Failure Signs',
    items: [
      'Faint rumbling sounds that gradually increase in volume (sounds like an approaching freight train).',
      'Sudden change from clear creek water to thick, murky brownish mud.',
      'Small rocks, pebble showers, or falling dirt clicking down slopes or onto roads.',
      'Trees cracking or snapping without strong winds.'
    ]
  },
  {
    category: 'Crucial Actions During Slope Movement',
    items: [
      'EVACUATE IMMEDIATELY: If you suspect imminent slope movement, do not attempt to collect belongings. Alert neighbors and move quickly away from the path of the slide.',
      'Move uphill or laterally away from drainage ravines, hollows, and stream valleys.',
      'If caught inside and escape is impossible: Curl into a tight ball and protect your head under heavy furniture or in an interior room.'
    ]
  }
];
