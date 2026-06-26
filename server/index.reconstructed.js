# Walkthrough — AI-Powered Smart Features

We have successfully implemented the **AI-Powered Smart Features** (Scholarship Match Score, Success Predictor, AI Profile Optimizer, and AI Chat Assistant) in the ScholarCheck project.

---

## Changes

### Backend Components

#### [server/index.js](file:///c:/Users/saira/OneDrive/Documents/Internshippppp/server/index.js)
- **Smart Metrics Helper**: Added `calculateSmartMetrics` function to calculate the percentage matching score, assess selection probability, explain matching/missing criteria, and recommend profile updates.
- **Declarative Mocks**: Refactored `getMockScholarships` and `getAdvisorMockRecommendations` to evaluate profiles dynamically and include "narrowly missed" opportunities (match score $\ge 50\%$) alongside qualified ones.
- **OpenAI Prompt Updates**: Enhanced OpenAI prompts in `/api/check-eligibility` and `/api/advisor/recommendations` to structure responses containing the new AI fields when the API key is active.
- **AI Chat Assistant Endpoint**: Added the `/api/chat` route to manage conversational assistant sessions. It automatically utilizes OpenAI if available, or falls back to a rules-based keyword classifier designed to identify and answer specific scholarship and eligibility questions.

---

### Frontend Components

#### [src/App.jsx](file:///c:/Users/saira/OneDrive/Documents/Internshippppp/src/App.jsx)
- **Floating AI Assistant**: Created a floating message widget at the bottom-right of 
  getCommunityPosts,
  createCommunityPost
- **Markdown Message Rendering**: Built a lightweight React markdown parser to render bold text and clickable HTML links seamlessly.

#### [src/components/ResultsView.jsx](file:///c:/Users/saira/OneDrive/Documents/Internshippppp/src/components/ResultsView.jsx) & [src/components/DashboardView.jsx](file:///c:/Users/saira/OneDrive/Documents/Internshippppp/src/components/DashboardView.jsx)
- **Percentage Match gauges**: Displayed matching percentage tags color-coded by strength (Green for $\ge 90\%$, Yellow for $70-89\%$, Red for $50-69\%$).
- **Success Predictor Pills**: Integrated Colored "Selection Chance" pills (High/Medium/Low).
- **AI Justification Cards**: Displayed detailed explanations of why they qualify or what criteria is missing inside a `glass-ai` stylized block.
- **AI Profile Optimizers**: Rendered checklist of actionable suggestions if a scholarship is narrowly missed or to optimize matched applications.

---

## Validation & Testing

### Compilation Verification
- Ran Vite build tool to verify compilation. Build finished cleanly with zero errors:
  ```bash
  dist/index.html                   0.97 kB │ gzip:  0.52 kB
  dist/assets/index-DWKkEWdx.css   27.23 kB │ gzip:  6.03 kB
  dist/assets/index-BzzB4zCx.js   271.81 kB │ gzip: 76.80 kB
  ✓ built in 3.00s
  ```

### Server Verification
- Verified server startup:
  ```
  No OpenAI API Key found. AI Advisor will operate in graceful MOCK mode.
  ScholarSphere AI Backend running on port 5000
  SQLite database initialized successfully at: C:\Users\saira\OneDrive\Documents\Internshippppp\server\database.sqlite
  Scholarships table already seeded.
  Database schemas initialized.
  ```
- Checked that database connections and local fallback handlers load correctly.

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
    }

    const inputHash = hashPassword(password);
    if (user.password !== inputHash) {
      return res.status(400).json({ error: 'Incorrect password. Please try again.' });
    }

    // Clean password from response
    const { password: _, ...cleanUser } = user;

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
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Student profile not found.' });
  }
});

// -------------------------------------------------------------
// Profile Endpoints
// -------------------------------------------------------------
app.get('/api/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
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




















































// -------------------------------------------------------------
app.get('/api/scholarships', async (req, res) => {
  try {
    const list = await getAllScholarships();
    return res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching all scholarships:', error);
    return res.status(500).json({ error: 'Failed to retrieve scholarships list.' });
  }
});

app.get('/api/scholarships/eligible', async (req, res) => {
  const { marks, income, category } = req.query;
  
  if (marks === undefined || income === undefined || !category) {
    return res.status(400).json({ error: 'Please provide marks, income, and category query parameters.' });
  }
  
  try {
    const list = await getEligibleScholarships(marks, income, category);
    return res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching eligible scholarships:', error);
    return res.status(500).json({ error: 'Failed to retrieve eligible scholarships.' });
  }
});

// -------------------------------------------------------------
// Email Notification Endpoint
// -------------------------------------------------------------
app.post('/api/send-email', async (req, res) => {
  const { studentName, email, eligibleScholarships, summary } = req.body;

  if (!email || !studentName || !eligibleScholarships) {
    return res.status(400).json({ error: 'Missing required fields: email, studentName, or eligibleScholarships.' });
  }

  try {
    let scholarshipText = '';
    eligibleScholarships.forEach(scheme => {
      let remainingLabel = 'N/A';
      if (scheme.deadline) {
        const deadline = new Date(scheme.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadline.setHours(0, 0, 0, 0);
        const diffTime = deadline - today;
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (remainingDays < 0) {
          remainingLabel = 'Closed';
        } else {
          remainingLabel = `${remainingDays} Days`;
        }
      }

      scholarshipText += `
------------------------------------------------

${scheme.name}

Deadline:
${scheme.deadline ? new Date(scheme.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}

Remaining:
${remainingLabel}

Apply Here:
${scheme.application_link || 'https://scholarships.gov.in'}
`;
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your_email@gmail.com',
      to: email,
      subject: 'Scholarship Eligibility Result',
      text: `Hello ${studentName},

Based on your submitted details, you are eligible for the following scholarships.
${scholarshipText}
------------------------------------------------

Required Documents

• Aadhaar Card
• Income Certificate
• Marks Memo
• Caste Certificate

Generated by

AI Scholarship & Financial Aid Eligibility Checker`
    };

    if (!process.env.EMAIL_


















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





































































      optimizations.push(`Aim for a ${minMarks}% score in the next semester to cross the eligibility threshold.`);
      optimizations.push("Obtain a technical certification or course project to showcase extra profile strength.");
    }
    if (incomeLimit && incomeNum > incomeLimit) {
      missing.push(`annual family income limit of ₹${incomeLimit.toLocaleString()} (you have ₹${incomeNum.toLocaleString()})`);
      optimizations.push("Ensure your family income certificate is updated and officially verified.");
      optimizations.push("Look for merit-based scholarships that do not place strict caps on household income.");
    }
    if (missing.length === 0) {
      justification = `You match most criteria but do not fully meet the category requirements of ${categoryReq}.`;
      optimizations.push("Submit a statement of purpose (SOP) emphasizing financial need and achievements.");
    } else {
      justification = `You match most criteria but do not fully meet the: ${missing.join(' and ')}.`;
    }
  }

  optimizations.push("Include a strong personal statement outlining your academic goals.");

  return {
    match_score: finalMatchScore,
    success_chance: successChance,
    justification,
    optimizations
  };
}

function getLimitsForScholarship(name) {
  const n = name.toLowerCase();
  if (n.includes("l'oréal") || n.includes("loreal")) return { min_marks: 80, income_limit: 600000, category: 'General' };
  if (n.includes("kotak")) return { min_marks: 85, income_limit: 600000, category: 'General' };
  if (n.includes("hazrat mahal") || n.includes("begum")) return { min_marks: 50, income_limit: 200000, category: 'Minority' };
  if (n.includes("pragati")) return { min_marks: 50, income_limit: 800000, category: 'General' };
  if (n.includes("telangana epass") && n.includes("sc/st")) return { min_marks: 50, income_limit: 200000, category: 'SC' };
  if (n.includes("dr. ambedkar")) return { min_marks: 50, income_limit: 250000, category: 'SC' };
  if (n.includes("st students")) return { min_marks: 50, income_limit: 250000, category: 'ST' };
  if (n.includes("yasasvi")) return { min_marks: 60, income_limit: 250000, category: 'OBC' };
  if (n.includes("ews post matric")) return { min_marks: 60, income_limit: 100000, category: 'EWS' };
  if (n.includes("telangana epass") && n.includes("bc/ebc")) return { min_marks: 50, income_limit: 150000, category: 'OBC' };
  if (n.includes("nsp post matric")) return { min_marks: 50, income_limit: 200000, category: 'Minority' };
  if (n.includes("maulana azad national")) return { min_marks: 65, income_limit: 250000, category: 'Minority' };
  if (n.includes("central sector")) return { min_marks: 80, income_limit: 450000, category: 'General' };
  if (n.includes("reliance")) return { min_marks: 60, income_limit: 1500000, category: 'General' };
  if (n.includes("jindal")) return { min_marks: 60, income_limit: 250000, category: 'General' };
  if (n.includes("vidyadhan")) return { min_marks: 75, income_limit: 200000, category: 'General' };
  if (n.includes("hdfc")) r



























































































































































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
  
  // 1. Telangana ePASS SC/ST (Full RTF)
  if ((isSC || isST) && incomeNum <= 200000) {
    scholarships.push({
      name: 'Telangana ePASS Post Matric Scholarship (SC/ST)',





































































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
  return matches.slice(0, 5).map(m => {
    const limits = getLimitsForScholarship(m.name);
    const metrics = calculateSmartMetrics(profile, limits.min_marks, limits.income_limit, limits.category, m.name);
    return {
      status: m.status,
      type_tags: m.type_tags,
      name: m.name,
      provider: m.provider,
      award_amount: m.award_amount,
      key_eligibility: m.key_eligibility,
      stream_fit: m.stream_fit,
      deadline: m.deadline,
      justification: m.justification || metrics.justification,
      application_link: m.application_link || getProviderLink(m.provider),
      match_score: metrics.match_score,
      success_chance: metrics.success_chance,
      optimizations: metrics.optimizations
    };
  });
}

function getMockScholarships(name, income, marks, category, courseYear) {
  const student = { name, income, marks, category, course_year: courseYear };
  const pool = [
    {
      name: 'Telangana ePASS Post Matric Scholarship (SC/ST)',
      min_marks: 50,
      income_limit: 200000,
      category: 'SC',
      amount: 'Full Tuition Fee Reimbursement (RTF) + ₹15,000/year Maintenance Allowance',
      application_link: 'https://telanganaepass.cgg.gov.in/'
    },
    {
      name: 'Telangana ePASS Post Matric Scholarship (BC/EBC/Minority)',
      min_marks: 50,
      income_limit: 150000,
      category: 'OBC',
      amount: 'Partial/Full Tuition Fee Reimbursement + ₹10,000/year Maintenance Allowance',
      application_link: 'https://telanganaepass.cgg.gov.in/'
    },
    {
      name: 'Dr. Ambedkar Post Matric Scholarship for SC Students',
      min_marks: 50,
      income_limit: 250000,
      category: 'SC',
      amount: 'F
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

  // Enrich scholarship results using SQLite database details
  try {
    const dbConnection = await getDbConnection();
    const enriched = [];
    for (const scheme of finalResult) {
      const dbMatch = await dbConnection.get(
        `SELECT * FROM scholarships 

            OR LOWER(?) LIKE '%' || LOWER(scholarship_name) || '%' 
            OR LOWER(scholarship_name) LIKE '%' || LOWER(?) || '%'`,
        [scheme.name.toLowerCase(), scheme.name.toLowerCase(), scheme.name.toLowerCase()]
      );
      if (dbMatch) {
        enriched.push({
          name: dbMatch.scholarship_name,
          eligibility_criteria_met: scheme.eligibility_criteria_met || dbMatch.description,
          amount: scheme.amount || `₹${dbMatch.description}`,
          application_link: dbMatch.application_link || scheme.application_link,
          deadline: dbMatch.deadline,
          description: dbMatch.description
        });
      } else {
        enriched.push(scheme);
      }
    }
    finalResult = enriched;
  } catch (enrichError) {
    console.error('Failed to enrich scholarships with SQLite data:', enrichError);
  }

  try {
    // Save to SQLite
    const submissionId = await saveSubmission(name, income, marks, category, courseYear, finalResult, userId);

    return res.status(200).json({

















  if (results.length === 0) {
    const fallbackMetrics = calculateSmartMetrics(student, 0, 150000, 'General', 'Sri Gowthami Financial Aid & Hardship Grant');
    results.push({
      name: 'Sri Gowthami Financial Aid & Hardship Grant',
      eligibility_criteria_met: fallbackMetrics.justification,
      amount: '₹8,000 one-time fee concession',
      application_link: 'https://srigowthami.edu.in/financial-aid',
      match_score: fallbackMetrics.match_score,
      success_chance: fallbackMetrics.success_chance,
      justification: fallbackMetrics.justification,
      optimizations: fallbackMetrics.optimizations
    });
      eligibility_criteria_met: fallbackMetrics.justification,
      amount: '₹8,000 one-time fee concession',
      application_link: 'https://srigowthami.edu.in/financial-aid',
      match_score: fallbackMetrics.match_score,
      success_chance: fallbackMetrics.success_chance,
      justification: fallbackMetrics.justification,
      optimizations: fallbackMetrics.optimizations
    });
  }

      match_score: fallbackMetrics.match_score,
      success_chance: fallbackMetrics.success_chance,
      justification: fallbackMetrics.justification,
      optimizations: fallbackMetrics.optimizations
    });
  }

  return results;
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

      const systemPrompt = `You are an expert AI scholarship eligibility assistant for students in Telangana, India. Based on the student's income, marks, and category, identify both fully eligible scholarships (where they meet all criteria) and narrowly missed scholarships (where they miss some criteria slightly, e.g., marks are close or income is slightly above the cap).

Your response MUST be a valid JSON object with a single key "scholarships" containing an array of objects. Each scholarship object MUST contain exactly:
- name: (The exact name of the scholarship, e.g., TS ePASS Post Matric Scholarship)
- amount: (The approximate amount or concession provided)
- application_link: (The official URL or website name where they can apply)
- match_score: (A percentage score from 0 to 100 indicating how well their profile matches the scholarship. Fully qualified should be >= 90%, narrowly missed should be 50-89%)
- success_chance: (One of: "Low", "Medium", "High")
- justification: (A clear justification explaining why it matches, or highlighting any missing eligibility criteria like "Your marks (75%) are slightly below the required 80%")
- optimizations: (An array of 1-3 actionable improvements if they miss criteria or want to boost selection odds, e.g., ["Aim for an 85% in the next semester", "Add a technical certification"])

Provide a comprehensive list of 3-5 scholarships. Output ONLY raw JSON. Do not include markdown code block formatting (like \`\`\`json) or extra text.`;

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

    finalResult = getMockScholarships(name, income, marks, category, courseYear);
    isMock = true;
  }

  // Enrich scholarship results using SQLite database details
  try {
    const dbConnection = await getDbConnection();
    const enriched = [];
    for (const scheme of finalResult) {
      const dbMatch = await dbConnection.get(
        `SELECT * FROM scholarships 
         WHERE LOWER(scholarship_name) = ? 
            OR LOWER(?) LIKE '%' || LOWER(scholarship_name) || '%' 
            OR LOWER(scholarship_name) LIKE '%' || LOWER(?) || '%'`,
        [scheme.name.toLowerCase(), scheme.name.toLowerCase(), scheme.name.toLowerCase()]
      );
      if (dbMatch) {
        enriched.push({
          name: dbMatch.scholarship_name,
          eligibility_criteria_met: scheme.eligibility_criteria_met || dbMatch.description,
          amount: scheme.amount || `₹${dbMatch.description}`,
          application_link: dbMatch.application_link || scheme.application_link,
          deadline: dbMatch.deadline,
          description: dbMatch.description
        });
      } else {
        enriched.push(scheme);
      }
    }
    finalResult = enriched;
  } catch (enrichError) {
    console.error('Failed to enrich scholarships with SQLite data:', enrichError);
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

app.listen(PORT, () => {
  console.log(`ScholarSphere AI Backend running on port ${PORT}`);
});












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
- award_amount: (Forma

















































      const enriched = [];
      for (const scheme of savedList) {
        const dbMatch = await dbConnection.get(
          `SELECT * FROM scholarships 
           WHERE LOWER(scholarship_name) = ? 
              OR LOWER(?) LIKE '%' || LOWER(scholarship_name) || '%' 
              OR LOWER(scholarship_name) LIKE '%' || LOWER(?) || '%'`,
          [scheme.name.toLowerCase(), scheme.name.toLowerCase(), scheme.name.toLowerCase()]
        );
        if (dbMatch) {
          enriched.push({
            name: dbMatch.scholarship_name,
            eligibility_criteria_met: scheme.eligibility_criteria_met || dbMatch.description,
            amount: scheme.amount || `₹${dbMatch.description}`,
            application_link: dbMatch.application_link || scheme.application_link,
            deadline: dbMatch.deadline,
            description: dbMatch.description
          });
        } else {
          enriched.push(scheme);
        }
          [scheme.name.toLowerCase(), scheme.name.toLowerCase(), scheme.name.toLowerCase()]
        );
        if (dbMatch) {
          enriched.push({
            name: dbMatch.scholarship_name,
            eligibility_criteria_met: scheme.justification || dbMatch.description,
            amount: scheme.amount || `₹${dbMatch.description}`,
            application_link: dbMatch.application_link || scheme.application_link,
            deadline: dbMatch.deadline,
            description: dbMatch.description,
            match_score: scheme.match_score,
            success_chance: scheme.success_chance,
            justification: scheme.justification,
            optimizations: scheme.optimizations
          });
        } else {
          enriched.push(scheme);
        }
      }
      savedList = enriched;
    } catch (err) {
      console.error('Advisor history enrichment error:', err);
    }

    // Save this consultation in historical submissions
    await saveSubmission(
      profile.name,
      profile.income,
      profile.marks,
      profile.category,
      profile.course_year,
      savedList,
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

      const response






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


   - **Eligibility**: Girl students in STEM with $\ge 80\%$ marks.


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





Please let me know your academic marks and category so I can give you a precise e
    }
    responseText = `Here are some actionable ways to optimize your scholarship eligibility profile:



1. **Academic Performance**: Many premium scholarships (like Central Sector Scheme CSSS or Kotak Kanya) require at least **80% - 85%** marks. Aiming to boost your marks in the next semester is the single most effective optimizer.

2. **Technical Certifications**: Adding industry-recognized technical certifications (e.g., in Python, AWS, or digital accounting) helps you stand out in private foundation reviews.

3. **Keep Certificates Updated**: Ensure your family's Income Certificate (reflecting income under ₹2.5 Lakhs) and Caste Certificate are renewed and officially signed by regional authorities.

4. **Statement of Purpose (SOP)**: Prepare a strong paragraph explaining how financial support will help you achieve your career aspirations, highlighting any hardship.



Would you like to analyze a specific scholarship requirement?`;

  } else if (query.includes("epass") || query.includes("telangana")) {

    responseText = `**Telangana ePASS (Electronic Payment & Application System of Scholarships)** is the primary scholarship portal for students studying in Telangana. 



It offers post-matric scholarship schemes:

- **SC/ST Category**: Family income limit is ₹2,0,000/year. Eligible for full tuition fee reimbursement.

- **BC/EBC/Minority Category**: Family income limit is ₹1,50,000/year. Eligible for partial/full tuition reimbursement.



To apply, you will need:

- SSC Hall Ticket Number

- Aadhaar Card Number

- Income Certificate ID (issued by Meeseva)

- Caste Certificate ID (issued by Meeseva)

- Bank Account details

});

You can visit the official site: [Telangana ePASS Portal](https://telanganaepass.cgg.gov.in/)`;
  } else {
    // Default reply
    responseText = `Hello! I am your **ScholarCheck AI Assistant**. 


I can help you with:
- Finding state (TS ePASS) and national (NSP) scholarship schemes.
- Analyzing your profile eligibility details.
- Guiding you on how to optimize your academic or document profile.
- Clarifying eligibility boundaries (e.g., "Can I apply for NMMS with 80%?").

What scholarship or eligibility criteria can I explain for you today?`;
  }you with:
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
    const tracked = await getTrackedScholarships(userId);
    return res.status(200).json(tracked);
  } catch (error) {
    console.error('Error fetching tracked scholarships:', error);
    return res.status(500).json({ error: 'Failed to retrieve tracked list.' });
  }
});
























































































































































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

