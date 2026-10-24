# Aircraft Data

Research record for the five aircraft, compiled in Phase 0 (24 Oct 2026).
All values are stored in SI units. The original figure and unit from the source are kept beside it.

## How to read this file

- **Source:** the Source column holds source IDs (S1, S2 …) from the list below. Estimates use `ASSUMPTION`.
- **Confidence:**
  - `high`: two or more independent sources agree, or a museum record of an original aircraft or engine gives it.
  - `medium`: any of the following:
    - one source;
    - a scan or transcription read on an archive website (DECISIONS.md D8);
    - a figure from a close variant (for example the Spitfire Mk V airframe for the Mk I);
    - sources that disagree slightly (the disagreement is written in Notes).
  - `estimate`: not found in any source. The reason and method are in Notes. Phase 1 tunes these.
- **Nothing is filled silently.** Anything not found is listed under "Open research gaps" at the bottom with no value.
  `tests/aircraftData.test.js` checks every row of every table that has the column headings used below.
- **Phase 0 records only what the sources say.** The quantities the flight model must derive or estimate are added in
  Phase 1, each with its method shown: drag coefficients, Oswald efficiency, inertia, CG positions in the model frame,
  and propeller efficiency curves.
- **Conversions:**
  - 1 ft = 0.3048 m; 1 lb = 0.45359237 kg; 1 mph = 0.44704 m/s; 1 Imperial gallon = 4.54609 L.
  - 1 bhp = 0.7457 kW; 1 PS = 0.7355 kW.
  - Absolute manifold pressure = 101.325 kPa + boost (lb/sq in) × 6.8948 kPa. 1 ata = 98.0665 kPa.
- **Speeds:** speeds called IAS or ASI are indicated airspeeds (as read in the cockpit). All other speeds are true airspeeds.
- **Abbreviations used in Notes:**
  - A&AEE: the Aeroplane and Armament Experimental Establishment (Martlesham Heath, later Boscombe Down);
  - RAE: the Royal Aircraft Establishment, Farnborough;
  - AFDU: the Air Fighting Development Unit;
  - NACA: the US National Advisory Committee for Aeronautics.

## Chosen variants (product owner, 24 Oct 2026; see DECISIONS.md D9)

| Aircraft | Variant modelled |
|---|---|
| Hurricane Mk I | Merlin III, metal wings, Rotol constant-speed airscrew, 100-octane fuel, +12 lb/sq in emergency boost |
| Spitfire Mk I | Merlin III, constant-speed airscrew, 100-octane fuel, +12 lb/sq in emergency boost |
| Bf 109 E-4 | DB 601A (A or Aa still to be settled, see gaps), VDM three-blade airscrew |
| Bf 110 C-4 | 2 × DB 601A, VDM feathering airscrews |
| He 111 H-3 | 2 × Jumo 211 (sub-type disputed, see gaps). AI only |

## Sources

| ID | Source | URL | Type |
|---|---|---|---|
| S1 | Air Ministry, Aircraft Data Sheet, Hurricane I (Merlin III), Card No. 1, dated 6 Aug 1941 | http://www.wwiiaircraftperformance.org/hurricane/hurricane-I-ads.jpg | Period official data sheet (scan on archive site) |
| S2 | RAE chart "Hurricane I, Merlin III": all-out level speed (Boscombe Down measured and calculated), maximum weak-mixture speed and best climbing speed against height, dated 26 Aug 1941 | http://www.wwiiaircraftperformance.org/hurricane/hurricane-I-raechart.jpg | Period test chart (scan on archive site) |
| S3 | RAE chart "Spitfire I, Merlin III": the same quantities as S2, with pencilled lines for +12 and +16 lb/sq in boost, dated 25 Aug 1941 | https://web.archive.org/web/2015/http://www.spitfireperformance.com/spitfire-I-rae-12lbs.jpg | Period test chart (scan on archive site, read via the Internet Archive) |
| S4 | A&AEE Martlesham Heath, performance trials of Spitfire I N3171 (Merlin III, Rotol constant-speed airscrew) against the two-pitch K9793 (Air Ministry letter B.9242/39/A.D./R.D.L., 4 Nov 1939; trials early 1940) | https://web.archive.org/web/2024/http://www.spitfireperformance.com/n3171.html | Period test report (transcription on archive site) |
| S5 | A&AEE Martlesham Heath, performance trials of Spitfire I K9787 (Merlin II, wooden fixed-pitch airscrew), 18 Aug to 12 Dec 1938 | https://web.archive.org/web/2024/http://www.spitfireperformance.com/k9787.html | Period test report (transcription on archive site) |
| S6 | Air Publication 1565A, Spitfire I Pilot's Notes: engine limitations, combat concessions and flying limitations (extract) | https://web.archive.org/web/2024/http://www.spitfireperformance.com/spit1pn2-a.jpg | Pilot's Notes (scan on archive site) |
| S7 | Air Publication 1590B/J.2-W, "Merlin II and III – Use of +12 lb./sq.in. Boost Pressure – Alterations and Precautions", 20 Mar 1940; and A.P. 1590B pp. 16-17 (Merlin II/III description, amendment 7A) | http://www.wwiiaircraftperformance.org/ap1590b.jpg and http://www.wwiiaircraftperformance.org/hurricane/AP1590B-p16-17.jpg | Engine Air Publication (scans on archive site) |
| S8 | Pilot's Notes, Merlin II, III and IV, 4th edition, April 1940, p. 6: emergency +12 lb/sq in boost | http://www.wwiiaircraftperformance.org/hurricane/pilots-notes-merlin3-pg6.jpg | Pilot's Notes (scan on archive site) |
| S9 | Chart "Merlin Engines – Max. Powers Level Flight" (Merlin III and Merlin XX at 3,000 rpm, normal and +12 lb/sq in emergency conditions), marked SECRET; the issuing body is not named on the archive page | https://web.archive.org/web/2015/http://www.spitfireperformance.com/merlin3curve.jpg | Period engine chart (scan on archive site; origin not stated) |
| S10 | Ministry of Aircraft Production letter S.35616/DD/RDQ to HQ Fighter Command, 29 Jun 1940, "Conversion of Hurricane Aircraft D.H. Two-Pitch Airscrews to Constant Speed" | http://www.wwiiaircraftperformance.org/hurricane/hurricane-csprop.jpg | Period official letter (scan on archive site) |
| S11 | W. H. Phillips and J. R. Vensel, "Measurements of the Flying Qualities of a Supermarine Spitfire VA Airplane", NACA Advance Confidential Report, Sept 1942 (tests 30 Dec 1941 to 29 Jan 1942) | https://ntrs.nasa.gov/citations/19930092582 | Government research report |
| S12 | J. M. Nissen and W. H. Phillips, "Measurements of the Flying Qualities of a Hawker Hurricane Airplane", NACA Memorandum Report, April 1942 (Hurricane II Z2963; tests 25 Nov to 28 Dec 1941) | https://ntrs.nasa.gov/citations/19930092603 | Government research report |
| S13 | W. H. Phillips, "Comparison of Aileron Control Characteristics as Determined in Flight Tests of P-36, P-40, Spitfire, and Hurricane Pursuit Airplanes", NACA, August 1942 | https://ntrs.nasa.gov/citations/20150015694 | Government research report |
| S14 | D. Lednicer, "The Incomplete Guide to Airfoil Usage", UIUC Applied Aerodynamics Group, University of Illinois | https://m-selig.ae.illinois.edu/ads/aircraft.html | University-hosted reference compilation |
| S15 | Bf 109 E Flugzeug-Handbuch, Berlin, 16 Dec 1939: Flugleistungskurven (Anlage 4, Blatt 3) and Teil IV Flug p. 18 (Flugbegrenzungen, best climbing speeds, engine operating data) | http://www.wwiiaircraftperformance.org/me109/me109e-handbookcurve.jpg and http://www.wwiiaircraftperformance.org/me109/me109e-enginelimits.jpg | Luftwaffe handbook (scans on archive site) |
| S16 | Flugzeugdatenblatt 109 E-1 / E-3 (Anlage 4, Blatt 1) and Muster eines Ladeplanes Bf 109 E-3 (Anlage 5, Blatt 2). The document title is not given on the archive page; the Anlage numbering matches S15 | http://www.wwiiaircraftperformance.org/me109/Me-109e-flugzeugdatenblatt.jpg and http://www.wwiiaircraftperformance.org/me109/Me109e3-ladeplanes.jpg | Luftwaffe data sheet and loading plan (scans on archive site) |
| S17 | Messerschmitt, "Baubeschreibung für das Flugzeugmuster Messerschmitt Me 109 mit Daimler-Benz-Motor DB 601", pp. 48-53 (Datenblatt Me 109), c. 1939 | http://www.kurfurst.org/Performance_tests/109E_Baubeschreibung/109E3_Baubeschreibung.html | Manufacturer's specification (German transcription on archive site) |
| S18 | Daimler-Benz, "Betriebs- und Wartungsvorschrift zum Mercedes-Benz Flugmotor DB 601 A u. B", Ausgabe C, October 1940, p. 21 (Leistungs- und Verbrauchsangaben) and p. 22 (Bild 6, Höhenleistungslinien) | http://www.wwiiaircraftperformance.org/me109/db601-oct40-operation-maintenance-manual-p21.jpg and http://www.wwiiaircraftperformance.org/me109/DB601A-B-oct40-pg22.jpg | Engine manual (scans on archive site) |
| S19 | Daimler-Benz DB 601 A-1 data sheet, via Messerschmitt AG, Augsburg, 25 Jul 1941 | http://www.kurfurst.org/Engine/DB60x/DB601_datasheets_A1.html | Engine data sheet (English transcription on archive site) |
| S20 | A&AEE Boscombe Down, Report A.&A.E.E./755, "Messerschmitt 109 Fighter, Brief Handling Trials", June 1940 (TNA AVIA 18/703) | http://www.wwiiaircraftperformance.org/me109/me109e-aaee.pdf | Period test report (scan on archive site) |
| S21 | W/Cdr G. H. Stainforth, "Report on Investigation of Turning Circles of M.E.109, Spitfire and Hurricane", 9 Jun 1940 | http://www.wwiiaircraftperformance.org/hurricane/109-spit-hurri-turn.pdf | Period trial report (scan on archive site) |
| S22 | Ob.d.L. Führungsstab Ia Nr. 8092/40 g.K. (passed on as Lfl.Kdo. 3 Nr. 3951/40), "Vergleichsfliegen Bf 109 E, Bf 110 C, Spitfire, Hurricane und Curtiss" (comparison flights at E-Stelle Rechlin), 1940 | http://www.kurfurst.org/Tactical_trials/109E_vergleich110SpitHurCurtiss/109E_vergleichsflg_Aug1940.html | Luftwaffe report (English translation on archive site, beside a scan of the original) |
| S23 | Vorläufiges Datenblatt Bf 110 C-1, C-2, and Flugleistungs-Kurvenblatt Bf 110 C-1 und C-2 (DB 601 A) | http://www.wwiiaircraftperformance.org/me110/Me110C_data-sheet.jpg and http://www.wwiiaircraftperformance.org/me110/Me110C_level-speeds.jpg | Luftwaffe provisional data sheet (scans on archive site) |
| S24 | Air Ministry A.I.1(g), A.M. Pamphlet 114C, "Instructions for Flying the Messerschmitt 110", printed June 1941 | http://www.wwiiaircraftperformance.org/me110/AM_Flying_Instructions_Me110.pdf | Period flying instructions from RAE flying of a captured aircraft (scan on archive site) |
| S25 | Air Fighting Development Unit, RAF Duxford, Report No. 38 (A.F.C. 123), "Tactical Trials – Messerschmitt 110" (aircraft force-landed in England July 1940; trials from 13 Oct 1941; RAE copy stamped 24 Mar 1942) | http://www.wwiiaircraftperformance.org/me110/Me-110_Tactical_Trials.pdf | Period trial report (scan on archive site) |
| S26 | Deutsches Museum, Flugwerft Schleissheim, CASA 2.111B exhibit page | https://www.deutsches-museum.de/en/flugwerft-schleissheim/exhibition/military-aviation/casa-2111 | Museum page (licence-built close variant, see Notes) |
| S27 | US Office of the Chief of Ordnance, "Catalog of Enemy Ordnance" (1945): MG 17 and MG 15 entries | https://www.lonesentry.com/ordnance/tag/mg-17/ and https://www.lonesentry.com/ordnance/tag/mg-15/ | Period US government publication (transcription on archive site) |

**Archive sites used (D8):**
- wwiiaircraftperformance.org;
- spitfireperformance.com, read through the Internet Archive because the domain has lapsed;
- kurfurst.org;
- lonesentry.com.

Each source above names the original document. The site owners' own commentary was not used.

**Consulted but not used for any value:**
- RAF Museum pages for Spitfire I X4590, Bf 109 E-3 4101 and He 111 H-20 701152: no technical figures.
- Science Museum Group collection: blocked automated reading; not bypassed.
- HQ AASF, "Report of Comparative Trials of Hurricane versus Messerschmitt 109", 7 May 1940: qualitative only.
- Messerschmitt "Wendezeiten" turn-time chart of 26 Aug 1940: the scan is too poor to read.
- Wikipedia, forums, hobby and game sites: excluded by policy.

---

## Hawker Hurricane Mk I (Merlin III)

S1 and S2 describe the Hurricane I with the Merlin III. They do not say which airscrew was fitted (see gaps).
S12 is a Hurricane **II** (Merlin XX, longer nose, heavier). Its wing and tail are the same design as the metal-winged Mk I,
so it is used for wing geometry, control surfaces, stall and handling only, rated medium as a close variant.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan | 12.192 | m | 40 ft | S1, S12 | high | S12 (Mk II, same wing) also gives 40 ft. |
| Gross wing area | 23.97 | m² | 258 sq ft | S1, S12 | high | S12 measured 257.6 sq ft. |
| Length | 9.576 | m | 31 ft 5 in | S1 | medium | S12's Mk II is 31 ft 6 in (longer Merlin XX nose). |
| Height | 3.200 | m | 10 ft 6 in | S1 | medium | Attitude not stated. S12 gives 12 ft 2 in with the datum line level, a different attitude. |
| Aspect ratio | 6.22 | — | 6.22 | S12 | medium | Close variant (same wing). Consistent with S1: 40² / 258 = 6.20. |
| Mean aerodynamic chord | 2.141 | m | 84.3 in | S12 | medium | 5.2 in behind the wing leading edge (S12). |
| Taper ratio | 2.03 | — | 2.03:1 | S12 | medium | |
| Dihedral, outer panels | 3.5 | deg | +3.5° | S12 | medium | |
| Wing incidence to fuselage datum | 2.0 | deg | +2.0° ± ½° | S12 | medium | |
| Leading-edge sweepback | 5.1 | deg | 5.1° | S12 | medium | |
| Aerofoil, root | Clark YH 19% | — | Clark YH 19 percent modified | S12, S14 | high | S12 says "modified". |
| Aerofoil, tip | Clark YH 12.2% | — | Clark YH 12.2 percent | S12, S14 | high | |
| Split flaps, total area | 2.333 | m² | 25.11 sq ft | S12 | medium | Split trailing-edge flaps. |
| Split flaps, travel | 80 | deg | 80° down | S12 | medium | |
| Aileron area, each | 0.948 | m² | 10.2 sq ft | S12 | medium | Balance area 2.92 sq ft each. |
| Aileron travel | 21 | deg | right: down 21.5°, up 20.6°; left: down 19.2°, up 22.4° | S12 | medium | Average of the four measured figures, rounded. |
| Tailplane area | 2.239 | m² | 24.1 sq ft (including 2.5 sq ft fuselage) | S12 | medium | Incidence 1½° to datum. |
| Elevator area | 1.208 | m² | 13.0 sq ft | S12 | medium | Behind the hinge line, including horn balance. |
| Elevator travel | 26 | deg | ±26° | S12 | medium | |
| Tare weight | 2374 | kg | 5,234 lb | S1 | medium | |
| Light weight (no fuel, bombs or ammunition) | 2640 | kg | 5,820 lb | S1 | medium | |
| Mean weight | 2921 | kg | 6,440 lb | S1 | medium | The weight the S1 performance figures are quoted at. |
| Maximum weight | 3081 | kg | 6,793 lb | S1 | medium | |
| Fuel carried | 441 | L | 97 gallons | S1 | medium | Imperial gallons. |
| Engine | Rolls-Royce Merlin III | — | Merlin III | S1, S2 | high | Single-speed supercharged V-12, glycol-cooled, carburettor (S7). |
| Airscrew on new aircraft from mid-1940 | Rotol constant-speed | — | Hurricane I aircraft now being delivered from the manufacturers all have Rotol constant speed airscrews | S10 | medium | Letter of 29 Jun 1940. Older aircraft kept de Havilland two-pitch airscrews; conversion was not to start before mid-September 1940. |
| Engine maximum power (normal boost) | 768 | kW | 1,030 bhp at 16,250 ft | S1 | medium | At +6¼ lb/sq in. Agrees with the +6¼ curve of S9. |
| Engine rated altitude (normal boost) | 4953 | m | 16,250 ft | S1 | medium | |
| Maximum speed (mean weight) | 141.3 | m/s | 316 mph at 17,750 ft | S1, S2 | medium | At +6¼ lb/sq in. S2 is the same Boscombe Down data, so not independent. |
| Maximum speed altitude | 5410 | m | 17,750 ft | S1 | medium | |
| All-out level speed at sea level | 116.7 | m/s | 261 mph | S2 | medium | Boscombe Down, normal boost, read from chart (±1 mph). +12 lb boost not shown. |
| All-out level speed at 1,524 m | 123.4 | m/s | 276 mph at 5,000 ft | S2 | medium | As above. |
| All-out level speed at 3,048 m | 130.1 | m/s | 291 mph at 10,000 ft | S2 | medium | As above. |
| All-out level speed at 4,572 m | 137.2 | m/s | 307 mph at 15,000 ft | S2 | medium | As above. |
| All-out level speed at 6,096 m | 140.4 | m/s | 314 mph at 20,000 ft | S2 | medium | As above. |
| All-out level speed at 7,620 m | 137.2 | m/s | 307 mph at 25,000 ft | S2 | medium | As above. |
| All-out level speed at 9,144 m | 130.5 | m/s | 292 mph at 30,000 ft | S2 | medium | As above. |
| Best climbing speed at sea level | 73.3 | m/s | 164 mph TAS | S2 | medium | Read from chart. |
| Best climbing speed at 3,048 m | 85.8 | m/s | 192 mph TAS at 10,000 ft | S2 | medium | Read from chart. |
| Best climbing speed at 6,096 m | 93.4 | m/s | 209 mph TAS at 20,000 ft | S2 | medium | Read from chart. |
| Time to 6,096 m (maximum weight) | 582 | s | 9.7 min to 20,000 ft | S1 | medium | Normal boost. |
| Service ceiling (maximum weight) | 9906 | m | 32,500 ft | S1 | medium | |
| Service ceiling (mean weight) | 10211 | m | 33,500 ft | S1 | medium | |
| Take-off distance over 15 m (maximum weight) | 430 | m | 470 yd over 50 ft | S1 | medium | Airscrew not stated. |
| Landing distance over 15 m (light weight) | 494 | m | 540 yd over 50 ft | S1 | medium | |
| Armament | 8 × .303 in machine guns in the wings | — | .303, 8, forward, wings | S1 | medium | The gun type (Browning) is not named in S1. |
| Rounds per gun | 334 | rounds | 334 | S1 | medium | |
| Stalling speed, flaps and gear up, power off | 38.7 | m/s | 86.5 mph IAS | S12 | medium | Mk II at 7,014 lb, gun ports closed. With ports open: 89.5 mph. |
| Stalling speed, landing condition | 31.4 | m/s | 70.3 mph IAS | S12 | medium | Mk II at 7,014 lb, ports closed. Ports open: 72.6 mph. |
| Maximum lift coefficient, flaps up, power off | 1.41 | — | 1.41 | S12 | medium | Ports closed; ports open 1.31. |
| Maximum lift coefficient, landing condition | 2.14 | — | 2.14 | S12 | medium | Ports closed; ports open 2.00. |
| Stall behaviour | Root stalls first; buffet warning before roll-off | — | flow separation first at the centre section | S12 | medium | Qualitative; used to shape the stall model. |
| Stick-force gradient in manoeuvres | 36.0 | N/g | 8.1 lb per g | S12 | medium | Above the 6 lb/g upper limit NACA recommended. |
| Roll helix angle, full aileron | 0.082 | rad | pb/2V 0.082 | S13 | medium | Low speed, where full deflection can be reached. |
| Roll helix angle with 30 lb stick force at 230 mph IAS, 10,000 ft | 0.057 | rad | pb/2V 0.057 | S13 | medium | |
| Roll rate with 30 lb stick force at 230 mph IAS, 10,000 ft | 1.117 | rad/s | 64 deg/s | S13 | medium | Heavy ailerons limit high-speed roll (S13). |

## Supermarine Spitfire Mk I (Merlin III)

S4 is the key test: a production Spitfire I with the Merlin III and a Rotol constant-speed airscrew. It was flown at
+6¼ lb/sq in only. No test of a Spitfire I at +12 lb/sq in was found (see gaps). S11 is a Spitfire **VA** (Merlin 45).
Its airframe and wing are the Mk I's, so it is used for geometry, stall and handling, rated medium as a close variant.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan | 11.252 | m | 36 ft 11 in | S11 | medium | Close variant (VA). Area × aspect ratio in S11 gives 36 ft 10.5 in. The commonly quoted 36 ft 10 in was not found in an allowed source. |
| Wing area | 22.48 | m² | 242 sq ft | S11 | medium | Close variant. |
| Aspect ratio | 5.62 | — | 5.62 | S11 | medium | |
| Mean aerodynamic chord | 2.159 | m | 7 ft 1 in | S11 | medium | 4.8 in behind the leading edge of the wing root (approximate, S11). |
| Planform | elliptical | — | elliptical | S11 | medium | |
| Dihedral (leading edge) | 6.0 | deg | 6.0° | S11 | medium | |
| Wing incidence, root | 2.1 | deg | 2.1° from thrust axis | S11 | medium | |
| Wing incidence, tip | 0 | deg | 0° | S11 | medium | 2.1° of washout. |
| Aerofoil, root | NACA 2213 | — | NACA 2212 (S11); NACA 2213 (S14) | S11, S14 | medium | Sources disagree on thickness. S14 is used; S11's figure is noted. |
| Aerofoil, tip | NACA 2209.4 | — | NACA 2208 (S11); NACA 2209.4 (S14) | S11, S14 | medium | As above. |
| Length | 9.119 | m | 29 ft 11 in | S11 | medium | Close variant; the Mk V nose is similar. |
| Height (datum level) | 3.327 | m | 10 ft 11 in | S11 | medium | |
| Split flaps, total area | 1.449 | m² | 15.6 sq ft | S11 | medium | Flap span 17 ft 10 in. |
| Split flaps, travel | 85 | deg | 85° | S11 | medium | |
| Aileron area, each | 0.878 | m² | 9.45 sq ft | S11 | medium | Metal-covered on the VA. Balance area 2.45 sq ft. Mk I ailerons were fabric-covered (see gaps). |
| Tailplane area | 1.867 | m² | 20.1 sq ft (including 2.15 sq ft fuselage) | S11 | medium | 0° incidence. |
| Elevator area | 1.232 | m² | 13.26 sq ft | S11 | medium | Trim tab 0.84 sq ft. |
| Tare weight (N3171) | 2138 | kg | 4,713 lb | S4 | medium | As tested, with armour over the fuel tank and a bullet-proof windscreen. |
| Flying weight on trials (N3171) | 2744 | kg | 6,050 lb | S4 | medium | |
| Fuel carried | 382 | L | 84 gallons | S4, S5 | high | Two separate A&AEE reports. S11 (VA) gives 85 gallons. |
| Oil carried | 25 | L | 5½ gallons | S4, S5 | high | |
| Engine | Rolls-Royce Merlin III | — | Merlin III | S4 | medium | Normal rating 950/990 bhp at 12,250 ft, 2,600 rpm, +6¼ lb/sq in (S4). |
| Airscrew | Rotol constant-speed, 3 blades | — | Rotol, 3 blades | S4 | medium | |
| Airscrew diameter | 3.277 | m | 10 ft 9 in | S4 | medium | S11 (VA, Rotol) gives 10 ft 10 in. |
| Airscrew pitch range | 35 | deg | 35° 0′ | S4 | medium | Fine 23° 20′; coarse 58° 20′ (the coarse figure is estimated in S4 itself). |
| Maximum speed (+6¼ lb/sq in, 3,000 rpm) | 158.2 | m/s | 354 mph at 18,900 ft | S4 | medium | N3171, bullet-proof windscreen. S3 shows 354 mph at about 18,500 ft. |
| Maximum speed altitude | 5761 | m | 18,900 ft | S4 | medium | Full-throttle height. |
| Level speed at 3,048 m | 143.3 | m/s | 320.5 mph at 10,000 ft | S4 | medium | S3 gives 321. |
| Level speed at 4,572 m | 151.5 | m/s | 339 mph at 15,000 ft | S4 | medium | S3 gives 339. |
| Level speed at 6,096 m | 158.0 | m/s | 353.5 mph at 20,000 ft | S4 | medium | |
| Level speed at 7,925 m | 152.7 | m/s | 341.5 mph at 26,000 ft | S4 | medium | |
| Level speed at 9,144 m | 142.6 | m/s | 319 mph at 30,000 ft | S4 | medium | S3 gives 319. |
| Level speed at sea level (+6¼ lb/sq in) | 126.5 | m/s | 283 mph | S3 | medium | Read from chart. Not measured in S4. |
| Level speed at 1,524 m (+6¼ lb/sq in) | 135.0 | m/s | 302 mph at 5,000 ft | S3 | medium | Read from chart. |
| Level speed at sea level (+12 lb/sq in) | 141.3 | m/s | about 316 mph | S3 | medium | A pencilled line on the RAE chart, probably calculated rather than flown. Read ±3 mph. The only +12 lb speed figure found. |
| Effect of rpm on speed | +4 mph at 2,800 rpm instead of 3,000 | — | about 4 mph faster below full-throttle height | S4 | medium | 17 bhp less at 3,000 rpm and constant boost. |
| Effect of bullet-proof windscreen | −6 mph | — | loss of 6 mph | S4 | medium | |
| Rate of climb at 610 m | 14.3 | m/s | 2,820 ft/min at 2,000 ft | S4 | medium | Climb at 2,600 rpm, +6¼ lb/sq in. |
| Time to 3,048 m | 210 | s | 3.5 min to 10,000 ft | S4 | medium | Recommended climbing speed. |
| Time to 4,572 m | 318 | s | 5.3 min to 15,000 ft | S4 | medium | |
| Time to 6,096 m | 462 | s | 7.7 min to 20,000 ft | S4 | medium | |
| Time to 7,620 m | 654 | s | 10.9 min to 25,000 ft | S4 | medium | |
| Time to 9,144 m | 984 | s | 16.4 min to 30,000 ft | S4 | medium | |
| Best climbing speed | 62.6 | m/s | 140 mph ASI to 12,000 ft, then −1 mph per 1,000 ft | S4 | medium | S4 recommends 162 mph ASI instead (steep attitude and poor view at 140). |
| Service ceiling | 10577 | m | 34,700 ft | S4 | medium | Estimated absolute ceiling 35,600 ft. |
| Take-off run | 206 | m | 225 yd | S4 | medium | Zero wind, standard atmosphere. |
| Take-off distance over 15 m | 338 | m | 370 yd over 50 ft | S4 | medium | |
| Stalling speed, flaps up | 34.9 | m/s | 78 mph ASI | S4 | medium | |
| Stalling speed, flaps down | 30.4 | m/s | 68 mph ASI | S4 | medium | |
| Maximum lift coefficient in accelerated flight | 1.21 | — | 1.21 | S11 | medium | Average through a stalled turn about 1.10. |
| Stall behaviour | Good buffet warning; can be flown partly stalled without roll-off | — | excellent stall warning | S11 | medium | With gun ports open, a right roll came after 10° of up-elevator beyond the buffet. |
| Stick-force gradient in manoeuvres | 22.2 | N/g | 5.0 lb per g | S11 | medium | Pilots thought it a little too light. Low longitudinal stability. |
| Roll helix angle, full aileron | 0.085 | rad | pb/2V 0.085 | S13 | medium | Full deflection was not obtainable much above 140 mph (S11). |
| Roll helix angle with 30 lb stick force at 230 mph IAS, 10,000 ft | 0.050 | rad | pb/2V 0.050 | S13 | medium | S11 gives 0.051. |
| Roll rate with 30 lb stick force at 230 mph IAS, 10,000 ft | 1.100 | rad/s | 63 deg/s | S13 | medium | |
| Roll helix angle with 40 lb stick force at 300 mph | 0.04 | rad | pb/2V 0.04 | S11 | medium | Only half the aileron deflection could be reached. |
| Maximum diving speed | 201.2 | m/s | 450 mph IAS | S6 | medium | |
| Maximum speed, undercarriage down | 71.5 | m/s | 160 mph IAS | S6 | medium | |
| Maximum speed, flaps down | 62.6 | m/s | 140 mph IAS | S6 | medium | |
| Armament | 8 × .303 in machine guns in the wings | — | eight guns | S4 | medium | Rounds per gun not found (see gaps). |

## Rolls-Royce Merlin III (Hurricane I and Spitfire I)

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Layout | 12-cylinder 60° V, glycol-cooled, geared, single-speed supercharger | — | 12-cylinder V-type … glycol-cooled, geared and highly supercharged | S7 | medium | A.P. 1590B p. 16 (Merlin II; the Merlin III is "basically similar", p. 17). |
| Carburation | Two carburettors, coolant-jacketed and oil-heated | — | two coolant-jacketed and oil heated carburettors | S7 | medium | The carburettor type is not named in S7. S22 reports that the carburettor cuts out under negative g and that the Luftwaffe exploited this. |
| Reduction gear ratio | 0.477 | — | 0.477:1 | S11, S12 | medium | Given for the Merlin 45 (S11) and the Merlin XX (S12). Not found for the Merlin III itself. |
| Normal maximum boost | 144.4 | kPa | +6¼ lb/sq in | S4, S6 | high | Absolute pressure. |
| Emergency boost (100-octane fuel) | 184.1 | kPa | +12 lb/sq in | S6, S7, S8 | high | Absolute pressure. Obtained by pulling the boost-control cut-out. |
| Altitude to which +12 lb/sq in can be held | 3048 | m | about 10,000 ft | S7, S8 | high | Above it, boost falls to normal at the operational height. |
| Time limit at +12 lb/sq in | short periods (emergency) | — | for short periods under emergency conditions | S6, S7 | high | No minutes given. Dowding's 1 Aug 1940 letter on Merlin handling (on the archive site) is not yet read. The chosen 5-minute game limit is therefore a modelling choice, flagged in DECISIONS.md D9. |
| Fuel consumption increase at +12 lb/sq in | 40 | % | about 40 per cent | S7 | medium | |
| Combat rpm limit below 6,096 m | 298.5 | rad/s | 2,850 rpm (½ hr limit) | S6 | medium | Crankshaft speed. Above 20,000 ft: 3,000 rpm (½ hr). |
| Diving rpm limit | 3,600 rpm for 20 s | — | maximum 3,600 r.p.m.; 3,000 may be exceeded only for 20 s with throttle at least one third open | S6 | medium | Read from the Pilot's Notes extract. |
| Minimum rpm at +6¼ lb/sq in | 2,080 rpm | — | minimum r.p.m. 2,080 | S6 | medium | |
| Power at sea level, +6¼ lb/sq in, 3,000 rpm | 656 | kW | about 880 bhp | S9 | medium | Read from chart (±10 bhp), level flight. |
| Power at sea level, +12 lb/sq in, 3,000 rpm | 884 | kW | about 1,185 bhp | S9 | medium | Read from chart (±10 bhp). |
| Peak power, +12 lb/sq in, 3,000 rpm | 977 | kW | about 1,310 bhp | S9 | medium | Read from chart (±10 bhp), at about 9,000 ft in level flight. The height is uncertain (chart scale). |
| Peak power, +6¼ lb/sq in, 3,000 rpm | 768 | kW | 1,030 bhp at 16,250 ft | S1, S9 | high | S1 and the chart agree. |

## Messerschmitt Bf 109 E-4 (DB 601A)

No E-4 specific document was found. The data are for the E-1 and E-3 (same airframe and engine). The E-4 differed
in armament and armour (details and weights are open gaps). This is flagged as a deviation.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan | 9.90 | m | 9,90 m | S16, S17 | high | |
| Wing area | 16.40 | m² | 16,4 m² | S16, S17 | high | |
| Length | 8.76 | m | 8,76 m (S17); 8,8 m (S16) | S16, S17 | high | Agree within S16's rounding. |
| Height | 2.45 | m | 2,45 m (S17); 2,6 m (S16) | S16, S17 | medium | Sources disagree, possibly a different attitude. |
| Aerofoil, root | NACA 2R1 14.2 | — | NACA 2R1 14.2 | S14 | medium | |
| Aerofoil, tip | NACA 2R1 11 | — | NACA 2R1 11 | S14 | medium | |
| Empty weight (E-3) | 1865 | kg | Leergewicht 1865 kg | S16 | medium | |
| Equipped weight (E-3) | 2053 | kg | Rüstgewicht 2053 kg | S16 | medium | Empty plus 188 kg of additional equipment. |
| Flying weight, full (E-3, no armour plate) | 2608 | kg | Fluggewicht voll 2608 kg | S16 | medium | S17 gives 2,540 kg for an earlier specification. |
| Fuel | 304 | kg | Kraftstoff 400 Liter, 0–304 kg | S16, S17 | high | 400 L. S17: 400 L = 303 kg. |
| Oil | 27 | kg | Schmierstoff 29,5 Liter, 9–27 kg | S16 | medium | S17: 30 L = 27 kg. |
| Pilot with parachute | 100 | kg | Führer + Fallschirm + Sonderbekleidung 70–100 kg | S16 | medium | |
| Ballast | 25 | kg | Ballast 25 kg | S16 | medium | |
| CG, full (E-3) | 0.616 | m | 61,6 cm behind the leading edge at wing rib 1 | S16 | medium | Permitted range 43.8–66.6 cm. Empty-weight CG 27.0 cm. |
| Engine | Daimler-Benz DB 601A | — | DB 601 A | S16 | medium | Inverted V-12, direct fuel injection, 33.93 L, 87-octane fuel (S19). |
| Reduction gear ratio | 1.55 | — | 1 : 1,55 | S16, S19 | high | Engine turns 1.55 times per airscrew turn. |
| Airscrew | VDM three-blade, 3.1 m diameter | — | Luftschraube 3flügelig, 3,1 Ø | S16 | medium | VDM airscrew; automatic pitch control could be fitted (S19). |
| Airscrew diameter | 3.1 | m | 3,1 m | S16 | medium | |
| Airscrew rotation | left, seen from the power-output side (DIN 9001) | — | left (seen from the power transition side DIN 9001) | S19 | medium | The direction seen from the cockpit must be worked out in Phase 1. S20 reports a slight swing right on take-off, then left once airborne. |
| Maximum speed at sea level (E-1) | 127.8 | m/s | 460 km/h | S16 | medium | S17's specification gives 500 km/h (±5%). This is a large disagreement: see the deviation note below. |
| Maximum speed at 1 km | 133.3 | m/s | 480 km/h | S16 | medium | |
| Maximum speed at 2 km | 138.9 | m/s | 500 km/h | S16 | medium | |
| Maximum speed at 3 km | 144.4 | m/s | 520 km/h | S16 | medium | |
| Maximum speed at 4 km | 150.0 | m/s | 540 km/h | S16 | medium | |
| Maximum speed at 5 km | 154.2 | m/s | 555 km/h | S16 | medium | S17: 570 km/h. |
| Maximum speed at 6 km | 154.2 | m/s | 555 km/h | S16 | medium | S17: 565 km/h. |
| Maximum speed at 7 km | 152.8 | m/s | 550 km/h | S16 | medium | S17: 560 km/h. |
| Time to 1 km | 60 | s | 1,0 min | S17 | medium | Specification, ±8%, at 2,540 kg. |
| Time to 2 km | 114 | s | 1,9 min | S17 | medium | As above. |
| Time to 3 km | 180 | s | 3,0 min | S17 | medium | As above. |
| Time to 4 km | 228 | s | 3,8 min | S17 | medium | S22 (Rechlin comparison, 1940) gives 4.4 min. |
| Time to 4 km in the Rechlin comparison flights | 264 | s | 4.4 min | S22 | medium | Weight and sub-type not stated. In the same flights: Spitfire 5 min, Hurricane 5.6 min, both captured aircraft, and "partly" two-pitch airscrews. |
| Time to 5 km | 294 | s | 4,9 min | S17 | medium | |
| Time to 6 km | 378 | s | 6,3 min | S17 | medium | |
| Service ceiling | 11000 | m | 11 000 m | S17 | medium | With full equipment. |
| Smallest turn radius at sea level, flaps up | 170 | m | 170 m | S17 | medium | Specification figure. With flaps: 125 m. |
| Smallest turn radius at 6 km, flaps up | 320 | m | 320 m | S17 | medium | With flaps: 230 m. |
| Take-off distance to 20 m | 470 | m | 470 m (S15); 420 m at 2,540 kg (S17) | S15, S17 | medium | Ground run 260 m (S15). |
| Landing distance from 20 m | 530 | m | 530 m (S15); 485 m (S17) | S15, S17 | medium | |
| Landing speed | 34.7 | m/s | 125 km/h | S17 | medium | |
| Stalling speed, flaps and gear up | 41.7 | m/s | 150 km/h (81 mph) ASI | S20 | medium | |
| Stalling speed, flaps and gear down | 27.8 | m/s | 100 km/h (62 mph) ASI | S20 | medium | |
| Stall behaviour | Left wing drops, nose turns left; warning by pitching and a high sink rate | — | left wing tends to drop … falls into a spin if held | S20 | medium | |
| Slat behaviour in hard turns | Uneven opening of the slats causes lateral flicking and loss of turn rate | — | slots opening unevenly and lateral flicking | S21 | medium | British trial; the slats could also open singly at high speed when pulling up, giving a violent flick. |
| Control heaviness | Light up to about 250 mph, then very heavy; elevator almost immovable in a dive at 400 mph | — | extremely heavy above 250 m.p.h. | S20, S21 | high | Two separate British reports agree. |
| Coolant temperature in sustained turning | above 120 °C | — | over 120°C | S21 | medium | |
| Best climbing speed (IAS) at sea level | 69.4 | m/s | 250 km/h | S15 | medium | Decreasing 7 km/h per 1,000 m to 200 km/h at 7 km. |
| Maximum speed, flaps fully lowered | 69.4 | m/s | 250 km/h | S15 | medium | |
| Maximum speed, undercarriage operation | 97.2 | m/s | 350 km/h | S15 | medium | |
| Maximum diving speed | 208.3 | m/s | 750 km/h | S15 | medium | Indicated or true not stated. |
| Maximum engine speed in a dive | 3000 rpm for 30 s | — | 3000 U/min (höchstens 30 Sekunden) | S15 | medium | |
| Engine 5-minute rating (Kurzleistung) | 2400 rpm, 1.30 ata | — | 2400 U/min, 1,30 ata | S15, S18 | high | 127.5 kPa. |
| Engine 30-minute rating (erhöhte Dauerleistung) | 2300 rpm, 1.20–1.23 ata | — | 2300 U/min, 1,20 ata (S15); 1,23 ata (S18) | S15, S18 | medium | The two sources differ by 0.03 ata. |
| Engine continuous rating (Dauerleistung) | 2200 rpm, 1.15 ata | — | 2200 U/min, 1,15 ata | S15, S18 | high | |
| Armament (E-3) | 2 × MG 17 (2,000 rounds total) and 2 × MG FF (120 rounds total) | — | Munition für R.-MG 17 (2000 Schuß); Munition für Fl.-FF (120 Schuß) | S16 | medium | E-4 cannon version not confirmed (see gaps). Ammunition weights 59 kg and 40 kg (S16). |

**Deviation note, Bf 109 E level speed.**
- The handbook-family data sheet (S16) gives 460 km/h at sea level. The manufacturer's specification (S17) gives
  500 km/h, with a stated ±5% tolerance.
- S17 also quotes higher engine ratings (1,175 PS for take-off at 2,500 rpm) than the October 1940 engine manual (S18:
  1,100 PS at 2,400 rpm).
- Phase 1 will calibrate to S16 (an in-service document) and report the gap to S17.
- The Rechlin comparison (S22) says the 109 E was about 20 km/h faster than the Spitfire at sea level. Against S3's
  283 mph (455 km/h) for the Spitfire, that supports a 109 E sea-level speed nearer 475 km/h.

## Daimler-Benz DB 601A (Bf 109 E-4 and Bf 110 C-4)

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Layout | 12-cylinder inverted V, liquid-cooled, direct fuel injection | — | Liquid cooled four-stroke Otto engine with direct fuel injection … 12-cylinder inverted Vee-engine | S19 | medium | Direct injection: no negative-g cut-out. |
| Displacement | 33.93 | L | 33,93 Liter | S19 | medium | |
| Fuel | 87 octane | — | 87 octane | S19 | medium | |
| Dry weight | 610 | kg | 610 kg + 3% | S19 | medium | |
| Supercharger | Single stage with hydraulic (stepless) drive | — | stageless, controllable supercharger drive; barometric control from 2.1 km | S18, S19 | high | Gives the power dip between 2 and 4.5 km in S18 Bild 6. |
| Take-off power, 1 minute | 809 | kW | 1100 PS at 2400 U/min, 1,40 ata | S18, S19 | high | At ground level. |
| 5-minute power at ground level | 728 | kW | 990 PS at 2400 U/min, 1,30 ata | S18, S19 | high | |
| 5-minute power at rated altitude | 750 | kW | 1020 PS at 2400 U/min, 1,30 ata, at 4,5 km | S18, S19 | high | New-type supercharger; the old type gives 4.0 km. |
| Rated altitude, 5-minute power | 4500 | m | 4,5 km | S18, S19 | high | |
| 30-minute power at ground level | 669 | kW | 910 PS at 2300 U/min, 1,23 ata | S18, S19 | high | |
| 30-minute power at 5.0 km | 706 | kW | 960 PS at 2400 U/min, 1,23 ata | S18, S19 | high | |
| Continuous power at ground level | 596 | kW | 810 PS at 2200 U/min, 1,15 ata | S18, S19 | high | |
| Continuous power at 4.9 km | 633 | kW | 860 PS at 2200 U/min | S18, S19 | high | |
| Power tolerance | 2.5 | % | ± 2,5 % | S18 | medium | rpm ± 2%. |
| Peak 5-minute power, about 2.1 km | 780 | kW | about 1,060 PS (read from Bild 6) | S18 | medium | Read from chart (±10 PS). |
| Fuel flow, 5-minute power at ground level | 300 | L/h | 300 l/h | S18 | medium | Take-off 375 l/h; continuous 250 l/h. |

## Messerschmitt Bf 110 C-4 (2 × DB 601A)

No C-4 specific document was found. S23 covers the C-1 and C-2. The C-4 added armour, whose weight is an open gap. This is
flagged as a deviation. S24 and S25 come from RAF flying of an aircraft captured in July 1940, which carried no armour.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan | 16.2 | m | 16,2 m | S23 | medium | |
| Wing area | 38.4 | m² | 38,4 m² | S23 | medium | |
| Length | 12.0 | m | 12,0 m | S23 | medium | |
| Height | 3.3 | m | 3,3 m | S23 | medium | |
| Aerofoil, root | NACA 2R1 18.5 | — | NACA 2R1 18.5 | S14 | medium | |
| Aerofoil, tip | NACA 2R1 11 | — | NACA 2R1 11 | S14 | medium | |
| Equipped weight (C-2) | 5020 | kg | Rüstgewicht 5020 kg | S23 | medium | C-1: 4,897 kg. |
| Crew | 200 | kg | Besatzung (2 Mann) 200 kg | S23 | medium | Two crew as a fighter (S25 agrees). |
| Ammunition (C-2) | 281 | kg | Munition 281 kg | S23 | medium | |
| Fuel (C-2) | 965 | kg | Kraftstoff (γ = 0,76 kg/ltr) 965 kg | S23 | medium | |
| Oil | 64 | kg | Schmierstoff (γ = 0,91 kg/ltr) 64 kg | S23 | medium | |
| Flying weight (C-2) | 6530 | kg | Fluggewicht 6530 kg | S23 | medium | C-1: 6,040 kg. |
| Wing loading (C-2) | 166 | kg/m² | 166 kg/m² | S23 | medium | |
| Fuel tank capacity | 1270 | L | each wing: main 375 l (82.5 gal) and reserve 260 l (58 gal) | S24, S25 | high | S25: 82 + 57 gallons each side, 278 gallons in all. Engines feed from the main tanks only; reserve fuel is pumped across. |
| Fuel and oil tanks self-sealing | yes | — | all fuel and oil tanks are self-sealing | S24, S25 | high | |
| Oil tank capacity, each | 40 | L | approximately 8.8 gallons | S25 | medium | S24's drawing shows 9 gallons. |
| Engines | 2 × Daimler-Benz DB 601A | — | DB 601 A | S23, S25 | high | |
| Engine ratings in the data sheet | take-off 1100 PS / 2400 rpm; ground 990 PS / 2400 rpm; 1025 PS at 4.5 km with ram, 2400 rpm | — | Startleistung 1100/2400; Bodenleistung 990/2400; 1025/4,5/2400 | S23 | medium | Agree with S18. |
| Airscrews | VDM three-blade, fully feathering, 3.1 m | — | 3,1 Ø, 3 flg.; V.D.M. fully feathering variable pitch | S23, S24, S25 | high | |
| Reduction gear ratio | 1.55 | — | 1 : 1,55 | S23 | medium | |
| Maximum speed at sea level (C-2) | 122.2 | m/s | 440 km/h at 0 km, 990 PS | S23 | medium | |
| Maximum speed at 2 km | 132.5 | m/s | 477 km/h | S23 | medium | |
| Maximum speed at 4 km | 142.8 | m/s | 514 km/h | S23 | medium | |
| Maximum speed at 4.5 km | 145.3 | m/s | 523 km/h | S23 | medium | Rated altitude, 2 × 1,025 PS. |
| Maximum speed at 6 km | 142.5 | m/s | 513 km/h | S23 | medium | |
| Time to 1 km (C-2) | 78 | s | 1,3 min | S23 | medium | |
| Time to 2 km | 162 | s | 2,7 min | S23 | medium | |
| Time to 4 km | 360 | s | 6,0 min | S23 | medium | |
| Time to 6 km | 630 | s | 10,5 min | S23 | medium | |
| Time to 8 km | 1110 | s | 18,5 min | S23 | medium | |
| Service ceiling (C-2) | 9500 | m | 9,5 km | S23 | medium | C-1: 10.5 km. |
| Landing speed (C-2) | 36.7 | m/s | 132 km/h at 6,530 kg | S23 | medium | |
| Maximum permissible speed | 180.6 | m/s | 650 km/h ASI (406 mph) | S24 | medium | |
| Maximum speed, flaps and undercarriage down | 69.4 | m/s | 250 km/h ASI (155 mph) | S24 | medium | |
| Best approach speed | 44.4 | m/s | 160 km/h ASI (100 mph) | S24 | medium | Determined by RAE pilots. |
| Flap travel | 50 | deg | indicator 0° to 50° | S24 | medium | The ailerons droop with the flaps. |
| Engine limits | take-off and climb 5 min 2400 rpm 1.3 ata; 30 min 2300 rpm 1.2 ata; continuous 2200 rpm 1.18 ata; dive 2500 rpm | — | as tabulated | S24 | medium | 1.3 ata below about 14,000 ft for no more than 5 minutes. |
| Single-engine flight | Climbs and holds height on either engine; much better with the dead airscrew feathered | — | flies well on either engine | S25 | medium | S24: on one engine use only 25° flap; full flap and more than 1,600 rpm on the good engine gives an uncontrollable swing. |
| Handling at speed | Controls light and effective to 250 mph, then heavy (S24); still fully manoeuvrable in a 340 mph IAS dive (S25) | — | as quoted | S24, S25 | medium | The two reports differ. |
| Speed against Hurricane I | Hurricane 15–20 mph faster at 5,000 ft; Bf 110 2–3 mph faster at 20,000 ft | — | as quoted | S25 | medium | Flown at about 17,000 ft rated altitude after RAE modified the superchargers. S22 instead calls the Bf 110 C faster than the Hurricane: a disagreement. |
| Forward armament | 4 × MG 17 (1,000 rounds each) and 2 × MG FF 20 mm (60-round drums) | — | je 1000 Schuß; 2 MG-FF je 180 (S23, C-2) | S23, S25 | high | S25: six spare 60-round drums, changed by the rear crewman. S23 gives 180 rounds per cannon (three drums) for the C-2. |
| Rear armament | 1 × MG 15, 75-round drums | — | MG 15 … magazine holding 75 rounds; stowage for 10 spare | S25, S27 | high | S23 (C-2): 750 rounds. An experienced gunner changes a drum in about 10 s (S25). |
| Rear gun field of fire | ±30° either side of the centre line, 0° to 60° elevation | — | about 30° on either side … maximum elevation 60°; not possible to fire below the horizontal | S25 | medium | With the canopy closed, the field of fire is very limited. |
| Rear gunner accuracy under g | Very poor | — | impossible to shoot with any degree of accuracy under 'G' | S25 | medium | |

## Heinkel He 111 H-3 (AI only)

Very little was found in allowed sources. The He 111 is flown by the AI only, so Phase 1 does not need it, but Phase 3
does. See the open research gaps and the question to the product owner in PROGRESS.md.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan | 22.6 | m | 22.6 m | S26 | medium | Museum record of a CASA 2.111B, the licence-built He 111 H with Merlin engines; the wing is taken as the same. |
| Fuel and oil tanks self-sealing | yes | — | similar construction to those used on the Heinkel 111H | S25 | medium | |

## Guns (Phase 5 completes this section)

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| MG 17 rate of fire, synchronised | 1000 | rounds/min | 1,000 rds./min. (synchronized) | S27 | medium | |
| MG 17 rate of fire, unsynchronised | 1100 | rounds/min | 1,100 rds./min. (unsynchronized) | S27 | medium | |
| MG 17 muzzle velocity | 853 | m/s | 2,800 f/s | S27 | medium | |
| MG 17 weight | 12.6 | kg | 27 lb 11 oz | S27 | medium | |
| MG 15 rate of fire (cyclic) | 1000–1100 | rounds/min | 1,000–1,100 rds./min. | S27 | medium | |
| MG 15 drum capacity | 75 | rounds | saddle-type drum (75-rd. capacity) | S25, S27 | high | |
| MG FF drum capacity | 60 | rounds | magazine holding 60 rounds | S16, S25 | high | S16 gives 120 rounds for two guns on the E-3. |

---

## Open research gaps (no value recorded; nothing invented)

| Gap | Needed for | Where to look next |
|---|---|---|
| Any test of a Spitfire I or Hurricane I at +12 lb/sq in boost (speeds and climb) | Phase 1 validation of the chosen mid-August 1940 configuration | Rolls-Royce or RAE reports of 1940; A&AEE reports on later Hurricane I serials; H.C.T. Dowding, "Handling of Merlin in Hurricane, Spitfire and Defiant Aircraft", 1 Aug 1940 (on the archive site, not yet read) |
| Time limit for +12 lb/sq in in mid-1940 | The game's emergency-boost timer (the 5 minutes in the question to the product owner is not sourced) | Pilot's Notes A.P. 1564A (Hurricane I) and A.P. 1565A (Spitfire I) full text; Dowding letter above |
| Hurricane I Rotol airscrew diameter and pitch range | Propeller model | A&AEE report on a Rotol Hurricane I; Rotol type records |
| Hurricane I with Rotol airscrew: level speeds and climb (S1/S2 do not state the airscrew) | Validation | A&AEE reports (the archive lists L1547 and L2026 with two-pitch airscrews only) |
| Merlin III reduction gear ratio, supercharger gear ratio, bore and stroke, dry weight | Engine model | A.P. 1590B full text; RAF Museum or Science Museum engine records |
| A Merlin III power curve with a stated source (S9's origin is not named) | Engine model | Rolls-Royce Heritage Trust; A.P. 1590B |
| Spitfire I wingspan from an allowed Mk I source (only the Mk V figure in S11 was found) | Geometry | Air Ministry data sheet for the Spitfire I; Supermarine drawings |
| Spitfire I rounds per gun | Weapons | Air Ministry data sheet; A.P. 1565A |
| Spitfire I fabric-covered aileron area and travel (S11 is a metal-aileron VA) | Roll model | A&AEE or RAE reports on the Spitfire I |
| Bf 109 E-4 armament (MG FF or MG FF/M) and weights: armour plate, cannon installation, any canopy change | Mass and CG | E-4 Ladeplan; Flugzeug-Handbuch E-4 |
| Whether the 109 E-4 of August 1940 had the DB 601A or DB 601Aa | Engine model | Kennblatt or Flugzeug-Handbuch E-4; DB 601 Aa data sheet (the archive page is empty) |
| Bf 109 E level speed: the 460 km/h (S16) against 500 km/h (S17) disagreement | Calibration choice | Rechlin Meßprotokolle; British RAE tests of the captured E-3 (charts listed on the archive site, not yet read) |
| Bf 109 E roll rate and stick forces | Roll model | RAE report by Morgan, "Messerschmitt Me 109 Handling and Manoeuvrability Tests" (on kurfurst.org, downloaded but not yet read) |
| Bf 109 E turn times (Messerschmitt chart of 26 Aug 1940 unreadable) | AI and validation | A better scan |
| Bf 110 C-4 weights: armour; C-4 compared with the C-2 | Mass | Bf 110 C-4 Ladeplan or handbook |
| Bf 110 engine spacing, critical engine, airscrew rotation directions | Twin-engine model | Bf 110 handbook; drawings |
| He 111 H-3: engine sub-type (Jumo 211 A-3 or D are both claimed in non-allowed sources), dimensions other than span, weights, speeds, climb, ceiling, bomb load, crew positions, gun positions and arcs, formation cruise speed | Phase 3 (twin engines) and Phase 6 (gunners) | He 111 H Flugzeug-Handbuch or Kennblatt; RAE or AFDU reports on captured He 111s; a printed reference book the product owner can supply |
| Browning .303 Mk II rate of fire and muzzle velocity; .303 ball and incendiary bullet data | Weapons (Phase 5) | Royal Armouries records; A.P. 1641 (Browning gun manual) |
| MG FF and MG FF/M rate of fire, muzzle velocity, shell mass | Weapons (Phase 5) | US Catalog of Enemy Ordnance (MG FF entry not found); Rheinmetall or Ikaria handbook |
| Gun harmonisation ranges in August 1940 (RAF and Luftwaffe) | Weapons (Phase 5) | Fighter Command orders; AFDU reports |
| Armour plate thickness and positions for all four fighters | Damage (Phase 5) | A&AEE and AFDU reports; Luftwaffe Ladepläne |
| Moments of inertia (all aircraft) | Flight model | No measured data expected; Phase 1 estimates with the method shown |
| Coolant system data (radiator area, temperature limits) for the Merlin III and DB 601A | Cooling model | Pilot's Notes; DB 601 manual (temperatures partly in S24 for the Bf 110) |
