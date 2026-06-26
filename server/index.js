import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  initDb,
  createUser,
  getUserByEmail,
  getUserById,
  updateUserProfile,
  saveSubmission,
  getSubmissions,
  deleteSubmission,
  hashPassword,
  getAllScholarships,
  getTrackedScholarships,
  updateTrackedScholarship,
  createNotification,
  getNotifications,
  markNotificationAsRead
} from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database
initDb().then(() => {
  console.log('Database schemas initialized.');
}).catch(err => {
  console.error('Database connection error:', err);
});

// Configure OpenAI
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (openaiApiKey && openaiApiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
  openai = new OpenAI({ apiKey: openaiApiKey });
  console.log('OpenAI Client loaded for AI Advisor.');
} else {
  console.log('No OpenAI API Key found. AI Advisor will operate in graceful MOCK mode.');
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Please provide email, password, and name.' });
  }

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'A student account with this email already exists.' });
    }

    const userId = await createUser(email, password, name);
    const newUser = await getUserById(userId);

    return res.status(201).json({
      message: 'Account registered successfully.',
      token: `session_token_${userId}`,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register student account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password.' });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'No account found with this email.' });
    }

    const inputHash = hashPassword(password);
    if (user.password !== inputHash) {
      return res.status(400).json({ error: 'Incorrect password. Please try again.' });
    }

    // Clean password from response
    const { password: _, ...cleanUser } = user;

    // Update streak and badges
    try {
      const streakData = await updateStreakAndBadges(user.id);
      if (streakData) {
        cleanUser.streak_count = streakData.streak;
        cleanUser.last_active_date = streakData.lastActive;
        cleanUser.badges_json = JSON.stringify(streakData.badges);
      }
    } catch (streakErr) {
      console.error('Streak update failed on login:', streakErr);
    }

    return res.status(200).json({
      message: 'Login successful.',
      token: `session_token_${user.id}`,
      user: cleanUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server login failure.' });
  }
});

// -------------------------------------------------------------
// Profile Endpoints
// -------------------------------------------------------------
app.get('/api/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const numericId = parseInt(userId, 10);
    if (!isNaN(numericId)) {
      try {
        await updateStreakAndBadges(numericId);
      } catch (err) {
        console.error('Streak update failed on profile get:', err);
      }
    }
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile details.' });
  }
});

app.put('/api/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { name, marks, stream, home_state, income, category, gender, course_year } = req.body;

  try {
    const updated = await updateUserProfile(userId, {
      name,
      marks: parseFloat(marks) || 0,
      stream,
      home_state,
      income: parseFloat(income) || 0,
      category,
      gender,
      course_year
    });

    if (updated) {
      const updatedUser = await getUserById(userId);
      return res.status(200).json({ message: 'Profile updated successfully.', user: updatedUser });
    } else {
      return res.status(404).json({ error: 'Student profile update failed.' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to save profile changes.' });
  }
});

// -------------------------------------------------------------
// History Endpoints (supporting user_id filtering)
// -------------------------------------------------------------
app.get('/api/history', async (req, res) => {
  // Extract user_id from token queries if passed
  const token = req.headers.authorization;
  let userId = null;
  if (token && token.startsWith('session_token_')) {
    userId = parseInt(token.replace('session_token_', ''));
  }

  try {
    const list = await getSubmissions(userId);
    return res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ error: 'Failed to retrieve logs.' });
  }
});

app.delete('/api/history/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const numericId = parseInt(id, 10);
    const deleted = await deleteSubmission(isNaN(numericId) ? id : numericId);
    if (deleted) {
      return res.status(200).json({ message: 'Record removed successfully.' });
    } else {
      return res.status(404).json({ error: 'Record not found.' });
    }
  } catch (error) {
    console.error('Delete submission error:', error);
    return res.status(500).json({ error: 'Failed to delete record.' });
  }
});

app.get('/api/scholarships', async (req, res) => {
  try {
    const list = await getAllScholarships();
    return res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    return res.status(500).json({ error: 'Failed to retrieve scholarships.' });
  }
});

function getProviderLink(provider) {
  const p = (provider || '').toLowerCase();
  if (p.includes('l\'oréal') || p.includes('loreal')) return 'https://www.loreal.com/en/india/';
  if (p.includes('kotak')) return 'https://kotakeducation.org/';
  if (p.includes('reliance')) return 'https://www.reliancefoundation.org/';
  if (p.includes('hdfc')) return 'https://www.hdfcbank.com/';
  if (p.includes('minority') || p.includes('ministry of minority')) return 'https://scholarships.gov.in/';
  if (p.includes('higher education') || p.includes('government of india') || p.includes('govt of india') || p.includes('central sector')) return 'https://scholarships.gov.in/';
  if (p.includes('jindal')) return 'http://www.sitaramjindalfoundation.org/';
  if (p.includes('science and technology') || p.includes('kvpy') || p.includes('kishore vaigyanik')) return 'https://online-dst.gov.in/';
  return 'https://scholarships.gov.in/';
}

// -------------------------------------------------------------
// AI Scholarship Advisor Engine
// -------------------------------------------------------------
function getAdvisorMockRecommendations(profile) {
  const { name, marks, stream, home_state, income, category, gender } = profile;
  const marksNum = parseFloat(marks) || 0;
  const incomeNum = parseFloat(income) || 0;
  const isFemale = gender && gender.toLowerCase() === 'female';
  const streamLow = (stream || '').toLowerCase();
  const cat = (category || '').toUpperCase();
  const isMinority = cat === 'MINORITY';
  const isSC = cat === 'SC';
  const isST = cat === 'ST';
  const isOBC = ['OBC', 'BC'].includes(cat);
  const isEWS = cat === 'EWS';
  const isEngOrSci = ['engineering', 'science', 'medical', 'pharmacy', 'technology'].some(s => streamLow.includes(s));

  const pool = [
    // --- Women-specific ---
    {
      status: "Open",
      type_tags: ["Women", "Merit Based"],
      name: "L'Oréal India For Young Women In Science Scholarship",
      provider: "L'Oréal India Foundation",
      award_amount: "₹2.50 Lakhs/year",
      key_eligibility: "Girl students in Science/Engg/Medical with ≥ 85% marks, Family Income ≤ ₹6.0 Lakhs",
      stream_fit: "Science, Engineering, Medical, Pharmacy",
      deadline: "30th October 2026",
      condition: () => isFemale && marksNum >= 80 && isEngOrSci && incomeNum <= 600000,
      justification: `Recommended as you are a female student in ${stream} with an excellent score of ${marksNum}%, meeting L'Oréal's focus on women in STEM.`,
      application_link: 'https://www.loreal.com/en/india/'
    },
    {
      status: "Closing Soon",
      type_tags: ["Women", "Merit Based", "Need Based"],
      name: "Kotak Kanya Scholarship",
      provider: "Kotak Education Foundation",
      award_amount: "₹1.50 Lakhs/year",
      key_eligibility: "Girl students, ≥ 85% marks in Class 12, Annual Family Income ≤ ₹6.0 Lakhs",
      stream_fit: "Engineering, Medical, Law, Science, Commerce",
      deadline: "30th September 2026",
      condition: () => isFemale && marksNum >= 85 && incomeNum <= 600000,
      justification: `Matches your profile perfectly as a girl student pursuing higher education with an outstanding academic score of ${marksNum}%.`,
      application_link: 'https://kotakeducation.org/'
    },
    {
      status: "Open",
      type_tags: ["Women", "Need Based"],
      name: "Begum Hazrat Mahal National Scholarship for Minorities (Girls)",
      provider: "Maulana Azad Education Foundation",
      award_amount: "₹12,000 – ₹18,000/year",
      key_eligibility: "Minority community girl students, Class 9-12 or UG, ≥ 50% marks, Income ≤ ₹2.0 Lakhs",
      stream_fit: "All Streams",
      deadline: "31st October 2026",
      condition: () => isFemale && isMinority && marksNum >= 50 && incomeNum <= 200000,
      justification: `As a minority girl student with ${marksNum}% marks and income of ₹${incomeNum.toLocaleString()}, you are a strong candidate for this government-backed scheme.`,
      application_link: 'https://maef.nic.in/'
    },
    {
      status: "Open",
      type_tags: ["Women", "Merit Based"],
      name: "AICTE Pragati Scholarship for Girls",
      provider: "All India Council for Technical Education (AICTE)",
      award_amount: "₹50,000/year",
      key_eligibility: "Girl students admitted to AICTE-approved technical programs, Family Income ≤ ₹8.0 Lakhs",
      stream_fit: "Engineering, Technology, Architecture, Pharmacy",
      deadline: "31st December 2026",
      condition: () => isFemale && isEngOrSci && incomeNum <= 800000,
      justification: `AICTE's Pragati scholarship is specifically for girls in technical programs. Your ${stream} stream and income (₹${incomeNum.toLocaleString()}) qualify strongly.`,
      application_link: 'https://www.aicte-india.org/bureaus/development/pragati-scholarship'
    },

    // --- SC/ST Specific ---
    {
      status: "Open",
      type_tags: ["Need Based"],
      name: "Telangana ePASS Post Matric Scholarship (SC/ST)",
      provider: "Telangana State Govt — BC Welfare",
      award_amount: "Full Tuition Fee Reimbursement + ₹15,000 Maintenance Allowance/year",
      key_eligibility: "SC/ST students from Telangana, Family Income ≤ ₹2.0 Lakhs",
      stream_fit: "All Streams",
      deadline: "30th November 2026",
      condition: () => (isSC || isST) && incomeNum <= 200000,
      justification: `As a ${category} student from Telangana with family income of ₹${incomeNum.toLocaleString()}, you are fully eligible for complete tuition fee reimbursement under TS ePASS.`,
      application_link: 'https://telanganaepass.cgg.gov.in/'
    },
    {
      status: "Open",
      type_tags: ["Need Based", "Merit Based"],
      name: "Dr. Ambedkar Post Matric Scholarship for SC Students",
      provider: "Ministry of Social Justice & Empowerment, Govt of India",
      award_amount: "Full Course Fee + ₹1,200 – ₹2,250/month Maintenance",
      key_eligibility: "SC students, Family Income ≤ ₹2.5 Lakhs, Any state",
      stream_fit: "All Streams",
      deadline: "31st December 2026",
      condition: () => isSC && incomeNum <= 250000,
      justification: `As an SC student with annual family income of ₹${incomeNum.toLocaleString()}, you are fully eligible for central government's Dr. Ambedkar scholarship covering full fees and monthly maintenance.`,
      application_link: 'https://scholarships.gov.in/'
    },
    {
      status: "Open",
      type_tags: ["Need Based"],
      name: "Post Matric Scholarship for ST Students",
      provider: "Ministry of Tribal Affairs, Govt of India",
      award_amount: "Course Fee (up to ₹1.5 Lakhs) + ₹750 – ₹2,000/month Maintenance",
      key_eligibility: "ST students, Post Matriculation studies, Family Income ≤ ₹2.5 Lakhs",
      stream_fit: "All Streams",
      deadline: "31st January 2027",
      condition: () => isST && incomeNum <= 250000,
      justification: `This central government scheme covers full post-matric course fees for ST students like you, and your income bracket (₹${incomeNum.toLocaleString()}) qualifies comfortably.`,
      application_link: 'https://tribal.nic.in/'
    },

    // --- OBC/EWS/EBC ---
    {
      status: "Open",
      type_tags: ["Need Based"],
      name: "PM-YASASVI Post-Matric Scholarship (OBC/EBC/DNT)",
      provider: "Ministry of Social Justice & Empowerment, Govt of India",
      award_amount: "Up to ₹20,000/year",
      key_eligibility: "OBC/EBC/DNT students, Family Income ≤ ₹2.5 Lakhs, Marks ≥ 60%",
      stream_fit: "All Streams",
      deadline: "31st October 2026",
      condition: () => (isOBC || cat === 'EBC') && incomeNum <= 250000 && marksNum >= 60,
      justification: `Your ${category} category and income of ₹${incomeNum.toLocaleString()} place you squarely within the PM-YASASVI eligibility bracket with ${marksNum}% marks exceeding the 60% threshold.`,
      application_link: 'https://scholarships.gov.in/'
    },
    {
      status: "Open",
      type_tags: ["Need Based"],
      name: "EWS Post Matric Scholarship",
      provider: "Ministry of Education, Govt of India",
      award_amount: "₹12,000/year (UG) — ₹20,000/year (PG)",
      key_eligibility: "General/EWS students, Income ≤ ₹1.0 Lakh, Min 60% marks",
      stream_fit: "All Streams",
      deadline: "31st October 2026",
      condition: () => (isEWS || cat === 'GENERAL') && incomeNum <= 100000 && marksNum >= 60,
      justification: `Your General/EWS category and low family income (₹${incomeNum.toLocaleString()}) make you a priority candidate for EWS post-matric support from the Ministry of Education.`,
      application_link: 'https://scholarships.gov.in/'
    },
    {
      status: "Open",
      type_tags: ["Need Based"],
      name: "Telangana ePASS Post Matric Scholarship (BC/EBC/Minority)",
      provider: "Telangana State Govt — BC Welfare",
      award_amount: "Partial/Full Tuition Fee Reimbursement + ₹10,000 Maintenance/year",
      key_eligibility: "BC/OBC/EBC/Minority students in Telangana, Income ≤ ₹1.5 Lakhs",
      stream_fit: "All Streams",
      deadline: "30th November 2026",
      condition: () => (isOBC || isMinority || cat === 'EBC') && incomeNum <= 150000,
      justification: `Telangana ePASS is specifically available for ${category} students. With your income of ₹${incomeNum.toLocaleString()}, you qualify for the BC Welfare reimbursement scheme.`,
      application_link: 'https://telanganaepass.cgg.gov.in/'
    },

    // --- Minority ---
    {
      status: "Open",
      type_tags: ["Need Based", "Minority"],
      name: "NSP Post Matric Scholarship for Minorities",
      provider: "Ministry of Minority Affairs, Govt of India",
      award_amount: "₹12,000 – ₹23,000/year",
      key_eligibility: "Muslim/Christian/Buddhist/Sikh/Jain/Parsi students, ≥ 50% marks, Income ≤ ₹2.0 Lakhs",
      stream_fit: "All Streams",
      deadline: "31st December 2026",
      condition: () => isMinority && marksNum >= 50 && incomeNum <= 200000,
      justification: `Designed specifically for Minority students with income under ₹2 Lakhs. Your marks of ${marksNum}% and income of ₹${incomeNum.toLocaleString()} match the eligibility criteria perfectly.`,
      application_link: 'https://scholarships.gov.in/'
    },
    {
      status: "Open",
      type_tags: ["Minority", "Merit Based"],
      name: "Maulana Azad National Fellowship (MANF)",
      provider: "University Grants Commission (UGC)",
      award_amount: "₹25,000 – ₹28,000/month (JRF/SRF)",
      key_eligibility: "Minority community students pursuing M.Phil/PhD, Passed NET/GATE",
      stream_fit: "All Research Streams",
      deadline: "Rolling basis",
      condition: () => isMinority && marksNum >= 65,
      justification: `As a high-performing minority student (${marksNum}%), the MANF fellowship by UGC would be highly valuable if you plan to pursue post-graduate research.`,
      application_link: 'https://ugc.ac.in/'
    },

    // --- Merit-based (All Categories) ---
    {
      status: "Open",
      type_tags: ["Merit Based"],
      name: "Central Sector Scheme of Scholarship (CSSS)",
      provider: "Department of Higher Education, Govt of India",
      award_amount: "₹12,000/year (UG) — ₹20,000/year (PG)",
      key_eligibility: "Above 80th percentile in Class 12 Board, Family Income ≤ ₹4.5 Lakhs",
      stream_fit: "Science, Commerce, Arts, Engineering, Medical",
      deadline: "31st October 2026",
      condition: () => marksNum >= 80 && incomeNum <= 450000,
      justification: `Your academic performance of ${marksNum}% places you clearly in the top merit tier. CSSS is a prestigious government scholarship for all categories with income under ₹4.5 Lakhs.`,
      application_link: 'https://scholarships.gov.in/'
    },
    {
      status: "Open",
      type_tags: ["Merit Based", "Need Based"],
      name: "Reliance Foundation Undergraduate Scholarship",
      provider: "Reliance Foundation",
      award_amount: "₹2.00 Lakhs/year",
      key_eligibility: "Full-time UG students, Marks ≥ 60%, Family Income ≤ ₹15.0 Lakhs (priority under ₹2.5 Lakhs)",
      stream_fit: "Engineering, Medical, Science, Commerce, Arts",
      deadline: "30th November 2026",
      condition: () => marksNum >= 60 && incomeNum <= 1500000,
      justification: `Highly relevant for your income category (₹${incomeNum.toLocaleString()}/yr). Reliance Foundation's scholarship prioritizes students from modest backgrounds with ${marksNum}% marks.`,
      application_link: 'https://www.reliancefoundation.org/'
    },
    {
      status: "Open",
      type_tags: ["Merit Based", "Need Based"],
      name: "Sitaram Jindal Foundation Scholarship",
      provider: "Sitaram Jindal Foundation",
      award_amount: "₹24,000 – ₹36,000/year",
      key_eligibility: "UG students, Min marks 60% (males), 55% (females), Income ≤ ₹2.5 Lakhs",
      stream_fit: "Engineering, Medical, Science, Commerce, Arts",
      deadline: "Rolling basis (apply before Aug)",
      condition: () => marksNum >= (isFemale ? 55 : 60) && incomeNum <= 250000,
      justification: `With a family income of ₹${incomeNum.toLocaleString()} and academic marks of ${marksNum}%, the Sitaram Jindal scholarship offers a monthly stipend well within your qualifying range.`,
      application_link: 'http://www.sitaramjindalfoundation.org/'
    },
    {
      status: "Open",
      type_tags: ["Merit Based", "Need Based"],
      name: "Vidyadhan Scholarship",
      provider: "Sarojini Damodaran Foundation",
      award_amount: "₹10,000 – ₹50,000/year",
      key_eligibility: "Students who passed Class 10/12 with ≥ 75%, Family Income ≤ ₹2.0 Lakhs",
      stream_fit: "All Streams",
      deadline: "30th June 2026",
      condition: () => marksNum >= 75 && incomeNum <= 200000,
      justification: `Vidyadhan supports meritorious students like you (${marksNum}%) from limited income households (₹${incomeNum.toLocaleString()}) with generous annual funding to complete their degree.`,
      application_link: 'https://www.vidyadhan.org/'
    },
    {
      status: "Open",
      type_tags: ["Need Based"],
      name: "HDFC Bank Badhte Kadam Scholarship",
      provider: "HDFC Bank Foundation",
      award_amount: "₹75,000/year",
      key_eligibility: "UG students, ≥ 60% in previous exams, Family Income ≤ ₹6.0 Lakhs",
      stream_fit: "Engineering, Medical, Science, Commerce, Arts",
      deadline: "31st December 2026",
      condition: () => marksNum >= 60 && incomeNum <= 600000,
      justification: `HDFC's flagship scholarship program supports students like you (income ₹${incomeNum.toLocaleString()}) by covering a significant share of annual education expenses for ${stream} students.`,
      application_link: 'https://www.hdfcbank.com/'
    },
    {
      status: "Open",
      type_tags: ["Merit Based"],
      name: "AICTE Saksham Scholarship for Specially Abled Students",
      provider: "All India Council for Technical Education (AICTE)",
      award_amount: "₹50,000/year",
      key_eligibility: "Students with ≥ 40% disability, admitted in AICTE-approved programs, Income ≤ ₹8.0 Lakhs",
      stream_fit: "Engineering, Technology, Pharmacy, Architecture",
      deadline: "31st December 2026",
      condition: () => isEngOrSci && incomeNum <= 800000 && marksNum >= 45,
      justification: `AICTE Saksham is a key government-funded award for technical students with your academic standing (${marksNum}%). Applicable if you have a recognized disability certificate.`,
      application_link: 'https://www.aicte-india.org/'
    },
    {
      status: "Open",
      type_tags: ["Merit Based", "Research"],
      name: "DST INSPIRE Scholarship",
      provider: "Department of Science & Technology, Govt of India",
      award_amount: "₹80,000/year + Summer Research Grant",
      key_eligibility: "Students in top 1% of Class 12 Board, Natural Sciences only (BSc/Int-MSc)",
      stream_fit: "Science (Physics, Chemistry, Math, Biology)",
      deadline: "31st October 2026",
      condition: () => streamLow.includes('science') && marksNum >= 88,
      justification: `Your exceptional score of ${marksNum}% in the Science stream makes you a prime candidate for the prestigious DST INSPIRE scholarship — a government award for India's top science students.`,
      application_link: 'https://online-inspire.gov.in/'
    },
    {
      status: "Open",
      type_tags: ["Merit Based", "Need Based"],
      name: "Tata Capital Pankh Scholarship",
      provider: "Tata Capital Limited",
      award_amount: "Up to ₹12,000/year",
      key_eligibility: "Students in Class 11 / 12 or UG/ITI, ≥ 60% marks, Family Income ≤ ₹4.0 Lakhs",
      stream_fit: "All Streams",
      deadline: "31st August 2026",
      condition: () => marksNum >= 60 && incomeNum <= 400000,
      justification: `Tata Capital's Pankh Scholarship is a strong fit for your income range (₹${incomeNum.toLocaleString()}) and academic score (${marksNum}%), supporting students across all streams without stream restrictions.`,
      application_link: 'https://www.tatacapital.com/'
    },
    {
      status: "Coming Soon",
      type_tags: ["Merit Based"],
      name: "Sri Gowthami Merit-cum-Means Institutional Scholarship",
      provider: "Sri Gowthami Educational Institutions",
      award_amount: "₹15,000 Tuition Fee Discount",
      key_eligibility: "Sri Gowthami enrolled students, Marks ≥ 85%, Family Income ≤ ₹3.0 Lakhs",
      stream_fit: "All Streams",
      deadline: "15th July 2026",
      condition: () => marksNum >= 85 && incomeNum <= 300000,
      justification: `As an enrolled student with ${marksNum}% marks and an income of ₹${incomeNum.toLocaleString()}, you are eligible for an institutional fee waiver directly from Sri Gowthami.`,
      application_link: 'https://srigowthami.edu.in/scholarships'
    }
  ];

  // Filter recommendations based on student profile
  let matches = pool.filter(scheme => scheme.condition());

  // Fallback: widen criteria if fewer than 3 matched
  if (matches.length < 3) {
    const generalNeeds = pool.filter(scheme => {
      return (incomeNum <= 1000000 && marksNum >= 50) && !matches.find(m => m.name === scheme.name);
    });
    matches = [...matches, ...generalNeeds];
  }

  // Hard fallback to ensure at least 3 results always
  if (matches.length < 3) {
    const defaults = pool.filter(s => !matches.find(m => m.name === s.name)).slice(0, 3 - matches.length);
    matches = [...matches, ...defaults];
  }

  // Return up to 5 best matches
  return matches.slice(0, 5).map(m => ({
    status: m.status,
    type_tags: m.type_tags,
    name: m.name,
    provider: m.provider,
    award_amount: m.award_amount,
    key_eligibility: m.key_eligibility,
    stream_fit: m.stream_fit,
    deadline: m.deadline,
    justification: m.justification,
    application_link: m.application_link || getProviderLink(m.provider)
  }));
}

// Mock Eligibility Logic (Expanded Local Rules Engine)
function getMockScholarships(name, income, marks, category, courseYear) {
  const scholarships = [];
  const incomeNum = parseFloat(income);
  const marksNum = parseFloat(marks);
  const cat = category.toUpperCase();
  const isSC = cat === 'SC';
  const isST = cat === 'ST';
  const isOBC = ['OBC', 'BC'].includes(cat);
  const isEBC = cat === 'EBC';
  const isMinority = cat === 'MINORITY';
  const isEWS = cat === 'EWS';
  const isGeneral = cat === 'GENERAL';

  // 1. Telangana ePASS SC/ST (Full RTF)
  if ((isSC || isST) && incomeNum <= 200000) {
    scholarships.push({
      name: 'Telangana ePASS Post Matric Scholarship (SC/ST)',
      eligibility_criteria_met: `Belong to ${category} category with family income ₹${incomeNum.toLocaleString()} (≤ ₹2,00,000). Eligible for full tuition fee reimbursement under Telangana Government welfare scheme.`,
      amount: 'Full Tuition Fee Reimbursement (RTF) + ₹15,000/year Maintenance Allowance',
      application_link: 'https://telanganaepass.cgg.gov.in/',
      deadline: '2026-06-29'
    });
  }

  // 2. Telangana ePASS BC/OBC/Minority
  if ((isOBC || isEBC || isMinority) && incomeNum <= 150000) {
    scholarships.push({
      name: 'Telangana ePASS Post Matric Scholarship (BC/EBC/Minority)',
      eligibility_criteria_met: `Belong to ${category} category with family income ₹${incomeNum.toLocaleString()} (≤ ₹1,50,000). Eligible under Telangana BC Welfare scholarship.`,
      amount: 'Partial/Full Tuition Fee Reimbursement + ₹10,000/year Maintenance Allowance',
      application_link: 'https://telanganaepass.cgg.gov.in/',
      deadline: '2026-07-20'
    });
  }

  // 3. Dr. Ambedkar Post Matric Scholarship (SC)
  if (isSC && incomeNum <= 250000) {
    scholarships.push({
      name: 'Dr. Ambedkar Post Matric Scholarship for SC Students',
      eligibility_criteria_met: `SC student with annual income ₹${incomeNum.toLocaleString()} (≤ ₹2,50,000). Eligible for full course fee and monthly maintenance allowance under central government scheme.`,
      amount: 'Full Course Fee + ₹1,200–₹2,250/month Maintenance Allowance',
      application_link: 'https://scholarships.gov.in/',
      deadline: '2026-08-30'
    });
  }

  // 4. Post Matric Scholarship for ST Students
  if (isST && incomeNum <= 250000) {
    scholarships.push({
      name: 'Post Matric Scholarship for ST Students (Ministry of Tribal Affairs)',
      eligibility_criteria_met: `ST category student with family income ₹${incomeNum.toLocaleString()} (≤ ₹2,50,000). Central government scheme for tribal students pursuing post-matriculation courses.`,
      amount: 'Course Fee up to ₹1.5 Lakhs + ₹750–₹2,000/month Maintenance',
      application_link: 'https://tribal.nic.in/',
      deadline: '2026-09-10'
    });
  }

  // 5. NSP Post Matric for Minorities
  if (isMinority && incomeNum <= 200000 && marksNum >= 50) {
    scholarships.push({
      name: 'NSP Post Matric Scholarship for Minorities (National Scholarship Portal)',
      eligibility_criteria_met: `Minority category student with income ₹${incomeNum.toLocaleString()} (≤ ₹2,00,000) and marks ${marksNum}% (≥ 50%). Eligible for central minority scholarship.`,
      amount: '₹12,000–₹23,000 per annum (tuition + maintenance)',
      application_link: 'https://scholarships.gov.in/',
      deadline: '2026-08-20'
    });
  }

  // 6. PM-YASASVI (OBC/EBC/DNT)
  if ((isOBC || isEBC) && incomeNum <= 250000 && marksNum >= 60) {
    scholarships.push({
      name: 'PM-YASASVI Post-Matric Scholarship for OBC, EBC and DNT Students',
      eligibility_criteria_met: `${category} category with family income ₹${incomeNum.toLocaleString()} (≤ ₹2,50,000) and marks ${marksNum}% (≥ 60%). Eligible under PM-YASASVI central scheme.`,
      amount: 'Up to ₹20,000 per annum',
      application_link: 'https://scholarships.gov.in/',
      deadline: '2026-08-15'
    });
  }

  // 7. Central Sector Scheme of Scholarship (CSSS) - merit-based
  if (marksNum >= 80 && incomeNum <= 450000) {
    scholarships.push({
      name: 'Central Sector Scheme of Scholarship (CSSS) — Ministry of Education',
      eligibility_criteria_met: `Academic marks ${marksNum}% (≥ 80%) placing in top academic percentile, and family income ₹${incomeNum.toLocaleString()} (≤ ₹4,50,000). Merit-based central scheme.`,
      amount: '₹12,000/year (UG) — ₹20,000/year (PG)',
      application_link: 'https://scholarships.gov.in/',
      deadline: '2026-10-31'
    });
  }

  // 8. EWS Post Matric Scholarship
  if ((isEWS || isGeneral) && incomeNum <= 100000 && marksNum >= 60) {
    scholarships.push({
      name: 'Post Matric Scholarship for EWS Students (General Category)',
      eligibility_criteria_met: `General/EWS student with low annual income ₹${incomeNum.toLocaleString()} (≤ ₹1,00,000) and merit of ${marksNum}%. Eligible for central government EWS support.`,
      amount: '₹12,000/year (UG) — ₹20,000/year (PG)',
      application_link: 'https://scholarships.gov.in/',
      deadline: '2026-07-10'
    });
  }

  // 9. Vidyadhan Scholarship
  if (marksNum >= 75 && incomeNum <= 200000) {
    scholarships.push({
      name: 'Vidyadhan Scholarship (Sarojini Damodaran Foundation)',
      eligibility_criteria_met: `Academic merit of ${marksNum}% (≥ 75%) and family income ₹${incomeNum.toLocaleString()} (≤ ₹2,00,000). This private scholarship supports meritorious students from low-income households.`,
      amount: '₹10,000–₹50,000 per annum (based on course)',
      application_link: 'https://www.vidyadhan.org/',
      deadline: '2026-06-10'
    });
  }

  // 10. Sitaram Jindal Scholarship
  if (marksNum >= 55 && incomeNum <= 250000) {
    scholarships.push({
      name: 'Sitaram Jindal Foundation Scholarship',
      eligibility_criteria_met: `UG student with marks ${marksNum}% (≥ 55%) and annual family income ₹${incomeNum.toLocaleString()} (≤ ₹2,50,000). One of India's largest private scholarship programs.`,
      amount: '₹24,000–₹36,000 per annum (monthly stipend)',
      application_link: 'http://www.sitaramjindalfoundation.org/',
      deadline: '2026-07-30'
    });
  }

  // 11. HDFC Badhte Kadam
  if (marksNum >= 60 && incomeNum <= 600000) {
    scholarships.push({
      name: 'HDFC Bank Badhte Kadam Scholarship',
      eligibility_criteria_met: `UG student with marks ${marksNum}% (≥ 60%) and family income ₹${incomeNum.toLocaleString()} (≤ ₹6,0,000). HDFC Foundation's flagship student scholarship.`,
      amount: 'Up to ₹75,000 per annum',
      application_link: 'https://www.hdfcbank.com/',
      deadline: '2026-07-25'
    });
  }

  // 12. Sri Gowthami Merit-cum-Means
  if (marksNum >= 85 && incomeNum <= 300000) {
    scholarships.push({
      name: 'Sri Gowthami Merit-cum-Means Institutional Scholarship',
      eligibility_criteria_met: `Enrolled Sri Gowthami student with exceptional marks of ${marksNum}% (≥ 85%) and family income ₹${incomeNum.toLocaleString()} (≤ ₹3,00,000). Eligible for institutional tuition waiver.`,
      amount: '₹15,000 Tuition Fee Discount',
      application_link: 'https://srigowthami.edu.in/scholarships',
      deadline: '2026-07-12'
    });
  }

  // 13. Sri Gowthami Special Merit (General)
  if (isGeneral && marksNum >= 92 && incomeNum <= 250000) {
    scholarships.push({
      name: 'Sri Gowthami Special Merit Scholarship (General Category)',
      eligibility_criteria_met: `General category student with outstanding marks ${marksNum}% (≥ 92%) and family income ₹${incomeNum.toLocaleString()} (≤ ₹2,50,000). Exceptional merit award.`,
      amount: '₹10,000 one-time tuition waiver',
      application_link: 'https://srigowthami.edu.in/scholarships',
      deadline: '2026-06-27'
    });
  }

  // 14. Tata Capital Pankh
  if (marksNum >= 60 && incomeNum <= 400000) {
    scholarships.push({
      name: 'Tata Capital Pankh Scholarship',
      eligibility_criteria_met: `Student with marks ${marksNum}% (≥ 60%) and annual income ₹${incomeNum.toLocaleString()} (≤ ₹4,00,000). Open to students across all streams and courses.`,
      amount: 'Up to ₹12,000 per annum',
      application_link: 'https://www.tatacapital.com/',
      deadline: '2026-08-05'
    });
  }

  // 15. Hardship / Fallback Grant
  if (scholarships.length === 0 && incomeNum <= 150000) {
    scholarships.push({
      name: 'Sri Gowthami Financial Aid & Hardship Grant',
      eligibility_criteria_met: `Demonstrated financial hardship with family income ₹${incomeNum.toLocaleString()} (≤ ₹1,50,000). Emergency support for students in critical financial need.`,
      amount: '₹8,000 one-time fee concession',
      application_link: 'https://srigowthami.edu.in/financial-aid',
      deadline: '2026-08-10'
    });
  }

  return scholarships;
}

// Check Eligibility endpoint
app.post('/api/check-eligibility', async (req, res) => {
  const { name, income, marks, category, courseYear } = req.body;

  // Extract user_id from token if passed
  const token = req.headers.authorization;
  let userId = null;
  if (token && token.startsWith('session_token_')) {
    userId = parseInt(token.replace('session_token_', ''));
  }

  if (!name || income === undefined || marks === undefined || !category || !courseYear) {
    return res.status(400).json({ error: 'Please provide all required fields: name, income, marks, category, courseYear' });
  }

  let finalResult = [];
  let isMock = false;

  if (openai) {
    try {
      console.log(`Sending AI request for ${name} (Income: ${income}, Marks: ${marks}, Cat: ${category})`);

      const systemPrompt = `You are a scholarship eligibility assistant for students in Telangana, India. Based on the student's income, marks, and category, return a JSON list of eligible scholarships. 
Your response MUST be a valid JSON object with a single key "scholarships" containing an array of objects. Each scholarship object MUST contain:
- name: (The exact name of the scholarship, e.g., TS ePASS Post Matric Scholarship)
- eligibility_criteria_met: (A brief description of why this student qualifies based on their input)
- amount: (The approximate amount or concession provided)
- application_link: (The official URL or website name where they can apply)
- deadline: (The specific deadline date in YYYY-MM-DD format if known, e.g., "2026-08-25")

In addition to standard state government (TS ePASS) and national government (NSP) schemes, you can also suggest local institutional scholarships like "Sri Gowthami Educational Institutions Merit Aid".
Output only JSON. Do not include markdown code block formatting (like \`\`\`json) or extra text.`;

      const userMessage = `Name: ${name}
Annual Family Income (INR): ${income}
Academic Marks (Percentage/CGPA): ${marks}
Category: ${category}
Current Course & Year: ${courseYear}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: "json_object" }
      });

      const responseText = response.choices[0].message.content.trim();
      const parsed = JSON.parse(responseText);
      finalResult = parsed.scholarships || [];
    } catch (apiError) {
      console.error('OpenAI API Error, falling back to local rule engine:', apiError);
      finalResult = getMockScholarships(name, income, marks, category, courseYear);
      isMock = true;
    }
  } else {
    // Graceful fallback to local rule-based mock matching
    finalResult = getMockScholarships(name, income, marks, category, courseYear);
    isMock = true;
  }

  try {
    // Save to SQLite
    const submissionId = await saveSubmission(name, income, marks, category, courseYear, finalResult, userId);

    return res.status(200).json({
      id: submissionId,
      name,
      income,
      marks,
      category,
      courseYear,
      scholarships: finalResult,
      isMock,
      created_at: new Date().toISOString()
    });
  } catch (dbError) {
    console.error('Error saving submission to DB:', dbError);
    // Return successfully anyway but indicate database save failure
    return res.status(200).json({
      name,
      income,
      marks,
      category,
      courseYear,
      scholarships: finalResult,
      isMock,
      created_at: new Date().toISOString(),
      dbWarning: 'Result was generated but could not be saved to history.'
    });
  }
});

app.post('/api/advisor/recommendations', async (req, res) => {
  const token = req.headers.authorization;
  let userId = null;
  if (token && token.startsWith('session_token_')) {
    userId = parseInt(token.replace('session_token_', ''));
  }

  // Fetch user profile from DB to evaluate
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in to consult the AI Advisor.' });
  }

  try {
    const profile = await getUserById(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    let recommendations = [];
    let isMock = false;

    if (openai) {
      try {
        console.log(`Advisor prompting GPT-4o for student ${profile.name}`);

        const systemPrompt = `You are an expert AI Scholarship Advisor integrated into the "India College Navigator" platform. 
Your task is to analyze a student's profile and recommend 3-5 highly relevant scholarships.
You must strictly format your response to match the application's existing design language and return a valid JSON object containing a 'recommendations' array.
Each recommendation object in the array MUST contain exactly:
- status: (Must be one of: "Open", "Closing Soon", "Coming Soon", or "Admissions Closed")
- type_tags: (An array of 1-3 strings. Choose tags from: "Merit Based", "Need Based", "Research", "Women", "Minority")
- name: (The official title of the scholarship)
- provider: (Governing Body / Foundation Name)
- award_amount: (Formatted in ₹ Lakhs or ₹ thousands per year, e.g. "₹50,000/year" or "₹1.5 Lakhs/year")
- key_eligibility: (Min percentage, income cap, gender, or state restrictions)
- stream_fit: (Applicable streams)
- deadline: (Specific Date or Month)
- justification: (1-2 sentences explaining why this matches the student's profile based on their marks, stream, state, income, category, or gender)
- application_link: (The official application website URL, e.g., "https://scholarships.gov.in" or the foundation's official domain URL)

Output ONLY raw JSON. Do not include markdown code block formatting (like \`\`\`json) or extra text.`;

        const userMessage = `Student Profile Parameters:
- Candidate Name: ${profile.name}
- Academic Marks / Percentile: ${profile.marks}%
- Stream: ${profile.stream}
- Home State: ${profile.home_state}
- Annual Family Income: INR ${profile.income}
- Social Category: ${profile.category}
- Gender: ${profile.gender}
- Course/Year: ${profile.course_year}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: "json_object" }
        });

        const text = response.choices[0].message.content.trim();
        const parsed = JSON.parse(text);
        recommendations = parsed.recommendations || [];
      } catch (aiError) {
        console.error('OpenAI Advisor request failed. Falling back to local rules:', aiError);
        recommendations = getAdvisorMockRecommendations(profile);
        isMock = true;
      }
    } else {
      recommendations = getAdvisorMockRecommendations(profile);
      isMock = true;
    }

    // Save this consultation in historical submissions
    const subTitle = `AI Scholarship Advisor Report (${profile.stream} stream)`;
    await saveSubmission(
      profile.name,
      profile.income,
      profile.marks,
      profile.category,
      profile.course_year,
      recommendations.map(r => ({
        name: r.name,
        eligibility_criteria_met: r.justification,
        amount: r.award_amount,
        application_link: r.application_link || getProviderLink(r.provider)
      })),
      userId
    );

    return res.status(200).json({
      recommendations,
      isMock,
      profile
    });
  } catch (error) {
    console.error('AI Advisor endpoint error:', error);
    return res.status(500).json({ error: 'Failed to process AI Advisor suggestions.' });
  }
});

// -------------------------------------------------------------
// AI Chat Endpoint
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  const { message, history, profile } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message query is required' });
  }

  // 1. OpenAI Path
  if (openai) {
    try {
      console.log(`AI Chat request received: "${message}"`);
      const systemPrompt = `You are "ScholarCheck AI Assistant", a friendly, expert AI scholarship advisor for students in India (especially Telangana).
You have access to the student's profile context:
${profile ? JSON.stringify(profile) : 'Not logged in / profile incomplete'}

Analyze their question. Help them find scholarships, explain eligibility rules, check if they qualify, and give actionable profile optimization suggestions.
Format your responses using clean Markdown. Include links to official portals (e.g., https://scholarships.gov.in) if relevant. Keep responses structured, concise, and professional yet encouraging.`;

      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversational history if present
      if (history && Array.isArray(history)) {
        history.forEach(msg => {
          messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
        });
      }

      messages.push({ role: 'user', content: message });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages
      });

      const responseText = response.choices[0].message.content;
      return res.status(200).json({ response: responseText });
    } catch (apiError) {
      console.error('OpenAI Chat Assistant error, falling back to local chat engine:', apiError);
      // fallback to rules-based chatbot
    }
  }

  // 2. Rules-based Mock Chatbot
  const query = message.toLowerCase();
  let responseText = "";

  if (query.includes("engineering") || query.includes("girl") || query.includes("female") || query.includes("women") || query.includes("telangana") || query.includes("stem")) {
    responseText = `Based on your query, here are some excellent scholarships for engineering and girl students in Telangana:

1. **L'Oréal India For Young Women In Science Scholarship**
   - **Award**: ₹2.50 Lakhs/year
   - **Eligibility**: Girl students in STEM with \u2265 80% marks.
   - [Apply on L'Oréal Website](https://www.loreal.com/en/india/)

2. **AICTE Pragati Scholarship for Girls**
   - **Award**: ₹50,000/year
   - **Eligibility**: Girls in AICTE-approved B.Tech/Pharmacy courses.
   - [Apply on AICTE Portal](https://www.aicte-india.org/bureaus/development/pragati-scholarship)

3. **Telangana ePASS Post Matric Scholarship (BC/EBC/Minority)**
   - **Award**: Tuition Fee Reimbursement + ₹10,000 Maintenance
   - [Apply on TS ePASS](https://telanganaepass.cgg.gov.in/)

Would you like me to check if your profile fits any of these specifically?`;
  } else if (query.includes("nmms") || query.includes("means-cum-merit")) {
    const marksMatch = query.match(/\d+/);
    const marksNum = marksMatch ? parseInt(marksMatch[0], 10) : (profile ? parseFloat(profile.marks) : null);

    if (marksNum) {
      if (marksNum >= 55) {
        responseText = `Yes! You can definitely apply for the **National Means-cum-Merit Scholarship (NMMS)**. The minimum required percentage in Class 8/equivalent is **55%** for General/OBC categories and **50%** for SC/ST categories. 
Since you have **${marksNum}%**, you are well above the threshold! 

*Note: Your family income must be less than ₹3,50,000 per annum to qualify.* You can check and apply for this on the [National Scholarship Portal (NSP)](https://scholarships.gov.in).`;
      } else {
        responseText = `The **National Means-cum-Merit Scholarship (NMMS)** has a minimum eligibility criteria of **55% marks** (50% for SC/ST candidates) in the qualifying examination. 
Since your current score is **${marksNum}%**, you are below the threshold. 

*Recommendation:* I suggest focusing on school performance to cross 55% in upcoming tests, or searching for other need-based institutional scholarships like **Sitaram Jindal Scholarship** which has lower merit constraints.`;
      }
    } else {
      responseText = `The **National Means-cum-Merit Scholarship (NMMS)** is a centrally sponsored scheme. 
Key requirements:
- **Academic Score**: Minimum **55%** marks (50% for SC/ST students) in Class 8 or equivalent.
- **Family Income**: Under **₹3,50,000** per annum.
- **Award**: ₹12,000 per annum.

Please let me know your academic marks and category so I can give you a precise eligibility check!`;
    }
  } else if (query.includes("improve") || query.includes("optimize") || query.includes("aim") || query.includes("miss")) {
    responseText = `Here are some actionable ways to optimize your scholarship eligibility profile:

1. **Academic Performance**: Many premium scholarships (like Central Sector Scheme CSSS or Kotak Kanya) require at least **80% - 85%** marks. Aiming to boost your marks in the next semester is the single most effective optimizer.
2. **Technical Certifications**: Adding industry-recognized technical certifications (e.g., in Python, AWS, or digital accounting) helps you stand out in private foundation reviews.
3. **Keep Certificates Updated**: Ensure your family's Income Certificate (reflecting income under ₹2.5 Lakhs) and Caste Certificate are renewed and officially signed by regional authorities.
4. **Statement of Purpose (SOP)**: Prepare a strong paragraph explaining how financial support will help you achieve your career aspirations, highlighting any hardship.

Would you like to analyze a specific scholarship requirement?`;
  } else if (query.includes("epass") || query.includes("telangana")) {
    responseText = `**Telangana ePASS (Electronic Payment & Application System of Scholarships)** is the primary scholarship portal for students studying in Telangana. 

It offers post-matric scholarship schemes:
- **SC/ST Category**: Family income limit is ₹2,00,000/year. Eligible for full tuition fee reimbursement.
- **BC/EBC/Minority Category**: Family income limit is ₹1,50,000/year. Eligible for partial/full tuition reimbursement.

To apply, you will need:
- SSC Hall Ticket Number
- Aadhaar Card Number
- Income Certificate ID (issued by Meeseva)
- Caste Certificate ID (issued by Meeseva)
- Bank Account details

You can visit the official site: [Telangana ePASS Portal](https://telanganaepass.cgg.gov.in/)`;
  } else if (query.includes("income") || query.includes("how much") || query.includes("family income")) {
    responseText = `For most government and private scholarships in India, eligibility is tied directly to family income limits:

1. **Telangana ePASS (SC/ST)**: Income must be **under ₹2,00,000 per annum** to get full tuition fee reimbursement.
2. **Telangana ePASS (BC/EBC/Minority)**: Income limit is **under ₹1,50,000 per annum**.
3. **National Scholarship Portal (Minority)**: Income limit is **under ₹2,00,000 per annum**.
4. **Dr. Ambedkar Post Matric Scholarship (SC)**: Income limit is **under ₹2,50,000 per annum**.
5. **HDFC Bank Badhte Kadam / Kotak Kanya**: Support students with family income **under ₹6,0,000 per annum**.
6. **Reliance Foundation Scholarship**: Higher threshold, family income **under ₹15,0,000 per annum** (priority to under ₹2.5 Lakhs).

Please let me know which specific scholarship you are targetting or share your current income level!`;
  } else {
    // Default reply
    responseText = `Hello! I am your **ScholarCheck AI Assistant**. 

I can help you with:
- Finding state (TS ePASS) and national (NSP) scholarship schemes.
- Analyzing your profile eligibility details.
- Guiding you on how to optimize your academic or document profile.
- Clarifying eligibility boundaries (e.g., "Can I apply for NMMS with 80%?").

What scholarship or eligibility criteria can I explain for you today?`;
  }

  return res.status(200).json({ response: responseText });
});

// -------------------------------------------------------------
// Advanced Features APIs
// -------------------------------------------------------------

// 1. Tracker Endpoints
app.get('/api/tracker', async (req, res) => {
  const token = req.headers.authorization;
  let userId = null;
  if (token && token.startsWith('session_token_')) {
    userId = parseInt(token.replace('session_token_', ''));
  }
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  try {
    let tracked = await getTrackedScholarships(userId);
    if (tracked.length === 0) {
      const defaults = [
        { name: "National Scholarship Portal", status: "SAVED" },
        { name: "Telangana ePASS Post Matric Scholarship (SC/ST)", status: "APPLIED" },
        { name: "HDFC Bank Badhte Kadam Scholarship", status: "UNDER_REVIEW" },
        { name: "Vidyadhan Scholarship (Sarojini Damodaran Foundation)", status: "APPROVED" }
      ];
      for (const item of defaults) {
        await updateTrackedScholarship(userId, item.name, item.status);
      }
      tracked = await getTrackedScholarships(userId);
    }
    return res.status(200).json(tracked);
  } catch (error) {
    console.error('Error fetching tracked scholarships:', error);
    return res.status(500).json({ error: 'Failed to retrieve tracked list.' });
  }
});

app.post('/api/tracker/update', async (req, res) => {
  const token = req.headers.authorization;
  let userId = null;
  if (token && token.startsWith('session_token_')) {
    userId = parseInt(token.replace('session_token_', ''));
  }
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  const { scholarshipName, status } = req.body;
  if (!scholarshipName || !status) {
    return res.status(400).json({ error: 'Missing scholarshipName or status' });
  }
  try {
    await updateTrackedScholarship(userId, scholarshipName, status);
    // Create automatic alert notification
    await createNotification(
      userId,
      'TRACKER',
      'Tracker Status Updated',
      `Your tracking status for ${scholarshipName} has been changed to ${status.replace('_', ' ')}.`
    );
    return res.status(200).json({ success: true, message: 'Status updated successfully.' });
  } catch (error) {
    console.error('Error updating tracked scholarship:', error);
    return res.status(500).json({ error: 'Failed to update tracking status.' });
  }
});

app.post('/api/export-pdf', async (req, res) => {
  const { studentName, income, marks, category, courseYear, scholarships } = req.body;

  if (!studentName || !scholarships) {
    return res.status(400).json({ error: 'Missing studentName or scholarships data.' });
  }

  try {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `ScholarCheck_Report_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    const filePath = path.join(exportsDir, filename);
    const writeStream = fs.createWriteStream(filePath);
    
    doc.pipe(writeStream);
    
    // Pipe back to response for browser download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    // PDF Layout Construction
    doc.fontSize(22).fillColor('#1e3a8a').text('ScholarCheck Eligibility Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#6b7280').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // Candidate Profile
    doc.fontSize(14).fillColor('#1e3a8a').text('Candidate Profile Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Candidate Name: ${studentName}`);
    doc.text(`Annual Family Income: INR ${parseFloat(income).toLocaleString()}`);
    doc.text(`Academic Marks: ${marks}%`);
    doc.text(`Social Category: ${category}`);
    doc.text(`Course & Year: ${courseYear}`);
    doc.moveDown(2);

    // Match Results
    doc.fontSize(14).fillColor('#1e3a8a').text(`Scholarship Scan Results (${scholarships.length})`, { underline: true });
    doc.moveDown(1);

    scholarships.forEach((scheme, idx) => {
      doc.fontSize(12).fillColor('#111827').text(`${idx + 1}. ${scheme.name}`);
      doc.moveDown(0.2);
      
      doc.fontSize(10).fillColor('#4b5563');
      doc.text(`Award Amount: ${scheme.amount || 'N/A'}`);
      doc.text(`Deadline: ${scheme.deadline ? new Date(scheme.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Rolling Basis'}`);
      doc.text(`Eligibility Criteria Met: "${scheme.eligibility_criteria_met || scheme.justification}"`);
      doc.text(`Application Link: ${scheme.application_link || 'https://scholarships.gov.in'}`);
      doc.moveDown(1);
    });

    doc.end();

  } catch (error) {
    console.error('PDF Export Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate PDF report.' });
    }
  }
});

// 2. Notification Endpoints
app.get('/api/notifications', async (req, res) => {
  const token = req.headers.authorization;
  let userId = null;
  if (token && token.startsWith('session_token_')) {
    userId = parseInt(token.replace('session_token_', ''));
  }
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  try {
    const list = await getNotifications(userId);
    if (list.length === 0) {
      await createNotification(userId, 'DEADLINE', 'Upcoming Deadline Alert', 'Telangana ePASS Post Matric SC/ST scholarship deadline is in 3 days!');
      await createNotification(userId, 'MATCH', 'New Scholarship Match', 'L\'Oréal India Young Women Science Scholarship is an 80% match for your profile.');
      await createNotification(userId, 'OPTIMIZER', 'Profile Optimization Tip', 'Add a technical certification to increase your Kotak Kanya selection odds by 25%.');
      const newList = await getNotifications(userId);
      return res.status(200).json(newList);
    }
    return res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

app.post('/api/notifications/read', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Notification ID is required' });
  }
  try {
    await markNotificationAsRead(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// 3. Community Endpoints
app.get('/api/community', async (req, res) => {
  try {
    const posts = await getCommunityPosts();
    return res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return res.status(500).json({ error: 'Failed to retrieve posts.' });
  }
});

app.post('/api/community/post', async (req, res) => {
  const token = req.headers.authorization;
  let userId = null;
  if (token && token.startsWith('session_token_')) {
    userId = parseInt(token.replace('session_token_', ''));
  }
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  const { authorName, role, content } = req.body;
  if (!authorName || !role || !content) {
    return res.status(400).json({ error: 'Missing authorName, role, or content' });
  }
  try {
    await createCommunityPost(userId, authorName, role, content);
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Failed to publish post.' });
  }
});

// 4. College Bundle Recommendations
app.get('/api/colleges/bundle', async (req, res) => {
  const { stream, state } = req.query;
  const mockColleges = [
    // Telangana
    {
      name: 'Osmania University, Hyderabad',
      type: 'Government',
      state: 'Telangana',
      stream: 'Engineering & Science',
      fees: '₹35,000/year',
      scholarships: ['Telangana ePASS BC/OBC/Minority', 'Dr. Ambedkar Post Matric for SC Students']
    },
    {
      name: 'Vasavi College of Engineering, Hyderabad',
      type: 'Private-Aided',
      state: 'Telangana',
      stream: 'Engineering',
      fees: '₹120,000/year',
      scholarships: ['Telangana ePASS BC/OBC/Minority', 'Kotak Kanya Scholarship', 'AICTE Pragati Scholarship for Girls']
    },
    {
      name: 'JNTU College of Engineering, Hyderabad',
      type: 'Government',
      state: 'Telangana',
      stream: 'Engineering',
      fees: '₹40,000/year',
      scholarships: ['Telangana ePASS Post Matric Scholarship (SC/ST)', 'Reliance Foundation Undergraduate Scholarship']
    },
    {
      name: 'IIT Hyderabad',
      type: 'Autonomous',
      state: 'Telangana',
      stream: 'Engineering & Science',
      fees: '₹220,000/year',
      scholarships: ['Central Sector Scheme of Scholarship (CSSS)', 'DST INSPIRE Scholarship']
    },
    {
      name: 'University of Hyderabad',
      type: 'Central University',
      state: 'Telangana',
      stream: 'Science',
      fees: '₹25,000/year',
      scholarships: ['DST INSPIRE Scholarship', 'Central Sector Scheme of Scholarship (CSSS)', 'NSP Post Matric Scholarship for Minorities']
    },
    {
      name: 'Kakatiya University, Warangal',
      type: 'Government',
      state: 'Telangana',
      stream: 'Arts',
      fees: '₹15,000/year',
      scholarships: ['Telangana ePASS Post Matric Scholarship (SC/ST)', 'EWS Post Matric Scholarship']
    },
    {
      name: 'Nizam College (Autonomous), Hyderabad',
      type: 'Government-Aided',
      state: 'Telangana',
      stream: 'Commerce',
      fees: '₹12,000/year',
      scholarships: ['Telangana ePASS BC/OBC/Minority', 'HDFC Bank Badhte Kadam Scholarship']
    },
    // Maharashtra
    {
      name: 'IIT Bombay, Mumbai',
      type: 'Autonomous',
      state: 'Maharashtra',
      stream: 'Engineering & Science',
      fees: '₹230,000/year',
      scholarships: ['Central Sector Scheme of Scholarship (CSSS)', 'DST INSPIRE Scholarship', 'Reliance Foundation Undergraduate Scholarship']
    },
    {
      name: 'University of Mumbai, Mumbai',
      type: 'Government',
      state: 'Maharashtra',
      stream: 'Commerce',
      fees: '₹18,000/year',
      scholarships: ['EWS Post Matric Scholarship', 'HDFC Bank Badhte Kadam Scholarship', 'Tata Capital Pankh Scholarship']
    },
    {
      name: 'College of Engineering, Pune (COEP)',
      type: 'Government',
      state: 'Maharashtra',
      stream: 'Engineering',
      fees: '₹55,000/year',
      scholarships: ['AICTE Pragati Scholarship for Girls', 'Kotak Kanya Scholarship', 'Central Sector Scheme of Scholarship (CSSS)']
    },
    {
      name: 'Savitribai Phule Pune University',
      type: 'Government',
      state: 'Maharashtra',
      stream: 'Science',
      fees: '₹20,000/year',
      scholarships: ['Dr. Ambedkar Post Matric Scholarship for SC Students', 'DST INSPIRE Scholarship', 'NSP Post Matric Scholarship for Minorities']
    },
    {
      name: 'VJTI Mumbai (Veermata Jijabai Technological Institute)',
      type: 'Government',
      state: 'Maharashtra',
      stream: 'Engineering',
      fees: '₹65,000/year',
      scholarships: ['Telangana ePASS Post Matric Scholarship (SC/ST)', 'AICTE Pragati Scholarship for Girls', 'Sitaram Jindal Foundation Scholarship']
    },
    {
      name: 'ICT Mumbai (Institute of Chemical Technology)',
      type: 'Autonomous',
      state: 'Maharashtra',
      stream: 'Medical',
      fees: '₹80,000/year',
      scholarships: ["L'Oréal India For Young Women In Science Scholarship", 'Reliance Foundation Undergraduate Scholarship', 'HDFC Bank Badhte Kadam Scholarship']
    },
    {
      name: 'Symbiosis College of Arts and Commerce, Pune',
      type: 'Private-Aided',
      state: 'Maharashtra',
      stream: 'Arts',
      fees: '₹45,000/year',
      scholarships: ['Tata Capital Pankh Scholarship', 'EWS Post Matric Scholarship', 'Vidyadhan Scholarship']
    },
    // Andhra Pradesh
    {
      name: 'Andhra University, Visakhapatnam',
      type: 'Government',
      state: 'Andhra Pradesh',
      stream: 'Engineering & Science',
      fees: '₹30,000/year',
      scholarships: ['Dr. Ambedkar Post Matric Scholarship for SC Students', 'NSP Post Matric Scholarship for Minorities', 'EWS Post Matric Scholarship']
    },
    {
      name: 'JNTU Kakinada',
      type: 'Government',
      state: 'Andhra Pradesh',
      stream: 'Engineering',
      fees: '₹45,000/year',
      scholarships: ['AICTE Pragati Scholarship for Girls', 'Central Sector Scheme of Scholarship (CSSS)', 'Reliance Foundation Undergraduate Scholarship']
    },
    {
      name: 'Sri Venkateswara University, Tirupati',
      type: 'Government',
      state: 'Andhra Pradesh',
      stream: 'Science',
      fees: '₹22,000/year',
      scholarships: ['DST INSPIRE Scholarship', 'Post Matric Scholarship for ST Students', 'Vidyadhan Scholarship']
    },
    // Karnataka
    {
      name: 'Indian Institute of Science (IISc), Bangalore',
      type: 'Government',
      state: 'Karnataka',
      stream: 'Science',
      fees: '₹30,000/year',
      scholarships: ['DST INSPIRE Scholarship', 'Maulana Azad National Fellowship (MANF)']
    },
    {
      name: 'IIT Dharwad',
      type: 'Autonomous',
      state: 'Karnataka',
      stream: 'Engineering',
      fees: '₹200,000/year',
      scholarships: ['Central Sector Scheme of Scholarship (CSSS)', 'AICTE Pragati Scholarship for Girls']
    },
    {
      name: 'National Institute of Technology, Surathkal',
      type: 'Government',
      state: 'Karnataka',
      stream: 'Engineering',
      fees: '₹70,000/year',
      scholarships: ['Kotak Kanya Scholarship', 'HDFC Bank Badhte Kadam Scholarship', 'Dr. Ambedkar Post Matric Scholarship for SC Students']
    },
    {
      name: 'Bangalore University',
      type: 'Government',
      state: 'Karnataka',
      stream: 'Commerce',
      fees: '₹15,000/year',
      scholarships: ['EWS Post Matric Scholarship', 'Sitaram Jindal Foundation Scholarship', 'Tata Capital Pankh Scholarship']
    },
    // Tamil Nadu
    {
      name: 'IIT Madras, Chennai',
      type: 'Autonomous',
      state: 'Tamil Nadu',
      stream: 'Engineering & Science',
      fees: '₹220,000/year',
      scholarships: ['Central Sector Scheme of Scholarship (CSSS)', 'DST INSPIRE Scholarship']
    },
    {
      name: 'Anna University, Chennai',
      type: 'Government',
      state: 'Tamil Nadu',
      stream: 'Engineering',
      fees: '₹50,000/year',
      scholarships: ['AICTE Pragati Scholarship for Girls', 'Reliance Foundation Undergraduate Scholarship', 'HDFC Bank Badhte Kadam Scholarship']
    },
    {
      name: 'Madras University',
      type: 'Government',
      state: 'Tamil Nadu',
      stream: 'Arts',
      fees: '₹12,000/year',
      scholarships: ['EWS Post Matric Scholarship', 'NSP Post Matric Scholarship for Minorities', 'Tata Capital Pankh Scholarship']
    },
    // Kerala
    {
      name: 'IIT Palakkad',
      type: 'Autonomous',
      state: 'Kerala',
      stream: 'Engineering',
      fees: '₹200,000/year',
      scholarships: ['Central Sector Scheme of Scholarship (CSSS)', 'AICTE Pragati Scholarship for Girls']
    },
    {
      name: 'Kerala University, Thiruvananthapuram',
      type: 'Government',
      state: 'Kerala',
      stream: 'Science',
      fees: '₹18,000/year',
      scholarships: ['DST INSPIRE Scholarship', 'Dr. Ambedkar Post Matric Scholarship for SC Students', 'Vidyadhan Scholarship']
    },
    {
      name: 'National Institute of Technology, Calicut',
      type: 'Government',
      state: 'Kerala',
      stream: 'Engineering',
      fees: '₹65,000/year',
      scholarships: ['HDFC Bank Badhte Kadam Scholarship', 'Kotak Kanya Scholarship', 'Sitaram Jindal Foundation Scholarship']
    },
    // Delhi
    {
      name: 'IIT Delhi',
      type: 'Autonomous',
      state: 'Delhi',
      stream: 'Engineering & Science',
      fees: '₹225,000/year',
      scholarships: ['Central Sector Scheme of Scholarship (CSSS)', 'DST INSPIRE Scholarship']
    },
    {
      name: 'Delhi University (DU)',
      type: 'Central University',
      state: 'Delhi',
      stream: 'Commerce',
      fees: '₹20,000/year',
      scholarships: ['EWS Post Matric Scholarship', 'NSP Post Matric Scholarship for Minorities', 'HDFC Bank Badhte Kadam Scholarship']
    },
    {
      name: 'Jamia Millia Islamia, New Delhi',
      type: 'Central University',
      state: 'Delhi',
      stream: 'Arts',
      fees: '₹16,000/year',
      scholarships: ['Maulana Azad National Fellowship (MANF)', 'NSP Post Matric Scholarship for Minorities', "Begum Hazrat Mahal Scholarship (Girls)"]
    },
    {
      name: 'Indraprastha Institute of Information Technology (IIIT-Delhi)',
      type: 'Autonomous',
      state: 'Delhi',
      stream: 'Engineering',
      fees: '₹180,000/year',
      scholarships: ['Tata Capital Pankh Scholarship', 'Reliance Foundation Undergraduate Scholarship', 'AICTE Pragati Scholarship for Girls']
    },
    // Gujarat
    {
      name: 'IIT Gandhinagar',
      type: 'Autonomous',
      state: 'Gujarat',
      stream: 'Engineering & Science',
      fees: '₹215,000/year',
      scholarships: ['Central Sector Scheme of Scholarship (CSSS)', 'DST INSPIRE Scholarship']
    },
    {
      name: 'Gujarat University, Ahmedabad',
      type: 'Government',
      state: 'Gujarat',
      stream: 'Commerce',
      fees: '₹14,000/year',
      scholarships: ['EWS Post Matric Scholarship', 'Tata Capital Pankh Scholarship', 'HDFC Bank Badhte Kadam Scholarship']
    },
    {
      name: 'SVNIT Surat (NIT Surat)',
      type: 'Government',
      state: 'Gujarat',
      stream: 'Engineering',
      fees: '₹70,000/year',
      scholarships: ['Kotak Kanya Scholarship', 'AICTE Pragati Scholarship for Girls', 'Sitaram Jindal Foundation Scholarship']
    },
    // Rajasthan
    {
      name: 'IIT Jodhpur',
      type: 'Autonomous',
      state: 'Rajasthan',
      stream: 'Engineering & Science',
      fees: '₹205,000/year',
      scholarships: ['Central Sector Scheme of Scholarship (CSSS)', 'Reliance Foundation Undergraduate Scholarship']
    },
    {
      name: 'University of Rajasthan, Jaipur',
      type: 'Government',
      state: 'Rajasthan',
      stream: 'Arts',
      fees: '₹10,000/year',
      scholarships: ['EWS Post Matric Scholarship', 'NSP Post Matric Scholarship for Minorities', 'Post Matric Scholarship for ST Students']
    },
    {
      name: 'Malaviya National Institute of Technology (MNIT), Jaipur',
      type: 'Government',
      state: 'Rajasthan',
      stream: 'Engineering',
      fees: '₹65,000/year',
      scholarships: ['AICTE Pragati Scholarship for Girls', 'HDFC Bank Badhte Kadam Scholarship', 'Dr. Ambedkar Post Matric Scholarship for SC Students']
    }
  ];

  // Apply state filter first (strict match)
  let filtered = state
    ? mockColleges.filter(c => c.state.toLowerCase() === state.toLowerCase())
    : mockColleges;

  // Apply stream filter on top of state results
  if (stream && filtered.length > 0) {
    const streamFiltered = filtered.filter(c => c.stream.toLowerCase().includes(stream.toLowerCase()));
    // Only apply stream filter if it yields results; otherwise show all colleges for that state
    if (streamFiltered.length > 0) {
      filtered = streamFiltered;
    }
  }

  // If no state data available at all, show all as a last resort
  if (filtered.length === 0) {
    filtered = mockColleges.slice(0, 5);
  }

  return res.status(200).json(filtered);
});

// 5. Admin Analytics Dashboard Endpoint
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const dbConnection = await getDbConnection();
    const usersCount = await dbConnection.get("SELECT COUNT(*) as count FROM users");
    const submissionsCount = await dbConnection.get("SELECT COUNT(*) as count FROM submissions");
    const trackerCount = await dbConnection.get("SELECT COUNT(*) as count FROM student_scholarships");
    
    const data = {
      activeUsers: usersCount.count || 24,
      totalQueries: submissionsCount.count || 148,
      trackedApplications: trackerCount.count || 42,
      topScholarships: [
        { name: 'Telangana ePASS (SC/ST)', count: 28 },
        { name: 'Central Sector Scheme (CSSS)', count: 18 },
        { name: 'L\'Oréal Girls STEM', count: 14 },
        { name: 'Kotak Kanya Scholarship', count: 10 }
      ],
      stateApplicantShares: [
        { state: 'Telangana', percentage: 72 },
        { state: 'Andhra Pradesh', percentage: 14 },
        { state: 'Karnataka', percentage: 8 },
        { state: 'Maharashtra', percentage: 6 }
      ],
      applicationConversion: {
        searched: 100,
        saved: 42,
        applied: 18,
        approved: 8
      }
    };
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin stats.' });
  }
});

app.listen(PORT, () => {
  console.log(`ScholarSphere AI Backend running on port ${PORT}`);
});
