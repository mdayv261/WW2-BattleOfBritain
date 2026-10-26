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
| S28 | L.Dv.T. 583/3, "He 111 H, P und D – Bedienungsvorschrift für die bewegliche und starre Schußwaffe", October 1940 (released by the RLM 10 Dec 1940), with Anhang 1 for the He 111 H-5 (December 1940) | https://archive.org/details/flugzeuchhandbucher (file "He 111 H P D Bedienungsvorschrift Schusswaffe.pdf") | Luftwaffe weapons manual (scan on archive site) |
| S29 | Scientific Testing Institute of the Red Army Air Force (NII VVS), 4th Department, "German bomber Heinkel He-111 (types H-6 and H-11)", Moscow, 1943 | https://archive.org/details/111-1943 | Period government description and test data of captured aircraft, in Russian (scan on archive site, public-domain mark) |
| S30 | E. P. Hartman and D. Biermann, "The Aerodynamic Characteristics of Full-Scale Propellers Having 2, 3, and 4 Blades of Clark Y and R.A.F. 6 Airfoil Sections", NACA Report 640, 1938 (propeller 5868-9, 3 blades, 10 ft) | https://ntrs.nasa.gov/citations/19930091715 | Government research report |
| S31 | J. R. Vensel and W. H. Phillips, "Stalling Characteristics of the Supermarine Spitfire VA Airplane", NACA Advance Confidential Report, Sept 1942 | https://ntrs.nasa.gov/citations/19930092581 | Government research report |
| S32 | M. B. Morgan and R. Smelt, "Aerodynamic Features of German Aircraft: Messerschmitt Me 109 Handling and Manoeuvrability Tests", RAE Report, September 1940 (captured Bf 109 E-3, tested May-June 1940): text, Table 1 and Figs. 1, 3 and 5 | http://www.kurfurst.org/Tactical_trials/109E_UKtrials/Morgan.html | Period test report (transcription with the report's figures, on archive site) |
| S33 | Air Ministry, Air Publication 1565A Vol. I, "Pilot's Notes: The Spitfire I Aeroplane, Merlin II or III Engine" (loose-leaf, pages dated September 1941 to May 1942), The Museum of Flight Library, Manuals Collection, call number MANACT.S8.S65.3 | https://digitalcollections.museumofflight.org/nodes/view/2854 | Museum record (scan of the Pilot's Notes) |
| S34 | Valentine & Sons, aircraft recognition card No. 39, "He 111" (wartime; its data reproduced from "The Aeroplane"), IBCC Digital Archive, University of Lincoln | https://ibccdigitalarchive.lincoln.ac.uk/collections/document/39645 | Period recognition card (archive record) |
| S35 | Smithsonian National Air and Space Museum, "Junkers Jumo 211, Inverted V-12 Engine", object A19710934000 | https://airandspace.si.edu/collection-objects/junkers-jumo-211-inverted-v-12-engine/nasm_A19710934000 | Museum record |
| S36 | Heimatmuseum Alten (museum-digital Sachsen-Anhalt), "Handbuch für Junkers VS 11 Verstell-Luftschraubenanlage", Junkers Motorenbau, Dessau, July 1941, object 15931 (catalogue description) | https://st.museum-digital.de/object/15931 | Museum record |

**Archive sites used (D8):**
- wwiiaircraftperformance.org;
- spitfireperformance.com, read through the Internet Archive because the domain has lapsed;
- kurfurst.org;
- lonesentry.com;
- the Internet Archive (archive.org), for the scans S28 and S29.

Each source above names the original document. The site owners' own commentary was not used.

**Consulted but not used for any value:**
- RAF Museum pages for Spitfire I X4590, Bf 109 E-3 4101 and He 111 H-20 701152: no technical figures.
- Science Museum Group collection: blocked automated reading; not bypassed.
- HQ AASF, "Report of Comparative Trials of Hurricane versus Messerschmitt 109", 7 May 1940: qualitative only.
- Messerschmitt "Wendezeiten" turn-time chart of 26 Aug 1940: the scan is too poor to read.
- Imperial War Museums online collection (24 Oct 2026): no He 111 records are online. Three items need a visit or a
  copy request (see gaps).
- Wikipedia's He 111 article: used only as a pointer to its cited sources (product owner, 24 Oct 2026). Its
  specification box is for the H-16 and cites printed books (mainly Nowarra 1980), not available online.
- Internet Archive uploads of modern copyrighted books (for example Squadron/Signal titles): not used; they appear
  to be unauthorised copies.
- He 111 H-16 Flugzeug-Handbuch Teil 9A (Internet Archive): equipment only, no flight data.
- Forums, hobby and game sites: excluded by policy.

---

## Hawker Hurricane Mk I (Merlin III)

S1 and S2 describe the Hurricane I with the Merlin III. They do not say which airscrew was fitted (see gaps).
S12 is a Hurricane **II** (Merlin XX, longer nose, heavier). Its wing and tail are the same design as the metal-winged Mk I,
so it is used for wing geometry, control surfaces, stall and handling only, rated medium as a close variant.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan (`geometry.span`) | 12.192 | m | 40 ft | S1, S12 | high | S12 (Mk II, same wing) also gives 40 ft. |
| Gross wing area (`geometry.wingArea`) | 23.97 | m² | 258 sq ft | S1, S12 | high | S12 measured 257.6 sq ft. |
| Length (`geometry.length`) | 9.576 | m | 31 ft 5 in | S1 | medium | S12's Mk II is 31 ft 6 in (longer Merlin XX nose). |
| Height | 3.200 | m | 10 ft 6 in | S1 | medium | Attitude not stated. S12 gives 12 ft 2 in with the datum line level, a different attitude. |
| Aspect ratio | 6.22 | — | 6.22 | S12 | medium | Close variant (same wing). Consistent with S1: 40² / 258 = 6.20. |
| Mean aerodynamic chord (`geometry.mac`) | 2.141 | m | 84.3 in | S12 | medium | 5.2 in behind the wing leading edge (S12). |
| Taper ratio | 2.03 | — | 2.03:1 | S12 | medium | |
| Dihedral, outer panels (`aero.dihedral`) | 3.5 | deg | +3.5° | S12 | medium | |
| Washout: outer wing set lower than the root (`aero.washout`) | 1 | deg | — | ASSUMPTION | estimate | Not found (S12 gives only the root incidence). Typical of the period; makes the root stall first, as S12 describes. |
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
| Mean weight (`mass.flying`) | 2921 | kg | 6,440 lb | S1 | medium | The weight the S1 performance figures are quoted at. |
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
| Maximum lift coefficient, flaps up, power off (`aero.clMax`) | 1.41 | — | 1.41 | S12 | medium | Ports closed; ports open 1.31. |
| Maximum lift coefficient, landing condition (`aero.clMaxFlaps`) | 2.14 | — | 2.14 | S12 | medium | Ports closed; ports open 2.00. |
| Stall behaviour | Root stalls first; buffet warning before roll-off | — | flow separation first at the centre section | S12 | medium | Qualitative; used to shape the stall model. |
| Stick-force gradient in manoeuvres | 36.0 | N/g | 8.1 lb per g | S12 | medium | Above the 6 lb/g upper limit NACA recommended. |
| Roll helix angle, full aileron | 0.082 | rad | pb/2V 0.082 | S13 | medium | Low speed, where full deflection can be reached. |
| Roll helix angle with 30 lb stick force at 230 mph IAS, 10,000 ft | 0.057 | rad | pb/2V 0.057 | S13 | medium | |
| Roll rate with 30 lb stick force at 230 mph IAS, 10,000 ft | 1.117 | rad/s | 64 deg/s | S13 | medium | Heavy ailerons limit high-speed roll (S13). |
| Roll moment of inertia (`mass.ixx`) | 6783 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.25 (roll, of b/2), 0.38 (pitch, of L/2) and 0.39 (yaw, of (b+L)/4) are typical of single-engine propeller aircraft (method after Roskam; the ratios are not checked against the book). |
| Pitch moment of inertia (`mass.iyy`) | 9670 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.25 (roll, of b/2), 0.38 (pitch, of L/2) and 0.39 (yaw, of (b+L)/4) are typical of single-engine propeller aircraft (method after Roskam; the ratios are not checked against the book). |
| Yaw moment of inertia (`mass.izz`) | 13,150 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.25 (roll, of b/2), 0.38 (pitch, of L/2) and 0.39 (yaw, of (b+L)/4) are typical of single-engine propeller aircraft (method after Roskam; the ratios are not checked against the book). |
| Zero-lift angle of attack, body axis (`aero.alphaZeroLift`) | -5 | deg | — | ASSUMPTION | estimate | A Clark Y section has zero lift near −3°; less the 2° incidence (S12). Sets the fuselage attitude only. |
| Zero-lift drag coefficient (`aero.cd0`) | 0.0249 | — | — | ASSUMPTION | estimate | Fitted (`npm run calibrate`) so the level top speed at 17,750 ft, 3000 rpm, +6¼ lb and 2921 kg equals the data sheet's 316 mph (S1). |
| Oswald span efficiency (`aero.oswald`) | 0.8 | — | — | ASSUMPTION | estimate | No measured value found. Typical of a monoplane fighter (fuselage and gun ports lower it). |
| Drag of fully lowered split flaps (`aero.flapCd`) | 0.08 | — | — | ASSUMPTION | estimate | Typical of large split flaps; only affects the approach and glide. |
| Drag of the lowered undercarriage (`aero.gearCd`) | 0.02 | — | — | ASSUMPTION | estimate | Typical of a single-engine fighter. |
| Extra drag with the radiator flap fully open (`aero.radiatorCd`) | 0.004 | — | — | ASSUMPTION | estimate | About 1-2% of total drag at cruise. |
| Fraction of the wing in the propeller slipstream (`aero.slipstreamWing`) | 0.196 | — | — | S31, ASSUMPTION | estimate | Fitted (`npm run calibrate`) to the NACA power-on stall of the Spitfire VA (S31): 77 mph IAS, CL 1.63 at 36.9 in Hg and 2650 rpm (with the Spitfire's blade-width correction). The same value is used for all three aircraft. The disc width over the span would suggest about 0.3. |
| Static margin (`aero.staticMargin`) | 0.05 | fraction | — | S12, ASSUMPTION | estimate | S12 found static stability satisfactory except in the climb at low speed. Set larger than the Spitfire's. |
| Pitching moment coefficient at zero lift (`aero.cmZero`) | 0.02 | — | — | ASSUMPTION | estimate | Set so that the trim range covers cruise to approach. Tuned by flying (checkpoint 3). |
| Pitch damping Cmq (`aero.cmq`) | -12 | per unit q c/2V | — | ASSUMPTION | estimate | Typical order for a single-engine fighter. No measured value found. |
| Pitching moment coefficient at full up elevator (`aero.elevatorCm`) | 0.2 | — | — | ASSUMPTION | estimate | No source; similar to the Spitfire's, tuned by flying. |
| Pitching moment range of the elevator trimmer (`aero.trimCm`) | 0.03 | — | — | ASSUMPTION | estimate | Enough to trim hands-off from the approach to top speed. |
| Pitching moment from fully lowered flaps (`aero.flapCm`) | -0.02 | — | — | ASSUMPTION | estimate | A small nose-down change. S24 reports a larger temporary change on the Bf 110; not modelled yet. |
| Roll moment coefficient at full aileron (`aero.aileronCl`) | 0.0389 | — | — | S13, ASSUMPTION | estimate | Fitted (`npm run calibrate`) in a time-stepped roll with the rudder fixed: 30 lb at 230 mph IAS, 10,000 ft gives pb/2V 0.057 (S13). The full-aileron check gives 0.075 against NACA's 0.082 (−9%). |
| Adverse yaw at full aileron (`aero.adverseYaw`) | -0.008 | — | — | ASSUMPTION | estimate | Fitted in checkpoint 3 so a full-aileron roll at 1.1 times the stall speed, rudder fixed, develops about 18° of sideslip, as NACA measured on the Spitfire VA (S11): model 17°. The same value is used for all three. |
| Weathercock stability Cnβ (`aero.cnBeta`) | 0.07 | per rad | — | ASSUMPTION | estimate | Typical of a single-engine fighter. No measured value found. |
| Yaw damping Cnr (`aero.cnr`) | -0.1 | per unit r b/2V | — | ASSUMPTION | estimate | Typical. No measured value found. |
| Yaw moment coefficient at full rudder (`aero.rudderCn`) | 0.06 | — | — | ASSUMPTION | estimate | Typical. No measured value found. |
| Side force from sideslip Cyβ (`aero.cyBeta`) | -0.6 | per rad | — | ASSUMPTION | estimate | Typical of a fuselage and fin. No measured value found. |
| Slipstream swirl acting on the fin (`aero.swirl`) | 0.15 | fraction | — | ASSUMPTION | estimate | Yaw moment = swirl × thrust × propeller diameter, yawing against the propeller rotation; set so that a few degrees of rudder are needed at climbing power. |
| Rigging against engine torque (`aero.rollRig`) | 0.0021 | — | — | ASSUMPTION | estimate | Equal to the engine's torque reaction in level flight at 110 m/s and 1,500 m (the test-flight start), so the aircraft holds its wings level hands-off there; at other speeds and powers the pilot holds some aileron, as in the real aircraft. |
| Fixed fin offset or rudder tab (`aero.yawRig`) | 0.00116 | — | — | ASSUMPTION | estimate | Cancels the slipstream swirl in level flight at 110 m/s and 1,500 m, as a fixed fin offset or ground-set tab would; at other powers the pilot uses rudder. |
| Roll bias when stalled (wing drop) (`aero.stallBias`) | -0.01 | — | — | S12, ASSUMPTION | estimate | S12: with the stick held back the Hurricane rolls slowly to the left at the stall. Size chosen to give that direction. |
| Elevator stick force at full deflection per unit dynamic pressure (`controls.pitchHinge`) | 0.0609 | N/Pa | — | S12 | medium | Fitted (`npm run calibrate`) to NACA's stick-force gradient in turns, 8.1 lb/g (S12), at 230 mph IAS and 10,000 ft. |
| Aileron stick force at full deflection per unit dynamic pressure (`controls.rollHinge`) | 0.0297 | N/Pa | — | S13 | medium | S13: 30 lb at 230 mph IAS gave pb/2V 0.057 of the full 0.082 (0.695 of full deflection). |
| Rudder pedal force at full deflection per unit dynamic pressure (`controls.yawHinge`) | 0.06 | N/Pa | — | ASSUMPTION | estimate | No source. With the 150 lb pedal limit, full rudder is available to about 300 mph. |
| Flap travel time (`controls.flapTime`) | 5 | s | — | ASSUMPTION | estimate | No source; typical of hydraulic split flaps. |
| Undercarriage travel time (`controls.gearTime`) | 6 | s | — | ASSUMPTION | estimate | No source. Typical of the period. |
| Airscrew diameter (`propeller.diameter`) | 3.454 | m | 11 ft 4 in | S12 | medium | Rotol on the NACA Hurricane II (close variant). The Hurricane I Rotol diameter was not found. |
| Reduction gear ratio (propeller turns per engine turn) (`propeller.gearRatio`) | 0.477 | — | 0.477:1 | S12 | medium | Merlin XX (close variant). |
| Rotation (+1 clockwise seen from the cockpit) (`propeller.rotation`) | 1 | — | — | ASSUMPTION | estimate | Same Merlin and Rotol arrangement as the Spitfire (S4). |
| Fine pitch stop (`propeller.betaMin`) | 23.33 | deg | — | ASSUMPTION | estimate | Taken from the Spitfire's Rotol (S4). |
| Coarse pitch stop (`propeller.betaMax`) | 58.33 | deg | — | ASSUMPTION | estimate | Taken from the Spitfire's Rotol (S4). |
| Lowest governed engine speed (`propeller.rpmMin`) | 1800 | rpm | — | ASSUMPTION | estimate | Typical lower end of the constant-speed lever. |
| Highest governed engine speed (`propeller.rpmMax`) | 3000 | rpm | 3000 rpm | S6, S8 | medium | Merlin III combat limit. |
| Rotating inertia at propeller speed (propeller and engine) (`propeller.inertia`) | 38 | kg m² | — | ASSUMPTION | estimate | Three blades of about 25 kg plus the engine's rotating parts referred to propeller speed (engine inertia divided by the gear ratio squared). Sets how quickly rpm changes. Lowered from 50 in checkpoint 3. |
| Net gyroscopic inertia at propeller speed (`propeller.gyroInertia`) | 22 | kg m² | — | ASSUMPTION | estimate | The propeller's spin, less the crankshaft's: through a single spur reduction gear the crankshaft turns the other way, cancelling part of the propeller's gyroscopic effect. Estimate; checkpoint 3 found 50 kg m² made spins tumble. |
| Governor gain (blade-angle rate per fractional rpm error) (`propeller.governorGain`) | 3 | rad/s | — | ASSUMPTION | estimate | Settles the rpm in about a second. |
| Maximum blade-angle rate (`propeller.pitchRate`) | 0.17 | rad/s | — | ASSUMPTION | estimate | About 10°/s; no source. |


### Undercarriage and ground contact (Phase 2)

Positions are from the centre of gravity in body axes (x forward, y up, z right), wheels with their legs extended.
They were measured from the source's scaled drawing; the centre of gravity's height is not stated anywhere, so it is
assumed to lie on the thrust line, which makes the heights estimates.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Main wheel centre, ahead of the centre of gravity (`gear.main.x`) | 0.25 | m | about 10 in | S12 | medium | Measured from S12 Fig. 4 (Hurricane II three-view; same undercarriage as the Mk I). The centre of gravity is 27.8 in behind the wing leading edge (S12). |
| Main wheel centre, height (`gear.main.y`) | -1.752 | m | — | S12, ASSUMPTION | estimate | Measured from S12 Fig. 4 below the thrust line; the centre of gravity's height is assumed to be on the thrust line. |
| Half the main wheel track (`gear.main.z`) | 1.194 | m | track 7 ft 10 in | S12 | medium | Dimensioned on S12 Fig. 4. |
| Main wheel radius (`gear.main.radius`) | 0.29 | m | — | S12 | medium | Measured from S12 Fig. 4. |
| Tailwheel centre, x (`gear.tail.x`) | -5.54 | m | — | S12 | medium | Measured from S12 Fig. 4. |
| Tailwheel centre, height (`gear.tail.y`) | -0.828 | m | — | S12, ASSUMPTION | estimate | Set so the parked aircraft sits at the 10.2° ground angle measured on S12 Fig. 4 (the tailwheel as drawn gives 9.8°). |
| Tailwheel radius (`gear.tail.radius`) | 0.115 | m | — | S12 | medium | Measured from S12 Fig. 4. |
| Ground angle: thrust line to the ground on all three wheels (`gear.groundAngle`) | 10.2 | deg | — | S12 | medium | Measured on S12 Fig. 4 (the ground line is drawn but not labelled). S12: the ground angle is below the stalling attitude, so tail-first landings could be made. |
| Main leg and tyre squash under the parked weight (`gear.mainDeflection`) | 0.1 | m | — | ASSUMPTION | estimate | No source. Sets the spring rate of each main leg (the parked weight divided by this). |
| Tailwheel squash under the parked weight (`gear.tailDeflection`) | 0.06 | m | — | ASSUMPTION | estimate | No source. Sets the tailwheel's spring rate. |
| Oleo damping, fraction of critical (`gear.dampingRatio`) | 0.6 | fraction | — | ASSUMPTION | estimate | No source; typical of an oleo-pneumatic leg. Stops the aircraft bouncing on its legs. |
| Most braking force as a fraction of the wheel's load (`gear.brake`) | 0.3 | fraction | — | ASSUMPTION | estimate | No measured value; typical of drum brakes on grass. The tail-lift limit, not this, mostly sets how hard the scripted pilot can brake (FLIGHT_VALIDATION.md). |
| Tailwheel castors freely (1 = yes) (`gear.tail.castor`) | 1 | — | — | ASSUMPTION | estimate | Castoring tailwheel assumed; steering is by rudder and differential brakes. Not confirmed from a source (see gaps). |
| Left wingtip, x (`contacts.leftTip.x`) | -0.3 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Left wingtip, y (`contacts.leftTip.y`) | -0.26 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Left wingtip, z (`contacts.leftTip.z`) | -6.1 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Right wingtip, x (`contacts.rightTip.x`) | -0.3 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Right wingtip, y (`contacts.rightTip.y`) | -0.26 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Right wingtip, z (`contacts.rightTip.z`) | 6.1 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the nose, x (`contacts.nose.x`) | 1.55 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the nose, y (`contacts.nose.y`) | -0.55 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the nose, z (`contacts.nose.z`) | 0 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the belly (radiator), x (`contacts.belly.x`) | -1.08 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the belly (radiator), y (`contacts.belly.y`) | -1.17 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the belly (radiator), z (`contacts.belly.z`) | 0 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, x (`contacts.tail.x`) | -5.4 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, y (`contacts.tail.y`) | -0.78 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, z (`contacts.tail.z`) | 0 | m | — | S12, ASSUMPTION | estimate | Crash point, read approximately from S12 Fig. 4. Touching the ground with it ends the flight. |
| Propeller hub ahead of the centre of gravity (`propHub.x`) | 2.22 | m | — | S12 | medium | Measured from S12 Fig. 4. |
| Propeller hub height (`propHub.y`) | 0 | m | — | ASSUMPTION | estimate | On the thrust line, which is assumed to pass through the centre of gravity. |
| Pilot's eye, x (`eye.x`) | -0.89 | m | — | S12, ASSUMPTION | estimate | Read from S12 Fig. 4 (cockpit position); the eye position itself is estimated. |
| Pilot's eye, height (`eye.y`) | 0.65 | m | — | S12, ASSUMPTION | estimate | A little below the canopy top in S12 Fig. 4. |
| Reflector gunsight ring, angular diameter (`sight.ringMils`) | 100 | mils | — | ASSUMPTION | estimate | Barr & Stroud GM 2 reflector sight assumed (standard in RAF fighters by 1940; not yet confirmed from an allowed source). The ring's size was not found in an allowed source (forum and dealer figures disagree); a display placeholder until the gunsights are researched for Phase 5 (see gaps). |
| Flap positions besides up (`controls.flapStops`) | 4 | — | — | ASSUMPTION | estimate | Hydraulic flaps that could be stopped part-way assumed; the Mk I Pilot's Notes were not found (see gaps). |
| Flap travel, fully down (`controls.flapTravel`) | 80 | deg | 80° down | S12 | medium | Split flaps. |
| Flap setting for take-off, fraction of travel (`controls.flapTakeoff`) | 0 | fraction | — | ASSUMPTION | estimate | No take-off flap setting found (the Mk I Pilot's Notes were not found); flaps up assumed, as for the Spitfire (S33). |
| Flap setting for landing, fraction of travel (`controls.flapLanding`) | 1 | fraction | landing condition, flaps down | S12 | medium | NACA's landing condition was flaps fully down. |
| Elevator travel, full up (`controls.elevatorUp`) | 26 | deg | ±26° | S12 | medium | |
| Elevator trim, time from one end to the other (`controls.trimTime`) | 8 | s | — | ASSUMPTION | estimate | No source; a handwheel. S12: no rudder trim tab was fitted, so none is modelled. |

## Supermarine Spitfire Mk I (Merlin III)

S4 is the key test: a production Spitfire I with the Merlin III and a Rotol constant-speed airscrew. It was flown at
+6¼ lb/sq in only. No test of a Spitfire I at +12 lb/sq in was found (see gaps). S11 is a Spitfire **VA** (Merlin 45).
Its airframe and wing are the Mk I's, so it is used for geometry, stall and handling, rated medium as a close variant.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan (`geometry.span`) | 11.252 | m | 36 ft 11 in | S11 | medium | Close variant (VA). Area × aspect ratio in S11 gives 36 ft 10.5 in. The commonly quoted 36 ft 10 in was not found in an allowed source. |
| Wing area (`geometry.wingArea`) | 22.48 | m² | 242 sq ft | S11 | medium | Close variant. |
| Aspect ratio | 5.62 | — | 5.62 | S11 | medium | |
| Mean aerodynamic chord (`geometry.mac`) | 2.159 | m | 7 ft 1 in | S11 | medium | 4.8 in behind the leading edge of the wing root (approximate, S11). |
| Planform | elliptical | — | elliptical | S11 | medium | |
| Dihedral (leading edge) (`aero.dihedral`) | 6 | deg | 6.0° | S11 | medium | |
| Washout: outer wing set lower than the root (`aero.washout`) | 2.1 | deg | incidence 2.1° at the root, 0° at the tip | S11 | medium | Close variant (VA). Each wing half is two panels; the outer panel is set lower by this amount, so the root stalls first (D26). |
| Wing incidence, root | 2.1 | deg | 2.1° from thrust axis | S11 | medium | |
| Wing incidence, tip | 0 | deg | 0° | S11 | medium | 2.1° of washout. |
| Aerofoil, root | NACA 2213 | — | NACA 2212 (S11); NACA 2213 (S14) | S11, S14 | medium | Sources disagree on thickness. S14 is used; S11's figure is noted. |
| Aerofoil, tip | NACA 2209.4 | — | NACA 2208 (S11); NACA 2209.4 (S14) | S11, S14 | medium | As above. |
| Length (`geometry.length`) | 9.119 | m | 29 ft 11 in | S11 | medium | Close variant; the Mk V nose is similar. |
| Height (datum level) | 3.327 | m | 10 ft 11 in | S11 | medium | |
| Split flaps, total area | 1.449 | m² | 15.6 sq ft | S11 | medium | Flap span 17 ft 10 in. |
| Split flaps, travel | 85 | deg | 85° | S11 | medium | |
| Aileron area, each | 0.878 | m² | 9.45 sq ft | S11 | medium | Metal-covered on the VA. Balance area 2.45 sq ft. Mk I ailerons were fabric-covered (see gaps). |
| Tailplane area | 1.867 | m² | 20.1 sq ft (including 2.15 sq ft fuselage) | S11 | medium | 0° incidence. |
| Elevator area | 1.232 | m² | 13.26 sq ft | S11 | medium | Trim tab 0.84 sq ft. |
| Tare weight (N3171) | 2138 | kg | 4,713 lb | S4 | medium | As tested, with armour over the fuel tank and a bullet-proof windscreen. |
| Flying weight on trials (N3171) (`mass.flying`) | 2744 | kg | 6,050 lb | S4 | medium | |
| Fuel carried | 382 | L | 84 gallons | S4, S5 | high | Two separate A&AEE reports. S11 (VA) gives 85 gallons. |
| Oil carried | 25 | L | 5½ gallons | S4, S5 | high | |
| Engine | Rolls-Royce Merlin III | — | Merlin III | S4 | medium | Normal rating 950/990 bhp at 12,250 ft, 2,600 rpm, +6¼ lb/sq in (S4). |
| Airscrew | Rotol constant-speed, 3 blades | — | Rotol, 3 blades | S4 | medium | |
| Airscrew diameter (`propeller.diameter`) | 3.277 | m | 10 ft 9 in | S4 | medium | S11 (VA, Rotol) gives 10 ft 10 in. |
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
| Roll moment of inertia (`mass.ixx`) | 5429 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.25 (roll, of b/2), 0.38 (pitch, of L/2) and 0.39 (yaw, of (b+L)/4) are typical of single-engine propeller aircraft (method after Roskam; the ratios are not checked against the book). |
| Pitch moment of inertia (`mass.iyy`) | 8238 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.25 (roll, of b/2), 0.38 (pitch, of L/2) and 0.39 (yaw, of (b+L)/4) are typical of single-engine propeller aircraft (method after Roskam; the ratios are not checked against the book). |
| Yaw moment of inertia (`mass.izz`) | 10,820 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.25 (roll, of b/2), 0.38 (pitch, of L/2) and 0.39 (yaw, of (b+L)/4) are typical of single-engine propeller aircraft (method after Roskam; the ratios are not checked against the book). |
| Zero-lift angle of attack, body axis (`aero.alphaZeroLift`) | -3.5 | deg | — | ASSUMPTION | estimate | A 2%-camber NACA 22-series section has zero lift near −2°; less the 2.1° root incidence (S11) and part of the washout. Sets the fuselage attitude only. |
| Maximum lift coefficient, power off, flaps up (`aero.clMax`) | 1.18 | — | 1.18 | S31 | medium | Spitfire VA at 6184 lb, gun ports covered, gliding: 90 mph IAS. Close variant (D14). The model's peak lift equals this. |
| Maximum lift coefficient, power off, flaps and undercarriage down (`aero.clMaxFlaps`) | 1.51 | — | 1.51 | S31 | medium | As above, landing condition, throttle closed: 80 mph IAS. |
| Zero-lift drag coefficient (`aero.cd0`) | 0.0183 | — | — | ASSUMPTION | estimate | Fitted (`npm run calibrate`) so the level top speed at 18,900 ft, 3000 rpm, +6¼ lb and 2744 kg equals N3171's 354 mph (S4). Every other speed is an independent check. |
| Oswald span efficiency (`aero.oswald`) | 0.8 | — | — | ASSUMPTION | estimate | No measured value found. Typical of a monoplane fighter (fuselage and gun ports lower it). |
| Drag of fully lowered split flaps (`aero.flapCd`) | 0.07 | — | — | ASSUMPTION | estimate | Typical of large split flaps; only affects the approach and glide. |
| Drag of the lowered undercarriage (`aero.gearCd`) | 0.02 | — | — | ASSUMPTION | estimate | Typical of a single-engine fighter. |
| Extra drag with the radiator flap fully open (`aero.radiatorCd`) | 0.004 | — | — | ASSUMPTION | estimate | About 1-2% of total drag at cruise. |
| Fraction of the wing in the propeller slipstream (`aero.slipstreamWing`) | 0.196 | — | — | S31, ASSUMPTION | estimate | Fitted (`npm run calibrate`) to the NACA power-on stall of the Spitfire VA (S31): 77 mph IAS, CL 1.63 at 36.9 in Hg and 2650 rpm (with the Spitfire's blade-width correction). The same value is used for all three aircraft. The disc width over the span would suggest about 0.3. |
| Static margin (`aero.staticMargin`) | 0.02 | fraction | — | S11, ASSUMPTION | estimate | S11 found the Spitfire's static longitudinal stability "neutral" (centre of gravity at 31.4% MAC); a small positive margin is used. |
| Pitching moment coefficient at zero lift (`aero.cmZero`) | 0.01 | — | — | ASSUMPTION | estimate | Set so that the trim range covers cruise to approach. Tuned by flying (checkpoint 3). |
| Pitch damping Cmq (`aero.cmq`) | -12 | per unit q c/2V | — | ASSUMPTION | estimate | Typical order for a single-engine fighter. No measured value found. |
| Pitching moment coefficient at full up elevator (`aero.elevatorCm`) | 0.17 | — | — | S11, ASSUMPTION | estimate | S11: about 3° of up elevator took the aircraft from CL 0.3 to the stall. Sized so full up elevator gives several times that. |
| Pitching moment range of the elevator trimmer (`aero.trimCm`) | 0.03 | — | — | ASSUMPTION | estimate | Enough to trim hands-off from the approach to top speed. |
| Pitching moment from fully lowered flaps (`aero.flapCm`) | -0.02 | — | — | ASSUMPTION | estimate | A small nose-down change. S24 reports a larger temporary change on the Bf 110; not modelled yet. |
| Roll moment coefficient at full aileron (`aero.aileronCl`) | 0.0434 | — | — | S13, ASSUMPTION | estimate | Fitted (`npm run calibrate`) in a time-stepped roll with the rudder fixed, as NACA flew it: 30 lb at 230 mph IAS, 10,000 ft gives pb/2V 0.050 (S13). The full-aileron check then gives 0.072 against NACA's 0.085 (−15%). |
| Adverse yaw at full aileron (`aero.adverseYaw`) | -0.008 | — | — | ASSUMPTION | estimate | Fitted in checkpoint 3 so a full-aileron roll at 1.1 times the stall speed, rudder fixed, develops about 18° of sideslip, as NACA measured on the Spitfire VA (S11): model 17°. The same value is used for all three. |
| Weathercock stability Cnβ (`aero.cnBeta`) | 0.07 | per rad | — | ASSUMPTION | estimate | Typical of a single-engine fighter. No measured value found. |
| Yaw damping Cnr (`aero.cnr`) | -0.1 | per unit r b/2V | — | ASSUMPTION | estimate | Typical. No measured value found. |
| Yaw moment coefficient at full rudder (`aero.rudderCn`) | 0.06 | — | — | ASSUMPTION | estimate | Typical. No measured value found. |
| Side force from sideslip Cyβ (`aero.cyBeta`) | -0.6 | per rad | — | ASSUMPTION | estimate | Typical of a fuselage and fin. No measured value found. |
| Slipstream swirl acting on the fin (`aero.swirl`) | 0.15 | fraction | — | ASSUMPTION | estimate | Yaw moment = swirl × thrust × propeller diameter, yawing against the propeller rotation; set so that a few degrees of rudder are needed at climbing power. |
| Rigging against engine torque (`aero.rollRig`) | 0.0018 | — | — | ASSUMPTION | estimate | Equal to the engine's torque reaction in level flight at 110 m/s and 1,500 m (the test-flight start), so the aircraft holds its wings level hands-off there; at other speeds and powers the pilot holds some aileron, as in the real aircraft. |
| Fixed fin offset or rudder tab (`aero.yawRig`) | 0.00092 | — | — | ASSUMPTION | estimate | Cancels the slipstream swirl in level flight at 110 m/s and 1,500 m, as a fixed fin offset or ground-set tab would; at other powers the pilot uses rudder. |
| Roll bias when stalled (wing drop) (`aero.stallBias`) | 0 | — | — | S31, ASSUMPTION | estimate | None: S31 describes a mild stall with no consistent wing drop. |
| Elevator stick force at full deflection per unit dynamic pressure (`controls.pitchHinge`) | 0.0434 | N/Pa | — | S11 | medium | Fitted (`npm run calibrate`) to NACA's stick-force gradient in turns, 5.0 lb/g (S11), at 230 mph IAS and 10,000 ft. |
| Aileron stick force at full deflection per unit dynamic pressure (`controls.rollHinge`) | 0.035 | N/Pa | — | S13 | medium | S13: 30 lb at 230 mph IAS (q = 6,473 Pa) gave pb/2V 0.050 of the full 0.085, so full deflection would need 30 lb ÷ 0.588. The model reproduces the 30 lb point. |
| Rudder pedal force at full deflection per unit dynamic pressure (`controls.yawHinge`) | 0.06 | N/Pa | — | ASSUMPTION | estimate | No source. With the 150 lb pedal limit, full rudder is available to about 300 mph. |
| Flap travel time (`controls.flapTime`) | 5 | s | — | ASSUMPTION | estimate | No source. The Spitfire's pneumatic flaps went straight to fully down. |
| Undercarriage travel time (`controls.gearTime`) | 6 | s | — | ASSUMPTION | estimate | No source. Typical of the period. |
| Reduction gear ratio (propeller turns per engine turn) (`propeller.gearRatio`) | 0.477 | — | 0.477:1 | S11 | medium | Merlin 45 (close variant); also given for the Merlin XX (S12). Not found for the Merlin III itself. |
| Rotation (+1 clockwise seen from the cockpit) (`propeller.rotation`) | 1 | — | Rt. Hd. | S4 | medium | Right-hand tractor airscrew. |
| Fine pitch stop (`propeller.betaMin`) | 23.33 | deg | 23° 20′ | S4 | medium | Rotol on N3171. The blade station is not stated; taken as the 0.75 R station of the NACA data (assumption). |
| Coarse pitch stop (`propeller.betaMax`) | 58.33 | deg | 58° 20′ (estimated in S4) | S4 | medium | As above. |
| Lowest governed engine speed (`propeller.rpmMin`) | 1800 | rpm | — | ASSUMPTION | estimate | Typical lower end of the constant-speed lever. |
| Highest governed engine speed (`propeller.rpmMax`) | 3000 | rpm | 3000 rpm | S6 | medium | Combat limit. |
| Blade width relative to the NACA 640 propeller (`propeller.solidity`) | 1.119 | — | — | S4, ASSUMPTION | estimate | Fitted (`npm run calibrate`, product owner's decision 25 Oct 2026) so the climb to 20,000 ft at 2600 rpm, +6¼ lb takes N3171's 7.7 min (S4). Thrust and power coefficients are both scaled by it. A tuning factor standing in for the Rotol's wider blades (D24). |
| Rotating inertia at propeller speed (propeller and engine) (`propeller.inertia`) | 35 | kg m² | — | ASSUMPTION | estimate | Three blades of about 25 kg plus the engine's rotating parts referred to propeller speed (engine inertia divided by the gear ratio squared). Sets how quickly rpm changes. Lowered from 50 in checkpoint 3. |
| Net gyroscopic inertia at propeller speed (`propeller.gyroInertia`) | 20 | kg m² | — | ASSUMPTION | estimate | The propeller's spin, less the crankshaft's: through a single spur reduction gear the crankshaft turns the other way, cancelling part of the propeller's gyroscopic effect. Estimate; checkpoint 3 found 50 kg m² made spins tumble. |
| Governor gain (blade-angle rate per fractional rpm error) (`propeller.governorGain`) | 3 | rad/s | — | ASSUMPTION | estimate | Settles the rpm in about a second. |
| Maximum blade-angle rate (`propeller.pitchRate`) | 0.17 | rad/s | — | ASSUMPTION | estimate | About 10°/s; no source. |


### Undercarriage and ground contact (Phase 2)

Positions are from the centre of gravity in body axes (x forward, y up, z right), wheels with their legs extended.
They were measured from the source's scaled drawing; the centre of gravity's height is not stated anywhere, so it is
assumed to lie on the thrust line, which makes the heights estimates.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Main wheel centre, ahead of the centre of gravity (`gear.main.x`) | 0.26 | m | about 10 in | S11 | medium | Measured from S11 Fig. 4 (Spitfire VA three-view; same undercarriage on the Mk I). The centre of gravity is 31.4 in behind the wing root leading edge (S11). |
| Main wheel centre, height (`gear.main.y`) | -1.6 | m | — | S11, ASSUMPTION | estimate | Measured from S11 Fig. 4 below the thrust line; the centre of gravity's height is assumed to be on the thrust line. |
| Half the main wheel track (`gear.main.z`) | 0.889 | m | track 5 ft 10 in | S11 | medium | Dimensioned on S11 Fig. 4. |
| Main wheel radius (`gear.main.radius`) | 0.31 | m | — | S11 | medium | Measured from S11 Fig. 4 (about 24 in diameter). |
| Tailwheel centre, x (`gear.tail.x`) | -6.01 | m | — | S11 | medium | Measured from S11 Fig. 4. |
| Tailwheel centre, height (`gear.tail.y`) | -0.523 | m | — | S11, ASSUMPTION | estimate | Set so the parked aircraft sits at the 11.2° ground angle of S11 Fig. 4. The tailwheel as drawn gives 12.5°; this places it 0.12 m lower. |
| Tailwheel radius (`gear.tail.radius`) | 0.09 | m | — | S11 | medium | Measured from S11 Fig. 4. |
| Ground angle: thrust line to the ground on all three wheels (`gear.groundAngle`) | 11.2 | deg | 11.2° | S11 | medium | Dimensioned on S11 Fig. 4 (Spitfire VA; close variant). The model's parked attitude equals it. |
| Main leg and tyre squash under the parked weight (`gear.mainDeflection`) | 0.1 | m | — | ASSUMPTION | estimate | No source. Sets the spring rate of each main leg (the parked weight divided by this). |
| Tailwheel squash under the parked weight (`gear.tailDeflection`) | 0.06 | m | — | ASSUMPTION | estimate | No source. Sets the tailwheel's spring rate. |
| Oleo damping, fraction of critical (`gear.dampingRatio`) | 0.6 | fraction | — | ASSUMPTION | estimate | No source; typical of an oleo-pneumatic leg. Stops the aircraft bouncing on its legs. |
| Most braking force as a fraction of the wheel's load (`gear.brake`) | 0.3 | fraction | — | ASSUMPTION | estimate | No measured value; typical of drum brakes on grass. The tail-lift limit, not this, mostly sets how hard the scripted pilot can brake (FLIGHT_VALIDATION.md). |
| Tailwheel castors freely (1 = yes) (`gear.tail.castor`) | 1 | — | — | ASSUMPTION | estimate | Castoring tailwheel assumed; steering is by rudder and differential brakes. Not confirmed from a source (see gaps). |
| Left wingtip, x (`contacts.leftTip.x`) | -0.3 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Left wingtip, y (`contacts.leftTip.y`) | 0.04 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Left wingtip, z (`contacts.leftTip.z`) | -5.62 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Right wingtip, x (`contacts.rightTip.x`) | -0.3 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Right wingtip, y (`contacts.rightTip.y`) | 0.04 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Right wingtip, z (`contacts.rightTip.z`) | 5.62 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the nose, x (`contacts.nose.x`) | 1.6 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the nose, y (`contacts.nose.y`) | -0.55 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the nose, z (`contacts.nose.z`) | 0 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the belly (radiator), x (`contacts.belly.x`) | 0 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the belly (radiator), y (`contacts.belly.y`) | -0.97 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Lowest point of the belly (radiator), z (`contacts.belly.z`) | 0 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, x (`contacts.tail.x`) | -5.7 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, y (`contacts.tail.y`) | -0.36 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, z (`contacts.tail.z`) | 0 | m | — | S11, ASSUMPTION | estimate | Crash point, read approximately from S11 Fig. 4. Touching the ground with it ends the flight. |
| Propeller hub ahead of the centre of gravity (`propHub.x`) | 2.18 | m | — | S11 | medium | Measured from S11 Fig. 4 (plane of the airscrew). |
| Propeller hub height (`propHub.y`) | 0 | m | — | ASSUMPTION | estimate | On the thrust line, which is assumed to pass through the centre of gravity. |
| Pilot's eye, x (`eye.x`) | -1.39 | m | — | S11, ASSUMPTION | estimate | Read from S11 Fig. 4 (cockpit position); the eye position itself is estimated. |
| Pilot's eye, height (`eye.y`) | 0.48 | m | — | S11, ASSUMPTION | estimate | About 2 in below the canopy top in S11 Fig. 4. |
| Reflector gunsight ring, angular diameter (`sight.ringMils`) | 100 | mils | — | ASSUMPTION | estimate | Barr & Stroud GM 2 reflector sight assumed (standard in RAF fighters by 1940; not yet confirmed from an allowed source). The ring's size was not found in an allowed source (forum and dealer figures disagree); a display placeholder until the gunsights are researched for Phase 5 (see gaps). |
| Flap positions besides up (1 = up or fully down only) (`controls.flapStops`) | 1 | — | two positions only, up and fully down | S33 | medium | Pneumatic split flaps; they 'cannot therefore be used to assist take-off' (S33). |
| Flap travel, fully down (`controls.flapTravel`) | 85 | deg | 85° | S11 | medium | Split flaps. Close variant (VA). |
| Flap setting for take-off, fraction of travel (`controls.flapTakeoff`) | 0 | fraction | Flaps - UP | S33 | medium | Take-off drill; the flaps 'cannot therefore be used to assist take-off' (S33). |
| Flap setting for landing, fraction of travel (`controls.flapLanding`) | 1 | fraction | Flaps - DOWN | S33 | medium | Approach drill (S33). |
| Elevator travel, full up (`controls.elevatorUp`) | 29 | deg | about 29° up from the thrust axis at full rear stick | S11 | medium | Read from S11 Fig. 5 (Spitfire VA); full forward gives about 24° down. Used for the three-point landing check (S11: about 8.4° up at contact). |
| Elevator trim, time from one end to the other (`controls.trimTime`) | 8 | s | — | ASSUMPTION | estimate | No source; a handwheel. |
| Yaw moment of the rudder trim tab at full travel (`aero.rudderTrimCn`) | 0.02 | — | — | S11, S33, ASSUMPTION | estimate | S11 lists a rudder trim tab and S33 sets it 'fully to starboard' for take-off. Its power was not found: a third of the rudder's assumed. |

### Take-off, landing and ground running (validation data, Phase 2)

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Landing run with brakes | 283.5 | m | 310 yd | S4 | medium | N3171, from touchdown; corrected to zero wind and standard atmosphere. Best landing speed 66 mph by the pilot's indicator, gliding in at 87 mph (S4). |
| Take-off distance to clear 50 ft | 338 | m | 370 yd | S4 | medium | N3171, zero wind, standard atmosphere. |
| Engine speed at full throttle on the ground | 2675 | rpm | 2650 - 2700 | S33 | medium | Static run-up with the propeller control fully forward; 'TWO men on the tail' are required for it (S33). |
| Approach speeds | 38 | m/s | engine assisted about 85 mph IAS; glide 90 mph IAS | S33 | medium | Flaps and undercarriage down. S33's position-error table adds 10 mph at 100-110 mph, so these readings are about 10 mph below the true indicated airspeed. |
| Maximum speed, flaps down | 62.6 | m/s | 140 mph IAS | S33 | medium | Undercarriage down: 160 mph (S6, S33). |

## Rolls-Royce Merlin III (Hurricane I and Spitfire I)

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Layout | 12-cylinder 60° V, glycol-cooled, geared, single-speed supercharger | — | 12-cylinder V-type … glycol-cooled, geared and highly supercharged | S7 | medium | A.P. 1590B p. 16 (Merlin II; the Merlin III is "basically similar", p. 17). |
| Carburation | Two carburettors, coolant-jacketed and oil-heated | — | two coolant-jacketed and oil heated carburettors | S7 | medium | The carburettor type is not named in S7. S22 reports that the carburettor cuts out under negative g and that the Luftwaffe exploited this. |
| Reduction gear ratio | 0.477 | — | 0.477:1 | S11, S12 | medium | Given for the Merlin 45 (S11) and the Merlin XX (S12). Not found for the Merlin III itself. |
| Normal maximum boost (`ratings.normal.map`) | 144.4 | kPa | +6¼ lb/sq in | S4, S6 | high | Absolute pressure. |
| Emergency boost (100-octane fuel) (`ratings.emergency.map`) | 184.1 | kPa | +12 lb/sq in | S6, S7, S8 | high | Absolute pressure. Obtained by pulling the boost-control cut-out. |
| Altitude to which +12 lb/sq in can be held | 3048 | m | about 10,000 ft | S7, S8 | high | Above it, boost falls to normal at the operational height. |
| Time limit at +12 lb/sq in | short periods (emergency) | — | for short periods under emergency conditions | S6, S7 | high | No minutes given. Dowding's 1 Aug 1940 letter on Merlin handling (on the archive site) is not yet read. The product owner chose no fixed limit in the game (D14). |
| Fuel consumption increase at +12 lb/sq in | 40 | % | about 40 per cent | S7 | medium | |
| Combat rpm limit below 6,096 m | 298.5 | rad/s | 2,850 rpm (½ hr limit) | S6 | medium | Crankshaft speed. Above 20,000 ft: 3,000 rpm (½ hr). |
| Diving rpm limit | 3,600 rpm for 20 s | — | maximum 3,600 r.p.m.; 3,000 may be exceeded only for 20 s with throttle at least one third open | S6 | medium | Read from the Pilot's Notes extract. |
| Minimum rpm at +6¼ lb/sq in | 2,080 rpm | — | minimum r.p.m. 2,080 | S6 | medium | |
| Power at sea level, +6¼ lb/sq in, 3,000 rpm | 656 | kW | about 880 bhp | S9 | medium | Read from chart (±10 bhp), level flight. |
| Power at sea level, +12 lb/sq in, 3,000 rpm | 884 | kW | about 1,185 bhp | S9 | medium | Read from chart (±10 bhp). |
| Peak power, +12 lb/sq in, 3,000 rpm | 977 | kW | about 1,310 bhp | S9 | medium | Read from chart (±10 bhp), at about 9,000 ft in level flight. The height is uncertain (chart scale). |
| Peak power, +6¼ lb/sq in, 3,000 rpm | 768 | kW | 1,030 bhp at 16,250 ft | S1, S9 | high | S1 and the chart agree. |
| Engine speed of the power curves (`refSpeed`) | 3000 | rpm | 3000 rpm | S9 | medium | The chart is drawn at 3000 rpm. |
| Power at +6¼ lb against altitude, constant-boost line (altitude m : power) (`ratings.normal.cb`) | 0:653.233, 4846:766.579 | kW | 876 hp at sea level, 1028 hp at about 15,900 ft | S9 | medium | Read from the chart (±10 hp). Extended in a straight line above the full-throttle height for the boost interpolation. Treated as without ram: the in-flight full-throttle heights (S1, S4) are higher, which the ram model supplies. |
| Power at +6¼ lb, full-throttle line (altitude m : power) (`ratings.normal.ft`) | 0:653.233, 4846:766.579, 6096:662.181, 7370:554.801 | kW | falls to about 744 hp at 24,200 ft | S9 | medium | Above the last point the manifold pressure falls in proportion to the outside pressure (fixed supercharger ratio; the chart's own last segment agrees within 4%). |
| Power at +12 lb against altitude, constant-boost line (altitude m : power) (`ratings.emergency.cb`) | 0:885.146, 2659:977.613 | kW | 1187 hp at sea level, 1311 hp at about 8,700 ft | S9 | medium | Read from the chart (±10 hp). |
| Power at +12 lb, full-throttle line (altitude m : power) (`ratings.emergency.ft`) | 0:885.146, 2659:977.613, 4846:766.579, 6096:662.181, 7370:554.801 | kW | joins the +6¼ lb line at its full-throttle height | S9 | medium | As above. |
| Closed-throttle manifold pressure (`idleMap`) | 39 | kPa | about −9 lb/sq in | ASSUMPTION | estimate | Typical; gives about 50 hp at 3000 rpm. |
| Change of power with engine speed at constant boost (exponent) (`rpmPowerExponent`) | 0 | — | 17 bhp less at 3000 than at 2800 rpm | S4 | medium | Taken as zero: S4 found power almost independent of rpm at +6¼ lb. |
| Change of supercharger delivery with engine speed (exponent) (`mapSpeedExponent`) | 1 | — | full-throttle height 2,000 ft lower at 2800 rpm | S4 | medium | An exponent of 1 reproduces the 2,000 ft. |
| Load factor below which the carburettor cuts out (`negativeG.threshold`) | 0 | g | negative g | S22, ASSUMPTION | estimate | S22 describes the cut on a sudden push forward. The exact threshold is not sourced. |
| Time under negative g before the cut (`negativeG.delay`) | 0.15 | s | — | ASSUMPTION | estimate | No source; a brief push should not cut the engine. |
| Time for the power to fall away (`negativeG.cutTime`) | 0.2 | s | — | ASSUMPTION | estimate | No source; the float chamber empties quickly. |
| Delay after positive g returns (flooding) (`negativeG.recoverDelay`) | 1 | s | — | ASSUMPTION | estimate | No source; the engine floods briefly before it picks up. |
| Time for the power to return (`negativeG.recoverTime`) | 1 | s | — | ASSUMPTION | estimate | No source; power returns over about a second. |
| Combat engine-speed limit (`maxSpeed`) | 3000 | rpm | 3000 rpm | S6 | medium | Not yet used (warnings come in Phase 8). |

## Messerschmitt Bf 109 E-4 (DB 601A)

No E-4 specific document was found. The data are for the E-1 and E-3 (same airframe and engine). The E-4 differed
in armament and armour (details and weights are open gaps). This is flagged as a deviation.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan (`geometry.span`) | 9.90 | m | 9,90 m | S16, S17 | high | |
| Wing area (`geometry.wingArea`) | 16.40 | m² | 16,4 m² | S16, S17 | high | |
| Length (`geometry.length`) | 8.76 | m | 8,76 m (S17); 8,8 m (S16) | S16, S17 | high | Agree within S16's rounding. |
| Height | 2.45 | m | 2,45 m (S17); 2,6 m (S16) | S16, S17 | medium | Sources disagree, possibly a different attitude. |
| Aerofoil, root | NACA 2R1 14.2 | — | NACA 2R1 14.2 | S14 | medium | |
| Aerofoil, tip | NACA 2R1 11 | — | NACA 2R1 11 | S14 | medium | |
| Empty weight (E-3) | 1865 | kg | Leergewicht 1865 kg | S16 | medium | |
| Equipped weight (E-3) | 2053 | kg | Rüstgewicht 2053 kg | S16 | medium | Empty plus 188 kg of additional equipment. |
| Flying weight, full (E-3, no armour plate) (`mass.flying`) | 2608 | kg | Fluggewicht voll 2608 kg | S16 | medium | S17 gives 2,540 kg for an earlier specification. |
| Fuel | 304 | kg | Kraftstoff 400 Liter, 0–304 kg | S16, S17 | high | 400 L. S17: 400 L = 303 kg. |
| Oil | 27 | kg | Schmierstoff 29,5 Liter, 9–27 kg | S16 | medium | S17: 30 L = 27 kg. |
| Pilot with parachute | 100 | kg | Führer + Fallschirm + Sonderbekleidung 70–100 kg | S16 | medium | |
| Ballast | 25 | kg | Ballast 25 kg | S16 | medium | |
| CG, full (E-3) | 0.616 | m | 61,6 cm behind the leading edge at wing rib 1 | S16 | medium | Permitted range 43.8–66.6 cm. Empty-weight CG 27.0 cm. |
| Engine | Daimler-Benz DB 601A | — | DB 601 A | S16 | medium | Inverted V-12, direct fuel injection, 33.93 L, 87-octane fuel (S19). |
| Reduction gear ratio | 1.55 | — | 1 : 1,55 | S16, S19 | high | Engine turns 1.55 times per airscrew turn. |
| Airscrew | VDM three-blade, 3.1 m diameter | — | Luftschraube 3flügelig, 3,1 Ø | S16 | medium | VDM airscrew; automatic pitch control could be fitted (S19). |
| Airscrew diameter (`propeller.diameter`) | 3.1 | m | 3,1 m | S16 | medium | |
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
| Roll moment of inertia (`mass.ixx`) | 3994 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.25 (roll, of b/2), 0.38 (pitch, of L/2) and 0.39 (yaw, of (b+L)/4) are typical of single-engine propeller aircraft (method after Roskam; the ratios are not checked against the book). |
| Pitch moment of inertia (`mass.iyy`) | 7225 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.25 (roll, of b/2), 0.38 (pitch, of L/2) and 0.39 (yaw, of (b+L)/4) are typical of single-engine propeller aircraft (method after Roskam; the ratios are not checked against the book). |
| Yaw moment of inertia (`mass.izz`) | 8627 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.25 (roll, of b/2), 0.38 (pitch, of L/2) and 0.39 (yaw, of (b+L)/4) are typical of single-engine propeller aircraft (method after Roskam; the ratios are not checked against the book). |
| Zero-lift angle of attack, body axis (`aero.alphaZeroLift`) | -3.5 | deg | — | S32, ASSUMPTION | estimate | The sections resemble NACA 2315 and 2310 (S32: 2% camber), zero lift near −2°; the root is set about 1.5° above the thrust line (17° ground attitude at the root, S32, against 15.5° for the thrust line measured on S32 Fig. 5; D28). No wing twist (S32). |
| Mean aerodynamic chord (`geometry.mac`) | 1.634 | m | 5.36 ft (mean chord, s/span) | S32 | medium | S32 Table 1. Was 1.71 m (estimate) until 25 Oct 2026 (D30). |
| Maximum lift coefficient, power off, flaps up, slats open (`aero.clMax`) | 1.4 | — | 1.4 | S32 | medium | RAE gliding stalls at 5,580 lb, airspeed from a trailing static: 95.5 mph IAS (S32 Table 4). The pilot's indicator read 75 mph, which explains S20's low figures. Was 1.47 (from S20) until D30. |
| Maximum lift coefficient, flaps and undercarriage down (`aero.clMaxFlaps`) | 1.9 | — | 1.9 | S32 | medium | As above, flaps 42.5° and ailerons drooped 10°: 81 mph IAS (S32 Table 4). Was 2.06 (from S17's landing speed) until D30. |
| Wing dihedral (`aero.dihedral`) | 5.75 | deg | 5.75° | S32 | medium | S32 Table 1. Was 5° (estimate) until D30. |
| Washout: outer wing set lower than the root (`aero.washout`) | 0 | deg | there is no wing twist | S32 | medium | S32 §2.71. Was 1° (estimate) until D30; the slats, not washout, keep the outer wing flying. |
| Zero-lift drag coefficient (`aero.cd0`) | 0.0273 | — | — | ASSUMPTION | estimate | Fitted (`npm run calibrate`) to 460 km/h at sea level, 1.30 ata and 2400 rpm at 2608 kg (S16), as the product owner decided (D14); refitted after the S32 values (D30). High compared with the RAF fighters: the manufacturer's 500 km/h (S17) would need about 0.021. |
| Oswald span efficiency (`aero.oswald`) | 0.8 | — | — | ASSUMPTION | estimate | No measured value found. Typical of a monoplane fighter (fuselage and gun ports lower it). |
| Drag of fully lowered split flaps (`aero.flapCd`) | 0.07 | — | — | ASSUMPTION | estimate | Typical of large split flaps; only affects the approach and glide. |
| Drag of the lowered undercarriage (`aero.gearCd`) | 0.02 | — | — | ASSUMPTION | estimate | Typical of a single-engine fighter. |
| Extra drag with the radiator flap fully open (`aero.radiatorCd`) | 0.004 | — | — | ASSUMPTION | estimate | About 1-2% of total drag at cruise. |
| Fraction of the wing in the propeller slipstream (`aero.slipstreamWing`) | 0.196 | — | — | S31, ASSUMPTION | estimate | Fitted (`npm run calibrate`) to the NACA power-on stall of the Spitfire VA (S31): 77 mph IAS, CL 1.63 at 36.9 in Hg and 2650 rpm (with the Spitfire's blade-width correction). The same value is used for all three aircraft. The disc width over the span would suggest about 0.3. |
| Static margin (`aero.staticMargin`) | 0.05 | fraction | — | ASSUMPTION | estimate | No source; a typical stable fighter. |
| Pitching moment coefficient at zero lift (`aero.cmZero`) | 0.02 | — | — | ASSUMPTION | estimate | Set so that the trim range covers cruise to approach. Tuned by flying (checkpoint 3). |
| Pitch damping Cmq (`aero.cmq`) | -12 | per unit q c/2V | — | ASSUMPTION | estimate | Typical order for a single-engine fighter. No measured value found. |
| Pitching moment coefficient at full up elevator (`aero.elevatorCm`) | 0.2 | — | — | ASSUMPTION | estimate | No source; tuned by flying. |
| Pitching moment range of the elevator trimmer (`aero.trimCm`) | 0.03 | — | — | ASSUMPTION | estimate | Enough to trim hands-off from the approach to top speed. |
| Pitching moment from fully lowered flaps (`aero.flapCm`) | -0.02 | — | — | ASSUMPTION | estimate | A small nose-down change. S24 reports a larger temporary change on the Bf 110; not modelled yet. |
| Roll moment coefficient at full aileron (`aero.aileronCl`) | 0.0507 | — | — | S32, ASSUMPTION | estimate | Fitted (`npm run calibrate`) so that at 400 mph IAS, with the one-fifth aileron the pilot can reach, 45° of bank takes as long as in the model's Spitfire: S32 found both took about 4 s. The model's Spitfire takes 1.2 s, so the comparison is matched, not the time (D30). Was 0.0412 (the RAF fighters' mean) until D30. |
| Adverse yaw at full aileron (`aero.adverseYaw`) | -0.008 | — | — | ASSUMPTION | estimate | Fitted in checkpoint 3 so a full-aileron roll at 1.1 times the stall speed, rudder fixed, develops about 18° of sideslip, as NACA measured on the Spitfire VA (S11): model 17°. The same value is used for all three. |
| Weathercock stability Cnβ (`aero.cnBeta`) | 0.07 | per rad | — | ASSUMPTION | estimate | Typical of a single-engine fighter. No measured value found. |
| Yaw damping Cnr (`aero.cnr`) | -0.1 | per unit r b/2V | — | ASSUMPTION | estimate | Typical. No measured value found. |
| Yaw moment coefficient at full rudder (`aero.rudderCn`) | 0.06 | — | — | ASSUMPTION | estimate | Typical. No measured value found. |
| Side force from sideslip Cyβ (`aero.cyBeta`) | -0.6 | per rad | — | ASSUMPTION | estimate | Typical of a fuselage and fin. No measured value found. |
| Slipstream swirl acting on the fin (`aero.swirl`) | 0.15 | fraction | — | ASSUMPTION | estimate | Yaw moment = swirl × thrust × propeller diameter, yawing against the propeller rotation; set so that a few degrees of rudder are needed at climbing power. |
| Rigging against engine torque (`aero.rollRig`) | -0.0021 | — | — | ASSUMPTION | estimate | Negative: the propeller turns the other way. Equal to the torque reaction in level flight at 110 m/s and 1,500 m. |
| Fixed fin offset or rudder tab (`aero.yawRig`) | -0.00146 | — | — | ASSUMPTION | estimate | Cancels the slipstream swirl in level flight at 110 m/s and 1,500 m, as a fixed fin offset or ground-set tab would; at other powers the pilot uses rudder. |
| Roll bias when stalled (wing drop) (`aero.stallBias`) | -0.02 | — | — | S20, ASSUMPTION | estimate | S20: the left wing tends to drop at the stall. Size chosen to give a clear but recoverable drop. |
| Elevator stick force at full deflection per unit dynamic pressure (`controls.pitchHinge`) | 0.0755 | N/Pa | — | S20, S21, ASSUMPTION | estimate | S20, S21: controls heavy above about 250 mph; the elevator almost immovable in a dive at 400 mph. Set so only about 15% of elevator travel is available at 400 mph with a 50 lb pull. |
| Aileron stick force at full deflection per unit dynamic pressure (`controls.rollHinge`) | 0.034 | N/Pa | 1/5 aileron at 400 mph | S32 | medium | S32 Table 5: one-fifth aileron is all a pilot can apply at 400 mph, in the 109 as in the Spitfire. Fitted with the common 30 lb pilot limit (S13): S32's own forces (40 lb for the 109, 60 lb for the Spitfire) are about twice NACA's for the Spitfire, so the deflection, not the force, is used. Was 0.0272 (estimate) until D30. |
| Rudder pedal force at full deflection per unit dynamic pressure (`controls.yawHinge`) | 0.06 | N/Pa | — | ASSUMPTION | estimate | No source. With the 150 lb pedal limit, full rudder is available to about 300 mph. |
| Flap travel time (`controls.flapTime`) | 8 | s | — | ASSUMPTION | estimate | No source. Hand-operated flaps, assumed slower than the RAF fighters'. |
| Undercarriage travel time (`controls.gearTime`) | 8 | s | — | ASSUMPTION | estimate | No source. Typical of the period. |
| Reduction gear ratio (propeller turns per engine turn) (`propeller.gearRatio`) | 0.6452 | — | 1 : 1.55 | S16, S19 | high | Engine 1.55 turns per propeller turn. |
| Rotation (+1 clockwise seen from the cockpit) (`propeller.rotation`) | -1 | — | left (seen from the power-output side, DIN 9001) | S19, S20, ASSUMPTION | estimate | Anticlockwise from the cockpit assumed: consistent with S20's slight swing to the right on take-off. The DIN viewing convention needs checking. |
| Fine pitch stop (`propeller.betaMin`) | 22.5 | deg | 22.5° | S32 | medium | S32: the pilot can set any pitch between 22.5° and 90° (fully feathering). Blade station not stated; taken as 0.75 R. Was 20° (estimate) until D30. |
| Coarse pitch stop used by the model (`propeller.betaMax`) | 55 | deg | 90° (fully feathering) | S32, ASSUMPTION | estimate | S32 gives 90°, but the NACA propeller data (S30) stop at 45° and stretching them to 90° gives a feathered airscrew absorbing great power, which is unphysical. 55° covers every flight speed; feathering is left for the twin-engine work (Phase 3). |
| Lowest engine speed the assist will hold (`propeller.rpmMin`) | 1500 | rpm | — | ASSUMPTION | estimate | Only used by the engine-management assist. |
| Engine speed held by the engine-management assist (`propeller.rpmMax`) | 2400 | rpm | 2400 rpm | S15, S18 | high | 5-minute rating. |
| Rotating inertia at propeller speed (propeller and engine) (`propeller.inertia`) | 35 | kg m² | — | ASSUMPTION | estimate | Three blades of about 25 kg plus the engine's rotating parts referred to propeller speed (engine inertia divided by the gear ratio squared). Sets how quickly rpm changes. Lowered from 50 in checkpoint 3. |
| Net gyroscopic inertia at propeller speed (`propeller.gyroInertia`) | 25 | kg m² | — | ASSUMPTION | estimate | The propeller's spin, less the crankshaft's: through a single spur reduction gear the crankshaft turns the other way, cancelling part of the propeller's gyroscopic effect. Estimate; checkpoint 3 found 50 kg m² made spins tumble. |
| Governor gain (blade-angle rate per fractional rpm error) (`propeller.governorGain`) | 3 | rad/s | — | ASSUMPTION | estimate | Settles the rpm in about a second. Used only by the engine-management assist. |
| Maximum blade-angle rate (`propeller.pitchRate`) | 0.07 | rad/s | — | ASSUMPTION | estimate | The VDM pitch was changed electrically with a thumb switch; assumed slow (about 4°/s), no source. |
| Slat opening starts (local angle from zero lift) (`slats.openAlpha`) | 12.4 | deg | slots open at CL 0.865 (flaps up) | S32 | medium | Fitted (`npm run calibrate`) so the slats start to open at a wing lift coefficient of 0.865 with the flaps up (S32 Table 4: 120.5 mph IAS at 5,580 lb). With the flaps down they then open at a higher lift coefficient, as S32 measured (1.2). Was 10.5° (estimate) until D30. |
| Slat fully open (local angle from zero lift) (`slats.fullAlpha`) | 14.4 | deg | — | ASSUMPTION | estimate | 2° after opening starts; no source. S32: both slots opened almost simultaneously. |
| Maximum lift coefficient with the slats closed (`slats.clMaxClosed`) | 1.15 | — | — | ASSUMPTION | estimate | No source; slats assumed to add about 0.3. |
| Slats' increase in the outer wing's section maximum lift over the root's (`slats.sectionGain`) | 0.3 | — | — | ASSUMPTION | estimate | No source. With the slats open the outer wing stalls a little after the root; with them closed it stalls first, giving the 109's flick (S21). The panel maxima are then fitted so the whole wing reaches the sourced 1.47 (open) and 1.15 (closed). |
| Slat travel rate (`slats.rate`) | 4 | 1/s | — | ASSUMPTION | estimate | No source. Fast but not instant; uneven opening gives the flick S21 describes. |

**Deviation note, Bf 109 E level speed.**
- The handbook-family data sheet (S16) gives 460 km/h at sea level. The manufacturer's specification (S17) gives
  500 km/h, with a stated ±5% tolerance.
- S17 also quotes higher engine ratings (1,175 PS for take-off at 2,500 rpm) than the October 1940 engine manual (S18:
  1,100 PS at 2,400 rpm).
- Phase 1 calibrates to S16, 460 km/h (product owner's decision, D14), and reports the gap to S17.
- The Rechlin comparison (S22) says the 109 E was about 20 km/h faster than the Spitfire at sea level. Against S3's
  283 mph (455 km/h) for the Spitfire, that supports a 109 E sea-level speed nearer 475 km/h.


### Undercarriage and ground contact (Phase 2)

Positions are from the centre of gravity in body axes (x forward, y up, z right), wheels with their legs extended.
They were measured from the source's scaled drawing; the centre of gravity's height is not stated anywhere, so it is
assumed to lie on the thrust line, which makes the heights estimates.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Main wheel centre, ahead of the centre of gravity (`gear.main.x`) | 0.584 | m | about 23 in | S32 | medium | Measured from the RAE's scaled side view (S32 Fig. 5). The centre of gravity is 24.8 in behind the root leading edge (S32); S32: 'unusually far behind the main wheels'. |
| Main wheel centre, height (`gear.main.y`) | -1.365 | m | — | S32, ASSUMPTION | estimate | Measured from S32 Fig. 5 below the thrust line; the centre of gravity's height is assumed to be on the thrust line. |
| Half the main wheel track (`gear.main.z`) | 0.95 | m | — | S32, ASSUMPTION | estimate | Track about 1.9 m (± 0.1 m) measured from the small front view of S32 Fig. 1 against its scale; not dimensioned. |
| Main wheel radius (`gear.main.radius`) | 0.315 | m | — | S32 | medium | Measured from S32 Fig. 5. |
| Tailwheel centre, x (`gear.tail.x`) | -5.22 | m | — | S32 | medium | Measured from S32 Fig. 5. |
| Tailwheel centre, height (`gear.tail.y`) | 0.047 | m | — | S32, ASSUMPTION | estimate | Set so the parked aircraft sits at the 15.5° ground angle (the tailwheel as drawn gives 15.0°). |
| Tailwheel radius (`gear.tail.radius`) | 0.07 | m | — | S32 | medium | Measured from S32 Fig. 5 (a small drawing). |
| Ground angle: thrust line to the ground on all three wheels (`gear.groundAngle`) | 15.5 | deg | 17° at the wing root | S32 | medium | S32: 'the ground attitude has been made large, 17 deg. at the wing root'. The thrust line measures 15.5° on S32 Fig. 5, so the root is set about 1.5° above the thrust line (not stated). |
| Main leg and tyre squash under the parked weight (`gear.mainDeflection`) | 0.1 | m | — | ASSUMPTION | estimate | No source. Sets the spring rate of each main leg (the parked weight divided by this). |
| Tailwheel squash under the parked weight (`gear.tailDeflection`) | 0.06 | m | — | ASSUMPTION | estimate | No source. Sets the tailwheel's spring rate. |
| Oleo damping, fraction of critical (`gear.dampingRatio`) | 0.6 | fraction | — | ASSUMPTION | estimate | No source; typical of an oleo-pneumatic leg. Stops the aircraft bouncing on its legs. |
| Most braking force as a fraction of the wheel's load (`gear.brake`) | 0.3 | fraction | — | ASSUMPTION | estimate | No measured value; typical of drum brakes on grass. The tail-lift limit, not this, mostly sets how hard the scripted pilot can brake (FLIGHT_VALIDATION.md). |
| Tailwheel castors freely (1 = yes) (`gear.tail.castor`) | 1 | — | — | ASSUMPTION | estimate | Castoring tailwheel assumed; steering is by rudder and differential brakes. Not confirmed from a source (see gaps). |
| Left wingtip, x (`contacts.leftTip.x`) | -0.2 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Left wingtip, y (`contacts.leftTip.y`) | 0.1 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Left wingtip, z (`contacts.leftTip.z`) | -4.95 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Right wingtip, x (`contacts.rightTip.x`) | -0.2 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Right wingtip, y (`contacts.rightTip.y`) | 0.1 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Right wingtip, z (`contacts.rightTip.z`) | 4.95 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Lowest point of the nose, x (`contacts.nose.x`) | 1.4 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Lowest point of the nose, y (`contacts.nose.y`) | -0.61 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Lowest point of the nose, z (`contacts.nose.z`) | 0 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Lowest point of the belly (radiator), x (`contacts.belly.x`) | -0.6 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Lowest point of the belly (radiator), y (`contacts.belly.y`) | -0.65 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Lowest point of the belly (radiator), z (`contacts.belly.z`) | 0 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, x (`contacts.tail.x`) | -5.0 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, y (`contacts.tail.y`) | 0.2 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, z (`contacts.tail.z`) | 0 | m | — | S32, ASSUMPTION | estimate | Crash point, read approximately from S32 Fig. 5. Touching the ground with it ends the flight. |
| Propeller hub ahead of the centre of gravity (`propHub.x`) | 2.41 | m | — | S32 | medium | Measured from S32 Fig. 5. |
| Propeller hub height (`propHub.y`) | 0 | m | — | ASSUMPTION | estimate | On the thrust line, which is assumed to pass through the centre of gravity. |
| Pilot's eye, x (`eye.x`) | -0.89 | m | — | S32, ASSUMPTION | estimate | Read from S32 Fig. 5 (cockpit position); the eye position itself is estimated. |
| Pilot's eye, height (`eye.y`) | 0.556 | m | — | S32, ASSUMPTION | estimate | A little below the canopy top in S32 Fig. 5. S20: the hood touches the head of a normal pilot. |
| Reflector gunsight ring, angular diameter (`sight.ringMils`) | 100 | mils | — | ASSUMPTION | estimate | Revi C/12C reflector sight assumed (the usual sight of the Bf 109 E; not yet confirmed from an allowed source). The ring's size was not found in an allowed source (figures of 6 and 100 mils appear in unverified descriptions); a display placeholder until Phase 5 (see gaps). |
| Flap positions besides up (`controls.flapStops`) | 4 | — | marked from zero to 40 degrees (fully down) in tens of degrees | S20 | medium | Handwheel; any position could be set (S32), the markings are every 10°. S32 takes off with 20°. |
| Flap travel, fully down (`controls.flapTravel`) | 40 | deg | marked from zero to 40 degrees (fully down) | S20 | medium | S32 gives 42.5° (Table 4) and 42.6° (Table 1); the cockpit markings (S20) are used for the indicator. |
| Flap setting for take-off, fraction of travel (`controls.flapTakeoff`) | 0.5 | fraction | 20 deg (the recommended position) | S32 | medium | 'All the take-off tests were done with the slotted flaps set at the recommended position of 20 deg.' |
| Flap setting for landing, fraction of travel (`controls.flapLanding`) | 1 | fraction | flaps 42.5° (landing condition) | S32 | medium | S32 Table 4's landing condition: flaps fully down. |
| Elevator travel, full up (`controls.elevatorUp`) | 31.6 | deg | 31.6° up | S32 | medium | S32 Table 1 (with the tailplane at 0°). |
| Tailplane trim, time from one end to the other (`controls.trimTime`) | 18 | s | can be moved over the whole range in about 18 seconds | S20 | medium | Trim by a movable tailplane (S20, S32). Neither rudder nor aileron trim was fitted (S20). |

### Take-off and landing (validation data, Phase 2)

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Take-off ground run | 260 | m | 260 m | S15 | medium | Handbook figure; flap setting not stated. S32 used 20° for take-off. |
| Approach speed | 41.6 | m/s | about 90 mph (S32); best gliding speed 93 mph (S20) | S20, S32 | medium | Flaps and undercarriage down, pilot's indicator. |

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
| Engine speed of the power curves (`refSpeed`) | 2400 | rpm | 2400 U/min | S18 | medium | 5-minute rating. |
| 5-minute rating manifold pressure (`ratings.normal.map`) | 1.3 | ata | 1,30 ata | S15, S18 | high | Absolute. |
| 5-minute power (1.30 ata, 2400 rpm) against altitude (altitude m : power) (`ratings.normal.cb`) | 0:728.144, 500:736.031, 1000:752.176, 1500:766.119, 2000:781.568, 2100:783.918, 2500:773.991, 3000:763.426, 3500:755.821, 4000:751.185, 4500:750.209 | kW | 990 PS at 0 km … 1,020 PS at 4.5 km | S18 | medium | Bild 6 read by pixel measurement (its altitude scale is not linear), scaled to the manual's table values at 0 and 4.5 km (the chart reads about 1% low). Without ram. |
| Full-throttle power at 2400 rpm against altitude (altitude m : power) (`ratings.normal.ft`) | 0:728.144, 500:736.031, 1000:752.176, 1500:766.119, 2000:781.568, 2100:783.918, 2500:773.991, 3000:763.426, 3500:755.821, 4000:751.185, 4500:750.209, 5000:707.014, 5500:666.741, 6000:626.468, 7000:553.38, 8000:483.276, 9000:423.612, 10,000:369.169, 11,000:316.963 | kW | falls to about 425 PS at 11 km | S18 | medium | As above; above 5 km the shared full-throttle line at 2400 rpm. |
| Manifold pressure at which net power would be zero (`zeroPowerMap`) | 0.3 | ata | — | S18, ASSUMPTION | estimate | Fitted so the 30-minute (2300 rpm, 1.23 ata, 910 PS) and continuous (2200 rpm, 1.15 ata, 810 PS) ratings come out within 1%. |
| Closed-throttle manifold pressure (`idleMap`) | 0.35 | ata | — | ASSUMPTION | estimate | Gives about 50 PS at 2400 rpm, like the Merlin's idle. |
| Change of power with engine speed at constant pressure (exponent) (`rpmPowerExponent`) | 0.5 | — | — | S18, ASSUMPTION | estimate | Fitted with the zero-power pressure above. |
| Change of supercharger delivery with engine speed (exponent) (`mapSpeedExponent`) | 1 | — | — | S18, ASSUMPTION | estimate | Reproduces the gap between the 2200 and 2400 rpm full-throttle lines at 7 km within 1%. |
| 5-minute engine-speed limit (`maxSpeed`) | 2400 | rpm | 2400 U/min | S15, S18 | high | Not yet used (warnings come in Phase 8). |

### Cockpit gauge pressures (fuel and oil)

The pressures are not modelled physically; the fuel and oil pressure gauge shows these running values while the engine
turns (scaled down at low rpm), with the normal range green and the low range red.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Lowest oil pressure at 2400 rpm (`pressures.oilLow`) | 2.2 | kg/cm² | Minimum at 2400 r.p.m. 2·2 Kg. per sq. cm. | S24 | medium | Bf 110 instructions; same DB 601A engine. Top of the red band. |
| Oil pressure, normal range (`pressures.oilNormal`) | 2.5:5 | kg/cm² | Take-off: Maximum 5 Kg. per sq. cm., Minimum 2·5 Kg. per sq. cm. | S24 | medium | The green band. Written as from:to. |
| Oil pressure shown while running (`pressures.oilRunning`) | 4 | kg/cm² | — | ASSUMPTION | estimate | Inside the normal range; no measured running value found. |
| Oil scale, full deflection (`pressures.oilFullScale`) | 10 | kg/cm² | — | ASSUMPTION | estimate | Read approximately from the Bf 110 photograph's combined gauge (D39); not confirmed. |
| Lowest fuel pressure (`pressures.fuelLow`) | 0.8 | kg/cm² | — | ASSUMPTION | estimate | No fuel pressure limits found for the DB 601A; a typical injection-pump feed. Top of the red band. |
| Fuel pressure, normal range (`pressures.fuelNormal`) | 1.2:1.8 | kg/cm² | — | ASSUMPTION | estimate | No source found; the green band. S24 notes hand pumping cannot exceed about 1 kg/cm². |
| Fuel pressure shown while running (`pressures.fuelRunning`) | 1.5 | kg/cm² | — | ASSUMPTION | estimate | Middle of the assumed normal range. |
| Fuel scale, full deflection (`pressures.fuelFullScale`) | 3 | kg/cm² | — | ASSUMPTION | estimate | No source found; covers the assumed range. |

## Messerschmitt Bf 110 C-4 (2 × DB 601A)

No C-4 specific document was found. S23 covers the C-1 and C-2. The C-4 added armour, whose weight is an open gap. This is
flagged as a deviation. S24 and S25 come from RAF flying of an aircraft captured in July 1940, which carried no armour.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan (`geometry.span`) | 16.2 | m | 16,2 m | S23 | medium | |
| Wing area (`geometry.wingArea`) | 38.4 | m² | 38,4 m² | S23 | medium | |
| Length (`geometry.length`) | 12.0 | m | 12,0 m | S23 | medium | |
| Height | 3.3 | m | 3,3 m | S23 | medium | |
| Aerofoil, root | NACA 2R1 18.5 | — | NACA 2R1 18.5 | S14 | medium | |
| Aerofoil, tip | NACA 2R1 11 | — | NACA 2R1 11 | S14 | medium | |
| Equipped weight (C-2) | 5020 | kg | Rüstgewicht 5020 kg | S23 | medium | C-1: 4,897 kg. |
| Crew | 200 | kg | Besatzung (2 Mann) 200 kg | S23 | medium | Two crew as a fighter (S25 agrees). |
| Ammunition (C-2) | 281 | kg | Munition 281 kg | S23 | medium | |
| Fuel (C-2) | 965 | kg | Kraftstoff (γ = 0,76 kg/ltr) 965 kg | S23 | medium | |
| Oil | 64 | kg | Schmierstoff (γ = 0,91 kg/ltr) 64 kg | S23 | medium | |
| Flying weight (C-2) (`mass.flying`) | 6530 | kg | Fluggewicht 6530 kg | S23 | medium | C-1: 6,040 kg. |
| Wing loading (C-2) | 166 | kg/m² | 166 kg/m² | S23 | medium | |
| Fuel tank capacity | 1270 | L | each wing: main 375 l (82.5 gal) and reserve 260 l (58 gal) | S24, S25 | high | S25: 82 + 57 gallons each side, 278 gallons in all. Engines feed from the main tanks only; reserve fuel is pumped across. |
| Fuel in each wing, main and reserve tanks (`fuel.wingTank`) | 635 | L | main 375 litres and reserve 260 litres | S24, S25 | high | Full scale of the left and right fuel quantity gauges (D45). S25 agrees (82 + 57 gallons). |
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

### Flight-model values (Phase 3)

Estimated and fitted values the model needs, keyed to `src/aircraft/bf110c4.js`. No scaled drawing of the Bf 110 was
found, so positions are estimates from the overall dimensions (S23). Where nothing else is known, values are the
Bf 109's (same designer, engine and airscrew).

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Mean aerodynamic chord, taken as area over span (`geometry.mac`) | 2.37 | m | 38.4 m² / 16.2 m | S23 | medium | Mean geometric chord, as S32 gives for the Bf 109. |
| Roll moment of inertia (`mass.ixx`) | 49,530 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.34 (roll, of b/2), 0.29 (pitch, of L/2) and 0.44 (yaw, of (b+L)/4), assumed typical of twin-engine propeller aircraft, whose engines sit out on the wings (after Roskam; the ratios are not checked against the book). |
| Pitch moment of inertia (`mass.iyy`) | 19,770 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.34 (roll, of b/2), 0.29 (pitch, of L/2) and 0.44 (yaw, of (b+L)/4), assumed typical of twin-engine propeller aircraft, whose engines sit out on the wings (after Roskam; the ratios are not checked against the book). |
| Yaw moment of inertia (`mass.izz`) | 62,830 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method: no measured inertia found. Ratios 0.34 (roll, of b/2), 0.29 (pitch, of L/2) and 0.44 (yaw, of (b+L)/4), assumed typical of twin-engine propeller aircraft, whose engines sit out on the wings (after Roskam; the ratios are not checked against the book). |
| Zero-lift angle of attack, body axis (`aero.alphaZeroLift`) | -3 | deg | — | S14, ASSUMPTION | estimate | Sections NACA 2R1 (2% camber, S14): zero lift near −2°, plus about 1° of wing setting assumed; no rigging figure found. |
| Maximum lift coefficient, power off, flaps up, slats open (`aero.clMax`) | 1.47 | — | — | S32, ASSUMPTION | estimate | No measured stall speed found (S24 gives none). The flaps-down value less the 0.5 that the RAE measured for the Bf 109's flaps (S32: 1.4 to 1.9). Power-off stall about 150 km/h IAS. |
| Maximum lift coefficient, flaps and undercarriage down (`aero.clMaxFlaps`) | 1.97 | — | 132 km/h landing speed at 6,530 kg | S23, ASSUMPTION | estimate | Fitted (`npm run calibrate`) so the model's power-off stall, flaps and undercarriage down, is S23's landing speed. A landing speed is usually a little above the stall, so this may be slightly low. |
| Zero-lift drag coefficient (`aero.cd0`) | 0.0264 | — | — | S23, ASSUMPTION | estimate | Fitted (`npm run calibrate`) to 440 km/h at sea level, 1.30 ata and 2400 rpm at 6,530 kg (S23). |
| Oswald span efficiency (`aero.oswald`) | 0.7 | — | — | ASSUMPTION | estimate | No measured value found. Product owner's decision (25 Oct 2026, D37): lowered from the fighters' 0.8, which brings the climb above 4 km and the ceiling nearer S23. The engine nacelles break up the wing's lift distribution, which supports a lower value than a single-engine fighter's. |
| Drag of fully lowered flaps (`aero.flapCd`) | 0.08 | — | — | ASSUMPTION | estimate | Large flaps lowered 50° (S24); a little more than the Bf 109's 0.07. |
| Drag of the lowered undercarriage (`aero.gearCd`) | 0.015 | — | — | ASSUMPTION | estimate | Two large main wheels and open bays: about 0.6 m² of drag area, twice the Bf 109's. |
| Extra drag with the radiator flaps fully open (`aero.radiatorCd`) | 0.0035 | — | — | ASSUMPTION | estimate | Two radiators: about twice the Bf 109's drag area. |
| Washout: outer wing set lower than the root (`aero.washout`) | 0 | deg | — | S32, ASSUMPTION | estimate | Not found for the 110. Taken as the Bf 109's (S32: no twist), from the same designer with slats doing the same job. |
| Wing dihedral (`aero.dihedral`) | 5 | deg | — | ASSUMPTION | estimate | No source found. Similar to the Bf 109's 5.75° (S32). |
| Fraction of each wing half in its engine's slipstream (`aero.slipstreamWing`) | 0.24 | — | — | S31, ASSUMPTION | estimate | Each 3.1 m airscrew spans 0.38 of a wing half. The single-engine fits (S31) came out at 0.63 of the disc-over-span ratio, so the same factor is used: 0.38 × 0.63 = 0.24. |
| Static margin (`aero.staticMargin`) | 0.05 | fraction | — | ASSUMPTION | estimate | No source; a typical stable aircraft. S25: it trims hands-off. |
| Pitching moment coefficient at zero lift (`aero.cmZero`) | 0.02 | — | — | ASSUMPTION | estimate | As the Bf 109. Tuned by flying (checkpoint 3). |
| Pitch damping Cmq (`aero.cmq`) | -15 | per unit q c/2V | — | ASSUMPTION | estimate | A longer tail arm than a single-engine fighter's; no measured value found. |
| Pitching moment coefficient at full up elevator (`aero.elevatorCm`) | 0.2 | — | — | ASSUMPTION | estimate | No source; tuned by flying. |
| Pitching moment range of the elevator trimmer (`aero.trimCm`) | 0.03 | — | — | ASSUMPTION | estimate | Enough to trim from the approach to top speed. Trim wheel on the pilot's left (S24). |
| Pitching moment from fully lowered flaps (`aero.flapCm`) | -0.02 | — | — | S24, ASSUMPTION | estimate | S24: the nose first rears up, then sinks, and the eventual change of trim is very small. Only the small final change is modelled. |
| Roll moment coefficient at full aileron (`aero.aileronCl`) | 0.04 | — | — | ASSUMPTION | estimate | No roll data found. Smaller than the fighters'; tuned by flying. |
| Adverse yaw at full aileron (`aero.adverseYaw`) | -0.008 | — | — | ASSUMPTION | estimate | Taken as the Bf 109's value. |
| Weathercock stability Cnβ (`aero.cnBeta`) | 0.1 | per rad | — | ASSUMPTION | estimate | Twin fins and rudders on a long tail arm; more than the Bf 109's 0.07. No measured value found. With the rudder below, full rudder holds about 30° of sideslip. |
| Yaw damping Cnr (`aero.cnr`) | -0.15 | per unit r b/2V | — | ASSUMPTION | estimate | Engines and fins far from the centre of gravity damp yaw more. No measured value found. |
| Yaw moment coefficient at full rudder (`aero.rudderCn`) | 0.05 | — | — | ASSUMPTION | estimate | No source. Half of Cnβ, so full rudder holds about 30° of sideslip. On one engine at full power the heading can be held down to the stall (twinEngine.test.js); S25: it flies well on either engine. |
| Side force from sideslip Cyβ (`aero.cyBeta`) | -0.7 | per rad | — | ASSUMPTION | estimate | Typical of a fuselage, nacelles and twin fins. No measured value found. |
| Slipstream swirl acting on the fins (`aero.swirl`) | 0.1 | fraction | — | ASSUMPTION | estimate | Less than the Bf 109's 0.15: the fins are out of line with the airscrews. |
| Rigging against engine torque (`aero.rollRig`) | -0.00153 | — | — | ASSUMPTION | estimate | Equal to both engines' torque reaction in level flight at 110 m/s and 1,500 m (both airscrews turn the same way). |
| Fixed fin offset or rudder tab (`aero.yawRig`) | -0.00059 | — | — | ASSUMPTION | estimate | Cancels the slipstream swirl in level flight at 110 m/s and 1,500 m. |
| Roll bias when stalled (wing drop) (`aero.stallBias`) | -0.01 | — | — | S24, ASSUMPTION | estimate | S24: landing too high gives a tendency for a wing to drop (side not stated). Smaller than the Bf 109's. |
| Yaw moment of the rudder trimmers at full travel (`aero.rudderTrimCn`) | 0.015 | — | — | S24, ASSUMPTION | estimate | S24: a rudder trimmer lever on a notched quadrant. Its power was not found: about a third of the rudder's, as for the Spitfire. Enough to trim out one engine at 250 km/h, not at approach speed. |
| Elevator stick force at full deflection per unit dynamic pressure (`controls.pitchHinge`) | 0.07 | N/Pa | — | S24, ASSUMPTION | estimate | S24: light and very effective up to 250 mph, then heavy (S25 disagrees: still manoeuvrable at 340 mph). Tuned in checkpoint 3. |
| Aileron stick force at full deflection per unit dynamic pressure (`controls.rollHinge`) | 0.035 | N/Pa | — | S24, ASSUMPTION | estimate | As the Bf 109 (S32); S24 as above. |
| Rudder pedal force at full deflection per unit dynamic pressure (`controls.yawHinge`) | 0.06 | N/Pa | — | ASSUMPTION | estimate | Taken as the Bf 109's value. |
| Flap travel time (`controls.flapTime`) | 8 | s | — | ASSUMPTION | estimate | Hydraulic flaps (S24); no time found. |
| Undercarriage travel time (`controls.gearTime`) | 8 | s | — | ASSUMPTION | estimate | Hydraulic (S24); no time found. |
| Flap positions besides up (keyboard steps) (`controls.flapStops`) | 5 | — | indicator 0° to 50°; any intermediate position | S24 | medium | S24: the flaps can be stopped anywhere, read on an indicator graduated 0° to 50°. The keys step 10° at a time. |
| Flap travel, fully down (`controls.flapTravel`) | 50 | deg | 0° to 50° | S24 | medium |  |
| Flap setting for take-off, fraction of travel (`controls.flapTakeoff`) | 0 | fraction | It is not necessary to use flaps for take-off | S24 | medium |  |
| Flap setting for landing, fraction of travel (`controls.flapLanding`) | 1 | fraction | full flap | S24, ASSUMPTION | estimate | S24 implies full flap for a normal landing (25° only on one engine). |
| Elevator travel, full up (`controls.elevatorUp`) | 30 | deg | — | ASSUMPTION | estimate | No source found; used for display only. |
| Elevator trim wheel, time from one end to the other (`controls.trimTime`) | 10 | s | — | ASSUMPTION | estimate | No source found; typical of the period. |
| Airscrew diameter (`propeller.diameter`) | 3.1 | m | 3,1 Ø | S23 | medium |  |
| Reduction gear ratio (airscrew turns per engine turn) (`propeller.gearRatio`) | 0.6452 | — | 1 : 1,55 | S23 | medium |  |
| Rotation (+1 clockwise seen from the cockpit) (`propeller.rotation`) | -1 | — | — | ASSUMPTION | estimate | As the Bf 109's DB 601A. No handed (opposite-turning) engines were found for the 110, so both turn the same way. |
| Fine pitch stop (`propeller.betaMin`) | 22.5 | deg | 22.5° | S32, ASSUMPTION | estimate | The Bf 109's VDM airscrew (S32); taken as the same for the 110. S24: 12 o'clock on the indicator is fine pitch. |
| Coarse pitch stop in normal use (`propeller.betaMax`) | 55 | deg | — | ASSUMPTION | estimate | As the Bf 109 (the NACA data stop at 45°, D30). Beyond it only feathering. |
| Feathered blade angle (`propeller.featherAngle`) | 90 | deg | 22.5° to 90° (fully feathering) | S24, S25, S32 | medium | S24: the levers are moved right down to feather; S32 gives 90° for the VDM airscrew. |
| Drag area of a stopped, feathered airscrew (`propeller.featheredDragArea`) | 0.06 | m² | — | ASSUMPTION | estimate | Three blades of about 0.35 m² each, edge-on, plus the spinner: a small drag. No measured value. |
| Rotating inertia at airscrew speed (`propeller.inertia`) | 35 | kg m² | — | ASSUMPTION | estimate | As the Bf 109 (same engine and airscrew). |
| Net gyroscopic inertia at airscrew speed (`propeller.gyroInertia`) | 25 | kg m² | — | ASSUMPTION | estimate | Taken as the Bf 109's value. |
| Governor gain (engine-management assist) (`propeller.governorGain`) | 3 | rad/s | — | ASSUMPTION | estimate | Taken as the Bf 109's value. |
| Maximum blade-angle rate (`propeller.pitchRate`) | 0.07 | rad/s | — | ASSUMPTION | estimate | As the Bf 109 (electric pitch change); also the feathering rate. |
| Lowest engine speed the assist will hold (`propeller.rpmMin`) | 1500 | rpm | — | ASSUMPTION | estimate | Only used by the engine-management assist. |
| Engine speed held by the engine-management assist (`propeller.rpmMax`) | 2400 | rpm | 2400 rpm | S24 | medium | 5-minute rating. |
| Left airscrew hub, ahead of the centre of gravity (`engines.left.x`) | 2.3 | m | — | ASSUMPTION | estimate | No scaled drawing found. From the overall length (S23) and the airscrews' position ahead of the wing leading edge. |
| Left airscrew hub, height (`engines.left.y`) | 0 | m | — | ASSUMPTION | estimate | On a thrust line through the centre of gravity. |
| Left airscrew hub, sideways (`engines.left.z`) | -2.45 | m | — | ASSUMPTION | estimate | The 3.1 m discs must clear the fuselage (about 1.3 m wide) with some margin: 1.55 + 0.65 + 0.25 m. |
| Right airscrew hub, ahead of the centre of gravity (`engines.right.x`) | 2.3 | m | — | ASSUMPTION | estimate | As the left engine's. |
| Right airscrew hub, height (`engines.right.y`) | 0 | m | — | ASSUMPTION | estimate | As the left engine's. |
| Right airscrew hub, sideways (`engines.right.z`) | 2.45 | m | — | ASSUMPTION | estimate | As the left engine's. |
| Slat opening starts (local angle from zero lift) (`slats.openAlpha`) | 12.4 | deg | — | S32, ASSUMPTION | estimate | Automatic slots (S24). Taken as the Bf 109's fitted value (S32). |
| Slat fully open (`slats.fullAlpha`) | 14.4 | deg | — | ASSUMPTION | estimate | Taken as the Bf 109's value. |
| Maximum lift coefficient with the slats closed (`slats.clMaxClosed`) | 1.22 | — | — | ASSUMPTION | estimate | As the Bf 109, slats assumed to add 0.25. |
| Slats' increase in the outer wing's section maximum lift (`slats.sectionGain`) | 0.3 | — | — | ASSUMPTION | estimate | Taken as the Bf 109's value. |
| Slat travel rate (`slats.rate`) | 4 | 1/s | — | ASSUMPTION | estimate | Taken as the Bf 109's value. |
| Main wheel centre, ahead of the centre of gravity (`gear.main.x`) | 0.45 | m | — | ASSUMPTION | estimate | No scaled drawing found. S24: the tail is fairly heavy and slow to rise, so the wheels are not far ahead of the centre of gravity. |
| Main wheel centre, height (`gear.main.y`) | -1.6 | m | — | ASSUMPTION | estimate | From the height (3.3 m, S23) and the wheel size. |
| Half the main wheel track (`gear.main.z`) | 2.3 | m | — | ASSUMPTION | estimate | The wheels retract into the engine nacelles (S24), so they sit under the engines. |
| Main wheel radius (`gear.main.radius`) | 0.42 | m | — | ASSUMPTION | estimate | No source; sized for a 6.5 t aircraft. |
| Tailwheel centre, x (`gear.tail.x`) | -7.4 | m | — | ASSUMPTION | estimate | Near the tail end of the 12.0 m fuselage (S23). |
| Tailwheel centre, height (`gear.tail.y`) | -0.27 | m | — | ASSUMPTION | estimate | Set so the parked aircraft sits at the assumed ground angle. |
| Tailwheel radius (`gear.tail.radius`) | 0.15 | m | — | ASSUMPTION | estimate | No source found; typical of the period. |
| Tailwheel castors freely (1 = yes) (`gear.tail.castor`) | 1 | — | — | ASSUMPTION | estimate | Steering by rudder, brakes and engines assumed. |
| Ground angle: thrust line to the ground on all three wheels (`gear.groundAngle`) | 11 | deg | — | ASSUMPTION | estimate | No source or drawing found. Must stay below the stalling angle. |
| Main leg and tyre squash under the parked weight (`gear.mainDeflection`) | 0.12 | m | — | ASSUMPTION | estimate | No source found; typical of the period. |
| Tailwheel squash under the parked weight (`gear.tailDeflection`) | 0.06 | m | — | ASSUMPTION | estimate | No source found; typical of the period. |
| Oleo damping, fraction of critical (`gear.dampingRatio`) | 0.6 | fraction | — | ASSUMPTION | estimate | As the fighters. |
| Most braking force as a fraction of the wheel's load (`gear.brake`) | 0.3 | fraction | — | ASSUMPTION | estimate | Toe brakes (S24); as the fighters. |
| Left wingtip, x (`contacts.leftTip.x`) | -0.4 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Left wingtip, y (`contacts.leftTip.y`) | 0.3 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Left wingtip, z (`contacts.leftTip.z`) | -8.1 | m | — | S23 | medium | Half the 16.2 m span. |
| Right wingtip, x (`contacts.rightTip.x`) | -0.4 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Right wingtip, y (`contacts.rightTip.y`) | 0.3 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Right wingtip, z (`contacts.rightTip.z`) | 8.1 | m | — | S23 | medium | Half the 16.2 m span. |
| Lowest point of the nose, x (`contacts.nose.x`) | 4.2 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Lowest point of the nose, y (`contacts.nose.y`) | -0.55 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Lowest point of the nose, z (`contacts.nose.z`) | 0 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Lowest point of the belly, x (`contacts.belly.x`) | 0 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Lowest point of the belly, y (`contacts.belly.y`) | -0.95 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Lowest point of the belly, z (`contacts.belly.z`) | 0 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, x (`contacts.tail.x`) | -7.1 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, y (`contacts.tail.y`) | -0.1 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Underside of the rear fuselage, z (`contacts.tail.z`) | 0 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S23); no scaled drawing found. Touching the ground with it ends the flight. |
| Reflector gunsight ring, angular diameter (`sight.ringMils`) | 100 | mils | — | ASSUMPTION | estimate | Revi sight (S25: thinner lines than the GM 2); the ring size is an open gap, as for the Bf 109. |
| Pilot's eye, ahead of the centre of gravity (`eye.x`) | 1.0 | m | — | ASSUMPTION | estimate | The pilot sits ahead of the wing; S24 praises the view ahead. |
| Pilot's eye, height (`eye.y`) | 0.9 | m | — | ASSUMPTION | estimate | No source found; typical of the period. |

## Heinkel He 111 H (AI only)

Two period documents were found on 24 Oct 2026:
- the Luftwaffe weapons manual of October 1940 (S28), which gives the defensive guns of the He 111 H;
- a Soviet 1943 description of the later H-6 and H-11 (S29).

The product owner decided (D40) to build the He 111 from S29's H-6/H-11 as a close variant for the 1940 H-3: its
weights and performance are used, although the H-6/H-11's Jumo 211F engines were more powerful than the H-3's. This is
flagged as a deviation. H-3 sources are still sought.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wingspan (`geometry.span`) | 22.6 | m | 22.6 m (S26); 22,45 m (S29) | S26, S29 | medium | Two close variants (CASA 2.111B; H-6/H-11) disagree by 0.15 m. S26 is used; S34 gives 74 ft 3 in (22.63 m). |
| Length (`geometry.length`) | 16.4 | m | 16,4 m | S29 | medium | H-6/H-11. |
| Height at rest | 4.61 | m | 4,61 m при стоянке | S29 | medium | H-6/H-11. |
| Airscrews | Junkers VS-11, three wooden blades | — | трехлопастные, типа Юнкерс VS-11, с деревянными лопастями | S29 | medium | H-6/H-11. The H-3's airscrew is not confirmed. |
| Airscrew pitch control | fully automatic (constant speed) | — | vollautomatischen Junkers Verstell-Luftschraubenanlage VS 11 … am Jumo 211 F u. J | S36 | medium | Modelled as a constant-speed airscrew (`propeller.type`). |
| Crew stations | pilot; bomb-aimer (A-Stand gun); radio operator (B-Stand gun); gunner (C-Stand gun) | — | A-Stand durch den Bombenschützen, B-Stand durch den Funker, C-Stand durch Schützen | S28 | medium | The two waist guns and the rear MG 17 are worked by the radio operator or the C-Stand gunner (S28). S29 gives a crew of 4–5. |
| A-Stand (nose) gun | 1 × MG 15 in a GD-A 1114 ball mount, 13 double drums | — | 1 MG 15 in Kuppellafette GD-A 1114; 13 Doppeltrommeln Dt 15 | S28 | medium | The MG 15 double (saddle) drum holds 75 rounds (S25, S27), so 975 rounds. |
| B-Stand (dorsal) gun | 1 × MG 15 on a D 30 ring mount, 14 double drums | — | 1 MG 15 in Drehkranz D 30; 14 Doppeltrommeln Dt 15 | S28 | medium | 1,050 rounds. |
| C-Stand (ventral gondola) gun | 1 × MG 15 in an LL-K or L 15/1 mount, 15 double drums | — | 1 MG 15 in kleiner Linsenlafette LL-K oder in Lafette L 15/1; 15 Doppeltrommeln Dt 15 | S28 | medium | 1,125 rounds. The H-5 carried an MG FF/M here instead (S28, Anhang 1). |
| Waist guns | 2 × MG 15, one each side, 10 double drums shared | — | 2 MG 15 … je 1 MG 15 rechts und links; 10 Doppeltrommeln Dt 15 | S28 | medium | |
| Tail gun | 1 × MG 17, fixed, firing rearwards | — | 1 MG 17 in starrer Lagerung (Heck-Stand) | S28 | medium | Fired electrically by the radio operator or the C-Stand gunner. |
| Empty weight (H-6/H-11) | 8550 | kg | вес пустого самолета 8550 кг | S29 | medium | Later variant; the H-3 weight is a gap. |
| Flying weight (H-6/H-11) (`mass.flying`) | 12270 | kg | полетный вес 12270 кг | S29 | medium | Overload up to 14,000–15,000 kg (S29). |
| Engine power (H-6/H-11, Jumo 211F-1) | 993 | kW | 1350 л. с. take-off | S29 | medium | Rated 1,020 hp at 5,500 m. The H-3's Jumo 211 had less power, so these figures are an upper bound for the H-3. |
| Maximum speed at sea level (H-11, 11,500 kg) | 91.7 | m/s | 330 km/h | S29 | medium | The full table of true and indicated speeds, 0-8 km, is in `src/aircraft/validationCases.js` and FLIGHT_VALIDATION.md. |
| Maximum speed (H-11, 11,500 kg) | 111.1 | m/s | 400 km/h at 5,700 m | S29 | medium | |
| Time to 5,000 m (H-11, 11,500 kg) | 1200 | s | 20 min | S29 | medium | Times to height are given to the whole minute, 1-7 km. |
| Service ceiling (H-11, 11,500 kg) | 8750 | m | практический потолок 8750 м | S29 | medium | Reached in 57 min. |
| Time for a 360° turn (H-11) | 48.3 | s | 48,3 сек при скорости 281 км/час | S29 | medium | At 281 km/h. |
| Fuel and oil tanks self-sealing | yes | — | similar construction to those used on the Heinkel 111H | S25 | medium | |

### Flight-model values (Phase 3)

Estimated and fitted values the model needs, keyed to `src/aircraft/he111h.js`. No scaled drawing was found, so
positions are estimates from the overall dimensions.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Wing area (`geometry.wingArea`) | 87.5 | m² | 942 sq. ft. | S34 | medium | Wartime British recognition data (aspect ratio 5.85 quoted with it). No German figure found. |
| Mean aerodynamic chord, taken as area over span (`geometry.mac`) | 3.87 | m | 87.5 m² / 22.6 m | S26, S34 | medium |  |
| Roll moment of inertia (`mass.ixx`) | 181,100 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method with the twin-engine ratios used for the Bf 110 (0.34, 0.29, 0.44; after Roskam, not checked against the book). No measured inertia found. |
| Pitch moment of inertia (`mass.iyy`) | 69,390 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method with the twin-engine ratios used for the Bf 110 (0.34, 0.29, 0.44; after Roskam, not checked against the book). No measured inertia found. |
| Yaw moment of inertia (`mass.izz`) | 225,800 | kg m² | — | ASSUMPTION | estimate | Radius-of-gyration method with the twin-engine ratios used for the Bf 110 (0.34, 0.29, 0.44; after Roskam, not checked against the book). No measured inertia found. |
| Zero-lift angle of attack, body axis (`aero.alphaZeroLift`) | -2.5 | deg | — | ASSUMPTION | estimate | No section or rigging data found; a cambered section with a small wing setting. |
| Maximum lift coefficient, flaps up (`aero.clMax`) | 1.4 | — | — | ASSUMPTION | estimate | No stall speed found; typical of a large unslatted wing. Power-off stall about 125 km/h at 12,270 kg. |
| Maximum lift coefficient, flaps and undercarriage down (`aero.clMaxFlaps`) | 1.9 | — | — | ASSUMPTION | estimate | No landing speed found; the clean value plus 0.5, as measured for the Bf 109 (S32). |
| Zero-lift drag coefficient (`aero.cd0`) | 0.0222 | — | — | S29, ASSUMPTION | estimate | Fitted (`npm run calibrate`) to 400 km/h at 5,700 m (S29, 11,500 kg) with S29's rated power of 1,020 PS at 5,500 m. |
| Oswald span efficiency (`aero.oswald`) | 0.7 | — | — | ASSUMPTION | estimate | As the Bf 110 (D37). With 0.8 the climb is 14-19% quick. |
| Drag of fully lowered flaps (`aero.flapCd`) | 0.08 | — | — | ASSUMPTION | estimate | As the Bf 110. |
| Drag of the lowered undercarriage (`aero.gearCd`) | 0.012 | — | — | ASSUMPTION | estimate | Two large wheels on a large wing area: about 1 m² of drag area. |
| Extra drag with the radiator flaps fully open (`aero.radiatorCd`) | 0.003 | — | — | ASSUMPTION | estimate | Two radiators, as the Bf 110 in drag area. |
| Washout (`aero.washout`) | 2 | deg | — | ASSUMPTION | estimate | No slats; a typical twist to keep the tips flying at the stall. |
| Wing dihedral (`aero.dihedral`) | 6 | deg | — | ASSUMPTION | estimate | No source found. |
| Fraction of each wing half in its engine's slipstream (`aero.slipstreamWing`) | 0.195 | — | — | S31, ASSUMPTION | estimate | Disc diameter over half the span (0.31) times the fighters' fitted factor 0.63, as for the Bf 110. |
| Static margin (`aero.staticMargin`) | 0.08 | fraction | — | ASSUMPTION | estimate | A stable bomber; no source. |
| Pitching moment coefficient at zero lift (`aero.cmZero`) | 0.02 | — | — | ASSUMPTION | estimate | As the other aircraft. |
| Pitch damping Cmq (`aero.cmq`) | -20 | per unit q c/2V | — | ASSUMPTION | estimate | A long tail arm; no measured value found. |
| Pitching moment coefficient at full up elevator (`aero.elevatorCm`) | 0.2 | — | — | ASSUMPTION | estimate | No source found; as the fighters. |
| Pitching moment range of the elevator trimmer (`aero.trimCm`) | 0.03 | — | — | ASSUMPTION | estimate | Enough to trim from approach to top speed. |
| Pitching moment from fully lowered flaps (`aero.flapCm`) | -0.02 | — | — | ASSUMPTION | estimate | As the other aircraft. |
| Roll moment coefficient at full aileron (`aero.aileronCl`) | 0.03 | — | — | ASSUMPTION | estimate | No roll data found; a large aircraft rolls slowly. |
| Adverse yaw at full aileron (`aero.adverseYaw`) | -0.008 | — | — | ASSUMPTION | estimate | As the other aircraft. |
| Weathercock stability Cnβ (`aero.cnBeta`) | 0.08 | per rad | — | ASSUMPTION | estimate | No measured value found. |
| Yaw damping Cnr (`aero.cnr`) | -0.15 | per unit r b/2V | — | ASSUMPTION | estimate | As the Bf 110. |
| Yaw moment coefficient at full rudder (`aero.rudderCn`) | 0.04 | — | — | ASSUMPTION | estimate | Half of Cnβ, as for the Bf 110. |
| Side force from sideslip Cyβ (`aero.cyBeta`) | -0.6 | per rad | — | ASSUMPTION | estimate | No measured value found. |
| Slipstream swirl acting on the fin (`aero.swirl`) | 0.08 | fraction | — | ASSUMPTION | estimate | Single fin out of line with the airscrews. |
| Rigging against engine torque (`aero.rollRig`) | -0.00105 | — | — | ASSUMPTION | estimate | Equal to both engines' torque reaction in level flight at 90 m/s and 1,500 m. |
| Fixed fin offset or rudder tab (`aero.yawRig`) | -0.00037 | — | — | ASSUMPTION | estimate | Cancels the slipstream swirl at 90 m/s and 1,500 m. |
| Roll bias when stalled (`aero.stallBias`) | -0.01 | — | — | ASSUMPTION | estimate | A small wing drop; no source. |
| Yaw moment of the rudder trim tab at full travel (`aero.rudderTrimCn`) | 0.015 | — | — | ASSUMPTION | estimate | No source; about a third of the rudder's. |
| Elevator stick force at full deflection per unit dynamic pressure (`controls.pitchHinge`) | 0.1 | N/Pa | — | ASSUMPTION | estimate | Heavier than the fighters'; no source. |
| Aileron stick force at full deflection per unit dynamic pressure (`controls.rollHinge`) | 0.06 | N/Pa | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Rudder pedal force at full deflection per unit dynamic pressure (`controls.yawHinge`) | 0.1 | N/Pa | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Flap travel time (`controls.flapTime`) | 15 | s | — | ASSUMPTION | estimate | No source; large flaps. |
| Undercarriage travel time (`controls.gearTime`) | 15 | s | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Flap positions besides up (keyboard steps) (`controls.flapStops`) | 5 | — | — | ASSUMPTION | estimate | No source; 10° steps. |
| Flap travel, fully down (`controls.flapTravel`) | 50 | deg | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Flap setting for take-off, fraction of travel (`controls.flapTakeoff`) | 0 | fraction | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Flap setting for landing, fraction of travel (`controls.flapLanding`) | 1 | fraction | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Elevator travel, full up (`controls.elevatorUp`) | 30 | deg | — | ASSUMPTION | estimate | No source; display only. |
| Elevator trim, time from one end to the other (`controls.trimTime`) | 15 | s | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Airscrew diameter (`propeller.diameter`) | 3.5 | m | — | ASSUMPTION | estimate | Not found (S29 gives only the type, VS 11). Sized to clear the fuselage and ground with the engine positions below. |
| Reduction gear ratio (`propeller.gearRatio`) | 0.5405 | — | — | ASSUMPTION | estimate | Not found. 1:1.85 keeps the 3.5 m airscrew's tip speed near 240 m/s at 2,400 rpm. |
| Rotation (+1 clockwise seen from the cockpit) (`propeller.rotation`) | -1 | — | — | ASSUMPTION | estimate | Not found; as the DB 601A aircraft. Both engines the same way. |
| Fine pitch stop (`propeller.betaMin`) | 20 | deg | — | ASSUMPTION | estimate | Not found. No measured value; a judgement from similar aircraft. |
| Coarse pitch stop (`propeller.betaMax`) | 55 | deg | — | ASSUMPTION | estimate | Not found. Whether the VS 11 could feather was not found, so no feathering is modelled. |
| Rotating inertia at airscrew speed (`propeller.inertia`) | 45 | kg m² | — | ASSUMPTION | estimate | Larger airscrew than the fighters'. |
| Net gyroscopic inertia at airscrew speed (`propeller.gyroInertia`) | 30 | kg m² | — | ASSUMPTION | estimate | As above. No measured value; a judgement from similar aircraft. |
| Governor gain (`propeller.governorGain`) | 3 | rad/s | — | ASSUMPTION | estimate | As the other aircraft. |
| Maximum blade-angle rate (`propeller.pitchRate`) | 0.1 | rad/s | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Lowest governed engine speed (`propeller.rpmMin`) | 1600 | rpm | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Highest governed engine speed (`propeller.rpmMax`) | 2400 | rpm | — | ASSUMPTION | estimate | The speed of the rated (climb and combat) power assumed; take-off is at 2,600 rpm (S35). |
| Left airscrew hub, ahead of the centre of gravity (`engines.left.x`) | 3.0 | m | — | ASSUMPTION | estimate | No scaled drawing found. |
| Left airscrew hub, height (`engines.left.y`) | 0 | m | — | ASSUMPTION | estimate | On a thrust line through the centre of gravity. |
| Left airscrew hub, sideways (`engines.left.z`) | -2.95 | m | — | ASSUMPTION | estimate | The 3.5 m discs clear a fuselage about 1.7 m wide: 1.75 + 0.85 + 0.35 m. |
| Right airscrew hub, ahead of the centre of gravity (`engines.right.x`) | 3.0 | m | — | ASSUMPTION | estimate | As the left engine's. |
| Right airscrew hub, height (`engines.right.y`) | 0 | m | — | ASSUMPTION | estimate | As the left engine's. |
| Right airscrew hub, sideways (`engines.right.z`) | 2.95 | m | — | ASSUMPTION | estimate | As the left engine's. |
| Main wheel centre, ahead of the centre of gravity (`gear.main.x`) | 0.6 | m | — | ASSUMPTION | estimate | No scaled drawing found. |
| Main wheel centre, height (`gear.main.y`) | -2.2 | m | — | ASSUMPTION | estimate | From the height at rest (4.61 m, S29). |
| Half the main wheel track (`gear.main.z`) | 2.6 | m | — | ASSUMPTION | estimate | Wheels under the engine nacelles. |
| Main wheel radius (`gear.main.radius`) | 0.55 | m | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Tailwheel centre, x (`gear.tail.x`) | -9.8 | m | — | ASSUMPTION | estimate | Near the tail of the 16.4 m fuselage (S29). |
| Tailwheel centre, height (`gear.tail.y`) | -0.28 | m | — | ASSUMPTION | estimate | Set so the parked aircraft sits at the assumed ground angle. |
| Tailwheel radius (`gear.tail.radius`) | 0.2 | m | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Tailwheel castors freely (1 = yes) (`gear.tail.castor`) | 1 | — | — | ASSUMPTION | estimate | Assumed, as the other aircraft. |
| Ground angle (`gear.groundAngle`) | 12 | deg | — | ASSUMPTION | estimate | No source or drawing found. |
| Main leg and tyre squash under the parked weight (`gear.mainDeflection`) | 0.12 | m | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Tailwheel squash under the parked weight (`gear.tailDeflection`) | 0.06 | m | — | ASSUMPTION | estimate | No source found; a judgement for a large aircraft. |
| Oleo damping, fraction of critical (`gear.dampingRatio`) | 0.6 | fraction | — | ASSUMPTION | estimate | As the other aircraft. |
| Most braking force as a fraction of the wheel's load (`gear.brake`) | 0.3 | fraction | — | ASSUMPTION | estimate | As the other aircraft. |
| Left wingtip, x (`contacts.leftTip.x`) | -0.6 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Left wingtip, y (`contacts.leftTip.y`) | 0.4 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Left wingtip, z (`contacts.leftTip.z`) | -11.3 | m | — | S26 | medium | Half the 22.6 m span. |
| Right wingtip, x (`contacts.rightTip.x`) | -0.6 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Right wingtip, y (`contacts.rightTip.y`) | 0.4 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Right wingtip, z (`contacts.rightTip.z`) | 11.3 | m | — | S26 | medium | Half the 22.6 m span. |
| Lowest point of the nose, x (`contacts.nose.x`) | 5.8 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Lowest point of the nose, y (`contacts.nose.y`) | -0.9 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Lowest point of the nose, z (`contacts.nose.z`) | 0 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Lowest point of the belly, x (`contacts.belly.x`) | 0 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Lowest point of the belly, y (`contacts.belly.y`) | -1.3 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Lowest point of the belly, z (`contacts.belly.z`) | 0 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Underside of the rear fuselage, x (`contacts.tail.x`) | -9.5 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Underside of the rear fuselage, y (`contacts.tail.y`) | -0.1 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Underside of the rear fuselage, z (`contacts.tail.z`) | 0 | m | — | ASSUMPTION | estimate | Crash point, estimated from the overall dimensions (S26, S29); no scaled drawing found. |
| Pilot's eye, ahead of the centre of gravity (`eye.x`) | 4.5 | m | — | ASSUMPTION | estimate | The pilot sits in the glazed nose; used only by the cockpit camera, which the He 111 does not offer. |
| Pilot's eye, height (`eye.y`) | 0.8 | m | — | ASSUMPTION | estimate | As above. No measured value; a judgement from similar aircraft. |

## Junkers Jumo 211F-1 (He 111 H-6/H-11)

Close variant for the H-3's Jumo 211 (D40). No power curve was found: S29 gives the take-off power and the rated and
cruising powers at 5,500 m. The full-throttle curve of the two-speed supercharger is fitted to S29's level speeds
(`npm run calibrate`), so the speeds at 0, 2,500 and 4,000 m are calibration points.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Take-off power | 993 | kW | 1350 л. с. (S29); 1,007 kW (1,350 hp) at 2,600 rpm (S35) | S29, S35 | high | Two independent sources agree. |
| Rated power at 5,500 m | 750 | kW | номинальная мощность на высоте 5500 м — 1020 л. с. | S29 | medium | Used as the high-gear full-throttle power (`ratings.normal.ft`, last point). |
| Cruising power at 5,500 m | 625 | kW | эксплоатационная — 850 л. с. | S29 | medium | Not used yet. |
| Fuel system | direct injection | — | almost all production versions having direct fuel injection | S35 | medium | So no negative-g cut-out (GAME_SPEC: "to be confirmed from a source"). |
| Reference crankshaft speed of the curves (`refSpeed`) | 2400 | rpm | — | ASSUMPTION | estimate | The rated power's speed is not stated; 2,400 rpm assumed (take-off 2,600 rpm, S35). |
| Rated manifold pressure (`ratings.normal.map`) | 1.25 | ata | — | ASSUMPTION | estimate | Not found; used for the gauge and part-throttle power only. |
| Constant-boost power line (`ratings.normal.cb`) | 0:664.522, 2200:769.486, 5800:750.209 | kW | — | S29, ASSUMPTION | estimate | Low gear to 2,200 m, then the high gear's line to 5,800 m; the points are the full-throttle values below. |
| Full-throttle power (`ratings.normal.ft`) | 0:664.522, 2200:769.486, 3200:720.574, 5800:750.209 | kW | 1020 л. с. at 5500 м | S29, ASSUMPTION | estimate | Fitted (`npm run calibrate`) to S29's level speeds at 0, 2,500 and 4,000 m; the last point is S29's rated power, placed at 5,800 m (intake height), the height that best matches S29's speeds above 5,700 m. Above it the supercharger's pressure ratio is held. |
| Manifold pressure of zero net power (`zeroPowerMap`) | 0.3 | ata | — | ASSUMPTION | estimate | As the DB 601A. |
| Closed-throttle manifold pressure (`idleMap`) | 0.35 | ata | — | ASSUMPTION | estimate | As the DB 601A. |
| Power against rpm exponent (`rpmPowerExponent`) | 0.5 | — | — | ASSUMPTION | estimate | As the DB 601A. |
| Supercharger pressure against rpm exponent (`mapSpeedExponent`) | 1 | — | — | ASSUMPTION | estimate | As the DB 601A. |
| Highest engine speed (`maxSpeed`) | 2600 | rpm | 1,350 hp at 2,600 rpm | S35 | medium | Take-off rating. |

## Common flight-model parameters

Shared by all aircraft (`src/aircraft/common.js`). All are physical theory or estimates.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Lift slope of a wing section (`sectionLiftSlope`) | 5.655 | per rad | 0.9 × 2π | ASSUMPTION | estimate | Thin-aerofoil theory gives 2π per radian; real sections reach about 90%. The whole-wing slope follows from Helmbold's equation with each aircraft's aspect ratio. |
| Sharpness of the stall (`stallWidth`) | 0.07 | rad | — | ASSUMPTION | estimate | Lift falls away over about 4°: the 13-19% thick sections of these wings stall gradually. Chosen in checkpoint 3: the first value (1.5°, typical of thin WW1 sections) gave violent stalls that contradict S12 and S31. |
| Drag coefficient of a fully stalled wing (`flatPlateCd`) | 1.3 | — | — | ASSUMPTION | estimate | A flat plate of aspect ratio about 6 across the flow is about 1.2-1.3 (an infinitely long strip about 2.0). Used for both the stalled lift and drag (normal force = this × sin a). |
| Inner panel's share of a wing half's lift (`panel.innerLift`) | 0.609 | fraction | — | ASSUMPTION | estimate | Theory: an elliptical lift distribution over the inner half of the semispan. Each wing half is modelled as two panels (D26). |
| Outer panel's share of a wing half's lift (`panel.outerLift`) | 0.391 | fraction | — | ASSUMPTION | estimate | Theory, as above. |
| Inner panel's lift centre (`panel.innerArm`) | 0.244 | fraction | — | ASSUMPTION | estimate | Theory: centroid of the elliptical lift on the inner half of the semispan. Together the panels place the half-wing's lift at 0.424 of the semispan, as for the whole elliptical wing. |
| Outer panel's lift centre (`panel.outerArm`) | 0.705 | fraction | — | ASSUMPTION | estimate | Theory, as above. |
| Extra roll damping of a stalled wing (`stalledRollDamping`) | -0.25 | per unit pb/2V | — | ASSUMPTION | estimate | Keeps a spin's rotation steady instead of tumbling: stalled wings and the fuselage still damp roll at high rates. A tuning value (checkpoint 3, D26). |
| Centre-of-pressure shift of a stalled wing root (`stallNoseDown`) | 0.35 | fraction | — | ASSUMPTION | estimate | A stalled wing's lift acts near mid-chord, behind the centre of gravity: nose-down pitching moment = this × CN (flat plate). S12 and S31 describe the pitch-down at the stall. 0.6 made the aircraft impossible to stall, so it was not used. |
| Dihedral cancelled by a low wing's junction with the fuselage (`lowWingDihedral`) | -3 | deg | — | ASSUMPTION | estimate | All three are low-wing aircraft, whose wing-fuselage junction reduces the effective dihedral; about 3° is a typical textbook size (not checked against a source). With it the Spitfire's roll and sideslip match NACA's S11 and S13 together (checkpoint 3, D26). |
| Ram recovery at the supercharger intake (`ramRecovery`) | 0.5 | fraction | — | S1, S4, S9, ASSUMPTION | estimate | Comparing the chart's full-throttle height with those in flight implies 0.62 (Spitfire, S4) and 0.37 (Hurricane, S1); the mean is used for all engines. |
| Share of the slipstream's extra dynamic pressure at the tail (`tailSlipstream`) | 0.5 | fraction | — | ASSUMPTION | estimate | No source; the tail sits partly in the slipstream. |
| Pilot's maximum pull on the stick (`pilotMaxForce.pitch`) | 222 | N | 50 lb | ASSUMPTION | estimate | No source; a firm one-handed pull. |
| Pilot's maximum sideways force on the stick (`pilotMaxForce.roll`) | 133 | N | 30 lb | S13 | medium | NACA: 30 lb is a reasonable upper limit for manoeuvring at high speed. |
| Pilot's maximum pedal force (`pilotMaxForce.yaw`) | 667 | N | 150 lb | ASSUMPTION | estimate | No source; a strong push with one leg. |
| Rolling resistance of a tyre on grass (`grass.rolling`) | 0.06 | fraction | — | ASSUMPTION | estimate | Typical of short dry grass in take-off calculations (about 0.05-0.08); no specific source checked. Changes take-off runs by a few per cent. |
| Most grip of a tyre on grass (`grass.friction`) | 0.5 | fraction | — | ASSUMPTION | estimate | Sideways and braking together (a friction circle). Typical of dry grass; no source. |
| Tyre slip angle at the peak side force (`grass.slipPeak`) | 0.14 | rad | about 8° | ASSUMPTION | estimate | Typical of an aircraft tyre; no source. |
| Sideways drag of a castoring tailwheel (`castorFriction`) | 0.1 | fraction | — | ASSUMPTION | estimate | Friction in the tailwheel's pivot, as a fraction of its load; no source. |
| Sliding speed below which tyre friction fades out (`slipSpeed`) | 0.1 | m/s | — | ASSUMPTION | estimate | Numerical: lets a parked or braked aircraft stand still without jittering. |
| Ground-effect constant (`groundEffect`) | 16 | — | — | ASSUMPTION | estimate | Induced drag near the ground is multiplied by (16h/b)² / (1 + (16h/b)²), with h the height and b the span: the approximation usually attributed to McCormick (1979; the book was not consulted). The lift slope rises to match the larger effective aspect ratio. |
| Lowest airspeed for the aerodynamic angles (`lowSpeed`) | 15 | m/s | — | ASSUMPTION | estimate | Below this (taxiing) the angles of attack and sideslip and the rotation terms are worked out as at this speed: the slipstream, not the free stream, sets the flow over the aircraft, and the terms would otherwise grow without limit. Below every Phase 1 test speed. |
| Wheel descent rate that collapses the undercarriage (`sinkLimit`) | 3.5 | m/s | — | ASSUMPTION | estimate | About 11.5 ft/s. The period design figure was not found (see gaps). |
| Crankshaft speed a starting engine is turned to (`starterSpeed`) | 600 | rpm | — | ASSUMPTION | estimate | The simple start/stop key (D49) turns a started engine to this speed, as a starter would, and it runs up from there. No start-up sequence is modelled. |
| Friction of a stopped engine (`deadEngineFriction`) | 0.1 | fraction | — | ASSUMPTION | estimate | Torque of a dead engine's internal friction and pumping, as a fraction of its rated torque. No source found; a piston engine's friction is commonly about a tenth of its output. It sets how much a windmilling airscrew is driven, and so its drag: with 0.1 the Bf 110 climbs about half as well on one engine windmilling as feathered (S25: much better feathered). |
## Propeller data: NACA Report 640

All three fighters use the full-scale coefficients of NACA Report 640's 3-blade Clark Y propeller 5868-9 (`src/aircraft/naca640.js`), scaled to each propeller's diameter. The Rotol and VDM blades were of different shape and width, so this is an approximation: it is the best measured full-scale data found for 3-blade propellers of the period. Blade angles beyond the measured 15-45° reuse the nearest curve, stretched in J so that its zero-thrust point moves on at the measured rate. The power coefficient is computed as CT J / efficiency, so thrust, power and efficiency stay consistent.

| Parameter | Value | Unit | Original figure | Source | Confidence | Notes |
|---|---|---|---|---|---|---|
| Thrust coefficient CT at 15° (J : CT) (`ct.b15`) | 0:0.141, 0.1:0.131, 0.2:0.1178, 0.3:0.1014, 0.4:0.0837, 0.5:0.065, 0.6:0.0461, 0.7:0.0257, 0.8:0.0035, 0.817:0 | — | Fig. 9 | S30 | medium | Traced from Fig. 9 by pixel measurement; J = 0 from the dashed start of the curve; the last point is where thrust reaches zero. |
| Thrust coefficient CT at 20° (J : CT) (`ct.b20`) | 0:0.157, 0.1:0.1528, 0.2:0.1485, 0.3:0.1411, 0.4:0.1272, 0.5:0.1113, 0.6:0.0929, 0.7:0.0729, 0.8:0.0523, 0.9:0.0313, 1:0.0084, 1.055:0 | — | Fig. 9 | S30 | medium | Traced from Fig. 9 by pixel measurement; J = 0 from the dashed start of the curve; the last point is where thrust reaches zero. |
| Thrust coefficient CT at 25° (J : CT) (`ct.b25`) | 0:0.16, 0.1:0.1577, 0.2:0.1553, 0.3:0.153, 0.4:0.1506, 0.5:0.1469, 0.6:0.1355, 0.7:0.119, 0.8:0.1014, 0.9:0.0814, 1:0.0611, 1.1:0.0387, 1.2:0.0178, 1.3:0 | — | Fig. 9 | S30 | medium | Traced from Fig. 9 by pixel measurement; J = 0 from the dashed start of the curve; the last point is where thrust reaches zero. |
| Thrust coefficient CT at 30° (J : CT) (`ct.b30`) | 0:0.168, 0.1:0.1675, 0.2:0.167, 0.3:0.1665, 0.4:0.1649, 0.5:0.1586, 0.6:0.1534, 0.7:0.1503, 0.8:0.1434, 0.9:0.129, 1:0.1122, 1.1:0.0922, 1.2:0.0716, 1.3:0.051, 1.4:0.029, 1.5:0.009, 1.56:0 | — | Fig. 9 | S30 | medium | Traced from Fig. 9 by pixel measurement; J = 0 from the dashed start of the curve; the last point is where thrust reaches zero. |
| Thrust coefficient CT at 35° (J : CT) (`ct.b35`) | 0:0.175, 0.1:0.1746, 0.2:0.1742, 0.3:0.1738, 0.4:0.1724, 0.5:0.1661, 0.6:0.1597, 0.7:0.157, 0.8:0.1552, 0.9:0.1521, 1:0.1466, 1.1:0.134, 1.2:0.118, 1.3:0.1008, 1.4:0.0818, 1.5:0.0637, 1.6:0.045, 1.7:0.0262, 1.8:0.0055, 1.835:0 | — | Fig. 9 | S30 | medium | Traced from Fig. 9 by pixel measurement; J = 0 from the dashed start of the curve; the last point is where thrust reaches zero. |
| Thrust coefficient CT at 40° (J : CT) (`ct.b40`) | 0:0.18, 0.1:0.1794, 0.2:0.1789, 0.3:0.1783, 0.4:0.1756, 0.5:0.1709, 0.6:0.1668, 0.7:0.1631, 0.8:0.1581, 0.9:0.1515, 1:0.1466, 1.1:0.1473, 1.2:0.1461, 1.3:0.1409, 1.4:0.1291, 1.5:0.1145, 1.6:0.0979, 1.7:0.0813, 1.8:0.0642, 1.9:0.0475, 2:0.0313, 2.1:0.0145, 2.19:0 | — | Fig. 9 | S30 | medium | Traced from Fig. 9 by pixel measurement; J = 0 from the dashed start of the curve; the last point is where thrust reaches zero. |
| Thrust coefficient CT at 45° (J : CT) (`ct.b45`) | 0:0.181, 0.1:0.1819, 0.2:0.1828, 0.3:0.1837, 0.4:0.186, 0.5:0.1886, 0.6:0.1883, 0.7:0.1846, 0.8:0.1789, 0.9:0.1728, 1:0.1675, 1.1:0.1628, 1.2:0.1596, 1.3:0.1581, 1.4:0.1579, 1.5:0.1578, 1.6:0.153, 1.7:0.1424, 1.8:0.1288, 1.9:0.1144, 2:0.0992, 2.1:0.085, 2.2:0.071, 2.3:0.0554, 2.4:0.0388, 2.5:0.0228, 2.6:0.0061, 2.635:0 | — | Fig. 9 | S30 | medium | Traced from Fig. 9 by pixel measurement; J = 0 from the dashed start of the curve; the last point is where thrust reaches zero. |
| Efficiency at 15° (J : efficiency) (`eta.b15`) | 0.3:0.53, 0.45:0.682, 0.55:0.743, 0.65:0.785, 0.7:0.775, 0.75:0.72, 0.785:0.4, 0.817:0 | — | Fig. 12 | S30 | medium | Read by eye from Fig. 12, about ±0.02. Peaks agree with the 3-blade envelope of Fig. 39 (0.86 at J 1.2) within 0.01. |
| Efficiency at 20° (J : efficiency) (`eta.b20`) | 0.3:0.45, 0.45:0.615, 0.55:0.69, 0.65:0.765, 0.75:0.811, 0.85:0.829, 0.91:0.837, 0.975:0.8, 1.016:0.6, 1.037:0.4, 1.055:0 | — | Fig. 12 | S30 | medium | Read by eye from Fig. 12, about ±0.02. Peaks agree with the 3-blade envelope of Fig. 39 (0.86 at J 1.2) within 0.01. |
| Efficiency at 25° (J : efficiency) (`eta.b25`) | 0.3:0.37, 0.45:0.521, 0.55:0.59, 0.65:0.68, 0.75:0.75, 0.85:0.793, 0.95:0.84, 1.1:0.853, 1.18:0.8, 1.245:0.6, 1.268:0.4, 1.3:0 | — | Fig. 12 | S30 | medium | Read by eye from Fig. 12, about ±0.02. Peaks agree with the 3-blade envelope of Fig. 39 (0.86 at J 1.2) within 0.01. |
| Efficiency at 30° (J : efficiency) (`eta.b30`) | 0.3:0.27, 0.45:0.393, 0.55:0.491, 0.65:0.591, 0.75:0.667, 0.85:0.735, 0.95:0.785, 1.05:0.813, 1.15:0.838, 1.33:0.855, 1.487:0.8, 1.527:0.6, 1.54:0.4, 1.56:0 | — | Fig. 12 | S30 | medium | Read by eye from Fig. 12, about ±0.02. Peaks agree with the 3-blade envelope of Fig. 39 (0.86 at J 1.2) within 0.01. |
| Efficiency at 35° (J : efficiency) (`eta.b35`) | 0.3:0.21, 0.45:0.31, 0.55:0.386, 0.65:0.458, 0.75:0.526, 0.85:0.608, 0.95:0.683, 1.05:0.743, 1.15:0.791, 1.35:0.835, 1.55:0.853, 1.7:0.8, 1.77:0.6, 1.8:0.4, 1.835:0 | — | Fig. 12 | S30 | medium | Read by eye from Fig. 12, about ±0.02. Peaks agree with the 3-blade envelope of Fig. 39 (0.86 at J 1.2) within 0.01. |
| Efficiency at 40° (J : efficiency) (`eta.b40`) | 0.3:0.17, 0.45:0.257, 0.55:0.316, 0.65:0.376, 0.75:0.434, 0.85:0.493, 0.95:0.55, 1.05:0.609, 1.15:0.673, 1.25:0.728, 1.45:0.8, 1.65:0.834, 1.85:0.85, 2.01:0.8, 2.12:0.6, 2.16:0.4, 2.19:0 | — | Fig. 12 | S30 | medium | Read by eye from Fig. 12, about ±0.02. Peaks agree with the 3-blade envelope of Fig. 39 (0.86 at J 1.2) within 0.01. |
| Efficiency at 45° (J : efficiency) (`eta.b45`) | 0.3:0.14, 0.45:0.214, 0.55:0.266, 0.65:0.316, 0.75:0.364, 0.85:0.413, 0.95:0.459, 1.05:0.506, 1.15:0.55, 1.25:0.593, 1.45:0.69, 1.65:0.76, 1.85:0.8, 2.12:0.83, 2.4:0.8, 2.5:0.6, 2.555:0.4, 2.635:0 | — | Fig. 12 | S30 | medium | Read by eye from Fig. 12, about ±0.02. Peaks agree with the 3-blade envelope of Fig. 39 (0.86 at J 1.2) within 0.01. |
| Peak efficiency of the 3-blade envelope (`etaMax`) | 0.86 | — | about 0.86 at J 1.2 | S30 | medium | Fig. 39, read by eye. Used as a ceiling so that extrapolated coefficients never beat the measured propeller. |
| Static power coefficient at J = 0 (blade angle in degrees : CP) (`cpStatic`) | 15:0.06, 20:0.089, 25:0.148, 30:0.21, 35:0.267, 40:0.313, 45:0.397 | — | Fig. 11 | S30 | medium | Read from the dashed starts of the curves, about ±0.005. Only take-off depends on it. |

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
| Time limit for +12 lb/sq in in mid-1940 | Historical note only: the game has no fixed limit (D14) | Pilot's Notes A.P. 1564A (Hurricane I) and A.P. 1565A (Spitfire I) full text; Dowding letter above |
| Hurricane I Rotol airscrew diameter and pitch range (the Mk II's 11 ft 4 in and the Spitfire's pitch range are used) | Propeller model | A&AEE report on a Rotol Hurricane I; Rotol type records |
| Blade width (solidity) and blade sections of the Rotol and VDM airscrews | Propeller efficiency at high blade angles: likely cause of the Spitfire's slow climb at altitude (FLIGHT_VALIDATION.md) | Rotol and VDM type records; A&AEE airscrew reports |
| Measured stability and control data (static margins, damping, rudder and elevator power) for any of the three | Handling (all estimates now) | NACA reports S11 and S12 contain stick-fixed stability measurements not yet used; RAE Morgan report on the Bf 109 |
| Bf 109 VDM pitch range, pitch-change rate, rotation convention (DIN 9001) | Propeller model | VDM or Bf 109 handbook |
| Hurricane I with Rotol airscrew: level speeds and climb (S1/S2 do not state the airscrew) | Validation | A&AEE reports (the archive lists L1547 and L2026 with two-pitch airscrews only) |
| Merlin III reduction gear ratio, supercharger gear ratio, bore and stroke, dry weight | Engine model | A.P. 1590B full text; RAF Museum or Science Museum engine records |
| A Merlin III power curve with a stated source (S9's origin is not named) | Engine model | Rolls-Royce Heritage Trust; A.P. 1590B |
| Spitfire I wingspan from an allowed Mk I source (only the Mk V figure in S11 was found) | Geometry | Air Ministry data sheet for the Spitfire I; Supermarine drawings |
| Spitfire I rounds per gun | Weapons | Air Ministry data sheet; A.P. 1565A |
| Spitfire I fabric-covered aileron area and travel (S11 is a metal-aileron VA) | Roll model | A&AEE or RAE reports on the Spitfire I |
| Bf 109 E-4 armament (MG FF or MG FF/M) and weights: armour plate, cannon installation, any canopy change | Mass and CG | E-4 Ladeplan; Flugzeug-Handbuch E-4 |
| Whether the 109 E-4 of August 1940 had the DB 601A or DB 601Aa | Engine model | Kennblatt or Flugzeug-Handbuch E-4; DB 601 Aa data sheet (the archive page is empty) |
| Bf 109 E level speed: the 460 km/h (S16) against 500 km/h (S17) disagreement | Background only: calibration is to S16 (D14) | Rechlin Meßprotokolle; British RAE tests of the captured E-3 (charts listed on the archive site, not yet read) |
| Bf 109 E roll rate and stick forces | Roll model | RAE report by Morgan, "Messerschmitt Me 109 Handling and Manoeuvrability Tests" (on kurfurst.org, downloaded but not yet read) |
| Bf 109 E turn times (Messerschmitt chart of 26 Aug 1940 unreadable) | AI and validation | A better scan |
| Bf 110 C-4 weights: armour; C-4 compared with the C-2 | Mass | Bf 110 C-4 Ladeplan or handbook |
| Bf 110 engine spacing, critical engine, airscrew rotation directions | Twin-engine model | Bf 110 handbook; drawings |
| He 111 H-3: engine sub-type (Jumo 211 A-3 or D-1; even Wikipedia's own pages give both), wing area, weights, speeds, climb, ceiling, bomb load, airscrew, gun arcs, formation cruise speed | Phase 3 (twin engines) and Phase 6 (gunners) | IWM: RAE 1940 report "Enemy aircraft Heinkel He 111H, examination of electrical equipment" (LBY K. 70191); Nowarra, "Heinkel He 111: A Documentary History" (LBY 81/2079); Air Ministry German aero-engine files including the Jumo 211 (Documents.13462). None is online; each needs a visit or a copy request. Also the He 111 H Flugzeug-Handbuch Teil 0 or a Kennblatt |
| Browning .303 Mk II rate of fire and muzzle velocity; .303 ball and incendiary bullet data | Weapons (Phase 5) | Royal Armouries records; A.P. 1641 (Browning gun manual) |
| MG FF and MG FF/M rate of fire, muzzle velocity, shell mass | Weapons (Phase 5) | US Catalog of Enemy Ordnance (MG FF entry not found); Rheinmetall or Ikaria handbook |
| Gun harmonisation ranges in August 1940 (RAF and Luftwaffe) | Weapons (Phase 5) | Fighter Command orders; AFDU reports |
| Armour plate thickness and positions for all four fighters | Damage (Phase 5) | A&AEE and AFDU reports; Luftwaffe Ladepläne |
| Moments of inertia (all aircraft) | Flight model | No measured data expected; Phase 1 estimates with the method shown |
| Tailwheel types: castoring, fixed or lockable (all three) | Ground handling | Pilot's Notes A.P. 1564A (Hurricane I); Bf 109 E Flugzeug-Handbuch; Spitfire I descriptive A.P. |
| Undercarriage design descent rate, oleo travel and tyre sizes | Hard landings, ground handling | A.P. 970 (design requirements); Dunlop and VDM/Elektron undercarriage records |
| Height of the centre of gravity (all three) | Ground handling (wheel and tailwheel heights) | Weight and balance schedules; Luftwaffe Ladepläne |
| Hurricane I Pilot's Notes (A.P. 1564A): flap selector, take-off and landing speeds | Controls and validation | Museum archives; the Mk II notes (A.P. 1564B) are a close variant |
| Bf 109 E wheel track (dimensioned) | Ground handling | Flugzeug-Handbuch Teil 0; the S32 front view gives about 1.9 m |
| Reflector gunsights: types fitted in August 1940 (GM 2, Revi C/12C) and reticle dimensions (ring diameter, range bars, centre dot) | Gunsight display now; aiming and ranging (Phase 5) | RAF gunnery manuals (e.g. A.P. 1641 series, "Bag the Hun"), Barr & Stroud drawings; Luftwaffe Schießfibel and Revi handbooks |
| Coolant system data (radiator area, temperature limits) for the Merlin III and DB 601A | Cooling model | Pilot's Notes; DB 601 manual (temperatures partly in S24 for the Bf 110) |
