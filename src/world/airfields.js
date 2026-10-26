// The airfields on the map (D51, D52). Positions come from the US NGA GEOnet Names Server ("based on the Geographic
// Names Database", cited at the product owner's decision): its airfield entries where it has one, otherwise the
// village the airfield lay beside (to about 1 km; flagged as approximate). Which Luftwaffe fields were in use in the
// summer of 1940 is not confirmed from an allowed source; they are shown as fields round Calais and St-Omer.
//   kind: 'airfield' - the NGA entry is the airfield itself (feature class AIRF, AIRP or AIRQ)
//         'village'  - the NGA entry is the village; the airfield is placed there
import { toWorld } from './geo.js';

export const AIRFIELDS = [
  // RAF fighter stations and satellites (11 Group).
  { name: 'Hawkinge', side: 'RAF', lat: 51.1, lon: 1.166667, kind: 'village' },
  { name: 'Manston', side: 'RAF', lat: 51.34222, lon: 1.34611, kind: 'airfield' },
  { name: 'Lympne', side: 'RAF', lat: 51.066667, lon: 1.033333, kind: 'village' },
  { name: 'Biggin Hill', side: 'RAF', lat: 51.33083, lon: 0.0325, kind: 'airfield' },
  { name: 'Kenley', side: 'RAF', lat: 51.30341, lon: -0.09525, kind: 'airfield' },
  { name: 'Hornchurch', side: 'RAF', lat: 51.55, lon: 0.216667, kind: 'village' },
  { name: 'West Malling', side: 'RAF', lat: 51.283333, lon: 0.416667, kind: 'village' },
  { name: 'Detling', side: 'RAF', lat: 51.283333, lon: 0.583333, kind: 'village' },
  { name: 'Rochford', side: 'RAF', lat: 51.57028, lon: 0.69333, kind: 'airfield' }, // NGA: Southend
  // Luftwaffe fields round Calais and St-Omer.
  { name: 'Saint-Inglevert', side: 'Luftwaffe', lat: 50.88256, lon: 1.73603, kind: 'airfield' },
  { name: 'Calais-Marck', side: 'Luftwaffe', lat: 50.9621, lon: 1.95476, kind: 'airfield' }, // NGA: Calais Dunkerque
  { name: 'Saint-Omer', side: 'Luftwaffe', lat: 50.72859, lon: 2.2324, kind: 'airfield' }, // NGA: Saint Omer Wizernes
  { name: 'Wissant', side: 'Luftwaffe', lat: 50.885299, lon: 1.662632, kind: 'village' },
  { name: 'Marquise', side: 'Luftwaffe', lat: 50.812943, lon: 1.707863, kind: 'village' },
  { name: 'Guînes', side: 'Luftwaffe', lat: 50.867081, lon: 1.870254, kind: 'village' },
  { name: 'Caffiers', side: 'Luftwaffe', lat: 50.839851, lon: 1.811587, kind: 'village' },
].map((a) => ({ ...a, ...toWorld(a.lat, a.lon) }));

/** Each side's home airfield in the test version: the start of every flight. */
export const HOME = { RAF: 'Hawkinge', Luftwaffe: 'Saint-Inglevert' };

export const airfieldNamed = (name) => AIRFIELDS.find((a) => a.name === name);
