
const Waypoints = {
  yellowstone: {
    place_name: 'Yellowstone National Park, Wyoming',
    latitude: 44.4280,
    longitude: -110.5885,
  },
  grandTeton: {
    place_name: 'Grand Teton National Park, Wyoming',
    latitude: 43.7904,
    longitude: -110.6818,
  },
  lasVegas: {
    place_name: 'Las Vegas, Nevada',
    latitude: 36.1699,
    longitude: -115.1398,
  },
  miami: { place_name: 'Miami, Florida' },
  chicago: { place_name: 'Chicago, Illinois' },
  denver: { place_name: 'Denver, Colorado' },
};

function generateTripName(prefix = 'Automated Trip') {
  return `${prefix} ${new Date().toISOString()}`;
}

const EdgeCases = {
  specialCharacterName: `Röadtrip: "Summer & Sun" <2024>`,
  longName: 'A'.repeat(255),
  emptyName: '',
  whitespaceOnlyName: '   ',
  xssAttempt: '<script>alert("xss")</script>',
};

module.exports = { Waypoints, generateTripName, EdgeCases };
