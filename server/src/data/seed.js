// Generates the same fake catalogue on every run, so tests and screenshots stay stable.

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Sneha', 'Arjun', 'Kavya', 'Rahul', 'Meera',
  'Siddharth', 'Isha', 'Karan', 'Pooja', 'Nikhil', 'Divya', 'Aditya', 'Neha', 'Manish', 'Ritu',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Reddy', 'Gupta', 'Nair', 'Patel', 'Joshi', 'Mehta', 'Rao',
  'Kulkarni', 'Banerjee', 'Singh', 'Chopra', 'Menon', 'Agarwal', 'Das', 'Pillai', 'Saxena', 'Kapoor',
];
const SPECIALITIES = [
  'General Physician', 'Dermatology', 'Paediatrics', 'Gynaecology', 'Cardiology',
  'Orthopaedics', 'ENT', 'Psychiatry', 'Dentistry', 'Ophthalmology',
];
const CITIES = ['Bengaluru', 'Indore', 'Delhi', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];
const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali'];

// Small seeded PRNG (mulberry32). Math.random() would give a different list each restart.
function createRandom(seed) {
  let state = seed;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function pickSome(random, list, count) {
  const copy = [...list];
  const chosen = [];
  while (chosen.length < count && copy.length > 0) {
    chosen.push(copy.splice(Math.floor(random() * copy.length), 1)[0]);
  }
  return chosen;
}

export function generateDoctors(count = 500, seed = 42) {
  const random = createRandom(seed);
  const doctors = [];

  for (let i = 1; i <= count; i += 1) {
    const experienceYears = 2 + Math.floor(random() * 28);
    doctors.push({
      id: `doc-${String(i).padStart(4, '0')}`,
      name: `Dr. ${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`,
      speciality: pick(random, SPECIALITIES),
      city: pick(random, CITIES),
      experienceYears,
      fee: 200 + Math.round(random() * 16) * 50,
      rating: Math.round((3.6 + random() * 1.4) * 10) / 10,
      languages: ['English', ...pickSome(random, LANGUAGES.slice(1), 1 + Math.floor(random() * 2))],
      // Doctors see patients in one morning and one evening block.
      schedule: { start: pick(random, ['09:00', '10:00', '11:00']), end: pick(random, ['17:00', '18:00', '19:00']) },
      slotMinutes: pick(random, [15, 20, 30]),
    });
  }
  return doctors;
}

export const LAB_TESTS = [
  { id: 'lab-cbc', name: 'Complete Blood Count (CBC)', price: 349, mrp: 500, reportHours: 12, fasting: false, parameters: 24 },
  { id: 'lab-lipid', name: 'Lipid Profile', price: 499, mrp: 900, reportHours: 24, fasting: true, parameters: 8 },
  { id: 'lab-thyroid', name: 'Thyroid Profile (T3, T4, TSH)', price: 449, mrp: 750, reportHours: 24, fasting: false, parameters: 3 },
  { id: 'lab-hba1c', name: 'HbA1c', price: 399, mrp: 600, reportHours: 12, fasting: false, parameters: 1 },
  { id: 'lab-vitd', name: 'Vitamin D (25-OH)', price: 899, mrp: 1500, reportHours: 36, fasting: false, parameters: 1 },
  { id: 'lab-lft', name: 'Liver Function Test', price: 599, mrp: 1000, reportHours: 24, fasting: true, parameters: 11 },
  { id: 'lab-kft', name: 'Kidney Function Test', price: 599, mrp: 950, reportHours: 24, fasting: false, parameters: 9 },
  { id: 'lab-fullbody', name: 'Full Body Checkup', price: 1999, mrp: 4500, reportHours: 48, fasting: true, parameters: 72 },
];

export const LAB_COLLECTION_TIMES = ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '10:00', '11:00'];

export const MEDICINES = [
  { id: 'med-paracetamol', name: 'Paracetamol 650mg', pack: 'Strip of 15 tablets', price: 32, requiresPrescription: false },
  { id: 'med-cetirizine', name: 'Cetirizine 10mg', pack: 'Strip of 10 tablets', price: 21, requiresPrescription: false },
  { id: 'med-ors', name: 'ORS Orange Flavour', pack: 'Pack of 4 sachets', price: 88, requiresPrescription: false },
  { id: 'med-vitc', name: 'Vitamin C 500mg', pack: 'Bottle of 60 tablets', price: 199, requiresPrescription: false },
  { id: 'med-amox', name: 'Amoxicillin 500mg', pack: 'Strip of 10 capsules', price: 112, requiresPrescription: true },
  { id: 'med-metformin', name: 'Metformin 500mg', pack: 'Strip of 20 tablets', price: 45, requiresPrescription: true },
  { id: 'med-pantop', name: 'Pantoprazole 40mg', pack: 'Strip of 15 tablets', price: 145, requiresPrescription: true },
  { id: 'med-bandage', name: 'Crepe Bandage 10cm', pack: '1 roll', price: 120, requiresPrescription: false },
  { id: 'med-thermo', name: 'Digital Thermometer', pack: '1 unit', price: 249, requiresPrescription: false },
  { id: 'med-sanitizer', name: 'Hand Sanitizer', pack: '500 ml', price: 175, requiresPrescription: false },
];
