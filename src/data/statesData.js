// Available states where MLS data is integrated
// Currently only Mississippi is integrated

export const availableStates = {
  MS: {
    name: 'Mississippi',
    abbr: 'MS',
    available: true,
    cities: [
      { id: 'ms-1', name: 'Jackson' },
      { id: 'ms-2', name: 'Gulfport' },
      { id: 'ms-3', name: 'Southaven' },
      { id: 'ms-4', name: 'Hattiesburg' },
      { id: 'ms-5', name: 'Biloxi' },
      { id: 'ms-6', name: 'Meridian' },
      { id: 'ms-7', name: 'Tupelo' },
      { id: 'ms-8', name: 'Olive Branch' },
    ]
  },
  // Add more states as integration expands
};

// All US states for the map (not all are available)
export const allStates = {
  AL: { name: 'Alabama', abbr: 'AL', available: false },
  AK: { name: 'Alaska', abbr: 'AK', available: false },
  AZ: { name: 'Arizona', abbr: 'AZ', available: false },
  AR: { name: 'Arkansas', abbr: 'AR', available: false },
  CA: { name: 'California', abbr: 'CA', available: true },
  CO: { name: 'Colorado', abbr: 'CO', available: false },
  CT: { name: 'Connecticut', abbr: 'CT', available: false },
  DE: { name: 'Delaware', abbr: 'DE', available: false },
  FL: { name: 'Florida', abbr: 'FL', available: true },
  GA: { name: 'Georgia', abbr: 'GA', available: false },
  HI: { name: 'Hawaii', abbr: 'HI', available: false },
  ID: { name: 'Idaho', abbr: 'ID', available: false },
  IL: { name: 'Illinois', abbr: 'IL', available: true },
  IN: { name: 'Indiana', abbr: 'IN', available: false },
  IA: { name: 'Iowa', abbr: 'IA', available: false },
  KS: { name: 'Kansas', abbr: 'KS', available: false },
  KY: { name: 'Kentucky', abbr: 'KY', available: false },
  LA: { name: 'Louisiana', abbr: 'LA', available: false },
  ME: { name: 'Maine', abbr: 'ME', available: false },
  MD: { name: 'Maryland', abbr: 'MD', available: false },
  MA: { name: 'Massachusetts', abbr: 'MA', available: false },
  MI: { name: 'Michigan', abbr: 'MI', available: false },
  MN: { name: 'Minnesota', abbr: 'MN', available: false },
  MS: { name: 'Mississippi', abbr: 'MS', available: false },
  MO: { name: 'Missouri', abbr: 'MO', available: false },
  MT: { name: 'Montana', abbr: 'MT', available: false },
  NE: { name: 'Nebraska', abbr: 'NE', available: false },
  NV: { name: 'Nevada', abbr: 'NV', available: false },
  NH: { name: 'New Hampshire', abbr: 'NH', available: false },
  NJ: { name: 'New Jersey', abbr: 'NJ', available: false },
  NM: { name: 'New Mexico', abbr: 'NM', available: false },
  NY: { name: 'New York', abbr: 'NY', available: true },
  NC: { name: 'North Carolina', abbr: 'NC', available: false },
  ND: { name: 'North Dakota', abbr: 'ND', available: false },
  OH: { name: 'Ohio', abbr: 'OH', available: false },
  OK: { name: 'Oklahoma', abbr: 'OK', available: false },
  OR: { name: 'Oregon', abbr: 'OR', available: false },
  PA: { name: 'Pennsylvania', abbr: 'PA', available: false },
  RI: { name: 'Rhode Island', abbr: 'RI', available: false },
  SC: { name: 'South Carolina', abbr: 'SC', available: false },
  SD: { name: 'South Dakota', abbr: 'SD', available: false },
  TN: { name: 'Tennessee', abbr: 'TN', available: false },
  TX: { name: 'Texas', abbr: 'TX', available: true },
  UT: { name: 'Utah', abbr: 'UT', available: false },
  VT: { name: 'Vermont', abbr: 'VT', available: false },
  VA: { name: 'Virginia', abbr: 'VA', available: false },
  WA: { name: 'Washington', abbr: 'WA', available: false },
  WV: { name: 'West Virginia', abbr: 'WV', available: false },
  WI: { name: 'Wisconsin', abbr: 'WI', available: false },
  WY: { name: 'Wyoming', abbr: 'WY', available: false },
};

export const getAvailableStatesList = () => {
  return Object.values(availableStates);
};

export const isStateAvailable = (stateAbbr) => {
  return availableStates[stateAbbr]?.available || false;
};

export const getCitiesForState = (stateAbbr) => {
  return availableStates[stateAbbr]?.cities || [];
};

