// Mock operational data for UNIFY/26 stadium operations prototype.
// All numbers are believable but static; a real deployment would stream these.

export const VENUE = {
  city: "East Rutherford, NJ",
  name: "MetLife Stadium",
  code: "US-EWR-MET-2026",
  capacity: 82_500,
  weather: { temp: 24, humidity: 42, condition: "Clear" },
};

export const MATCH = {
  home: "USA",
  away: "ENG",
  homeScore: 2,
  awayScore: 1,
  minute: 72,
  group: "Group F",
  status: "LIVE",
};

export const HOST_CITIES = [
  "Atlanta", "Boston", "Dallas", "Guadalajara",
  "Houston", "Kansas City", "Los Angeles", "Mexico City",
  "Miami", "Monterrey", "New York/New Jersey", "Philadelphia",
  "San Francisco", "Seattle", "Toronto", "Vancouver",
] as const;

export const KPIS = {
  crowdDensity: { value: 84.2, unit: "%", deltaHour: +2.4, cap: 92 },
  transportLoad: { value: "High", segments: [true, true, "warn", false] as const, note: "Express Line 4: 12m delay" },
  sustainability: { value: 92, unit: "/100", note: "Water conservation target met" },
  energyDrawMw: { value: 1.24, unit: "MW", deltaHour: -3.1 },
  waterUseM3: { value: 184, unit: "m³", deltaHour: +5.6 },
  wasteDiverted: { value: 78, unit: "%", deltaHour: +1.2 },
};

export const GATE_THROUGHPUT = [
  { id: "G-01", pct: 88, state: "ok" as const },
  { id: "G-02", pct: 42, state: "idle" as const },
  { id: "G-03", pct: 95, state: "critical" as const },
  { id: "G-04", pct: 71, state: "ok" as const },
  { id: "G-05", pct: 63, state: "ok" as const },
  { id: "G-06", pct: 34, state: "idle" as const },
  { id: "G-07", pct: 12, state: "closed" as const },
  { id: "G-08", pct: 58, state: "ok" as const },
];

export type Incident = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "medium" | "low";
  location: string;
  agoMin: number;
};

export const INCIDENTS: Incident[] = [
  {
    id: "INC-2041",
    title: "Gate C crowd surge",
    detail: "Capacity threshold exceeded at North security checkpoint. Sector 104 backlog.",
    severity: "critical",
    location: "Gate C · Sec 104",
    agoMin: 2,
  },
  {
    id: "INC-2040",
    title: "Medical response",
    detail: "Heat-exhaustion report near Concourse Level 3. Medical Unit 04 responding.",
    severity: "medium",
    location: "Concourse L3",
    agoMin: 12,
  },
  {
    id: "INC-2038",
    title: "Transport delay",
    detail: "Green Line shuttle frequency reduced due to local traffic at Century Blvd.",
    severity: "low",
    location: "Shuttle Bay 2",
    agoMin: 24,
  },
  {
    id: "INC-2037",
    title: "Spillage — Concourse B",
    detail: "Beverage spillage near VIP entrance. Sanitation dispatched.",
    severity: "low",
    location: "Concourse B",
    agoMin: 31,
  },
];

export type Task = {
  id: string;
  title: string;
  location: string;
  priority: "P0" | "P1" | "P2";
  status: "open" | "in-progress" | "done";
};

export const STAFF_TASKS: Task[] = [
  { id: "T-8801", title: "Assist wheelchair guest to Sec 214", location: "Elevator E4", priority: "P0", status: "open" },
  { id: "T-8802", title: "Restock water at Portal 106", location: "Portal 106", priority: "P1", status: "in-progress" },
  { id: "T-8803", title: "Direct queue overflow at Gate C", location: "Gate C", priority: "P0", status: "open" },
  { id: "T-8804", title: "Verify translator radio channel 3", location: "Control Room", priority: "P2", status: "done" },
];

export const TRANSPORT = [
  { line: "Express Line 4 (Bus)", status: "Delayed", delay: "12m", color: "amber" as const },
  { line: "NJ Transit Rail", status: "On time", delay: "0m", color: "green" as const },
  { line: "Shuttle Bay 2", status: "On time", delay: "0m", color: "green" as const },
  { line: "Ride-share Zone A", status: "Congested", delay: "8m", color: "amber" as const },
];

// Stadium wayfinding grounding data used by the AI wayfinding server fn.
export const STADIUM_WAYFINDING = {
  gates: [
    { id: "A", nearSections: [100, 101, 102, 103], accessible: true },
    { id: "B", nearSections: [110, 111, 112, 113], accessible: true },
    { id: "C", nearSections: [120, 121, 122, 123], accessible: false },
    { id: "D", nearSections: [130, 131, 132, 133], accessible: true },
    { id: "E", nearSections: [200, 201, 202, 203, 204, 214], accessible: true },
    { id: "F", nearSections: [210, 211, 212, 213], accessible: true },
    { id: "G", nearSections: [220, 221, 222, 223], accessible: true },
  ],
  amenities: [
    { type: "restroom", sections: [102, 112, 122, 132, 202, 212, 222] },
    { type: "accessible-restroom", sections: [102, 202] },
    { type: "food-halal", sections: [104, 130, 210] },
    { type: "food-kosher", sections: [108, 218] },
    { type: "food-vegetarian", sections: [102, 112, 122, 202, 212] },
    { type: "first-aid", sections: [100, 130, 200, 220] },
    { type: "family-lounge", sections: [104, 214] },
    { type: "prayer-room", sections: [108, 218] },
  ],
  transport: [
    "NJ Transit Rail: Meadowlands Station, 8 min walk to Gate A",
    "Express Bus Line 4: Drop-off at Lot K, 6 min walk to Gate D",
    "Ride-share Zone A: Lot G, 10 min walk to Gate B",
    "Accessible parking: Lots A1 and B1 with shuttle to Gates A and E",
  ],
};
