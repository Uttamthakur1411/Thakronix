const aiToolTemplates = {
  prompt: {
    title: 'Prompt Architect',
    build: (input) => {
      const topic = input || 'a modern AI startup';
      return `System role: Product strategist\nGoal: Turn ${topic} into a clear AI-ready growth plan.\n\nOutput format:\n1. Objective\n2. User pain points\n3. Core feature set\n4. Launch plan\n5. Metrics to track\n\nUse a professional, structured tone and keep the answer concise but actionable.`;
    }
  },
  rewrite: {
    title: 'Text Rewriter',
    build: (input) => `Professional rewrite:\n${input}\n\nReframed version: ${input.replace(/\s+/g, ' ').trim()} A refined, clearer version keeps the same meaning while improving flow, confidence, and readability for a modern audience.`
  },
  summary: {
    title: 'Text Summary',
    build: (input) => `TL;DR:\n• The main idea is to simplify work with targeted AI automation.\n• Good systems improve speed without losing quality.\n• Human review remains essential for trust and context.\n\nSource context:\n${input}`
  },
  grammar: {
    title: 'Grammar Fixer',
    build: (input) => `Corrected version:\n${input}\n\nImproved draft:\nThe report was delayed because the team did not review the draft before the deadline, and the presentation was not polished enough.`
  },
  email: {
    title: 'Email Studio',
    build: (input) => `Subject: Application for Product Design Role\n\nDear Hiring Manager,\n\nThank you for considering my profile. I am writing to express interest in the Product Designer opportunity. ${input} I would be glad to discuss how my design experience and product thinking can support your team.\n\nBest regards,\n[Your Name]`
  },
  blog: {
    title: 'Blog Outline',
    build: (input) => `Blog title: ${input.split(':')[1]?.trim() || 'AI Productivity for Modern Teams'}\n\nOutline:\n1. Why AI matters for modern workflows\n2. Common mistakes people make\n3. Simple automation ideas that actually work\n4. Launching a lightweight workflow\n5. Tracking results and evolving the system\n6. Final takeaways and next steps`
  },
  repurpose: {
    title: 'Content Repurposer',
    build: (input) => `LinkedIn post:\n${input}\n\nShort-form version:\nSmall workflows create big output. The best time to automate repetitive work is before it drains your focus.\n\nInstagram caption:\nConsistency beats complexity. Build simple systems, review them often, and let smart tools handle repetitive tasks.`
  },
  resume: {
    title: 'Resume Builder',
    build: (input) => `Summary:\nResults-focused professional with strong skills in product thinking, UI execution, and growth-oriented execution.\n\nHighlights:\n- Built user-focused digital experiences\n- Improved clarity and conversion in design-driven workflows\n- Worked across product, design and development teams\n\nExperience:\n${input}\n\nCore skills:\nCommunication, product sense, collaboration, performance thinking, UI/UX execution.`
  },
  resumeAnalyze: {
    title: 'Resume Analyzer',
    build: (input) => `Resume review:\n• Add measurable outcomes to your achievements\n• Highlight role-specific keywords like product thinking, performance, and collaboration\n• Use stronger action verbs such as improved, launched, optimized, designed\n• Include a clearer skills section aligned to the target role\n\nNotes:\n${input}`
  },
  cover: {
    title: 'Cover Letter',
    build: (input) => `Dear Hiring Manager,\n\nI am excited to apply for the opportunity described in your vacancy. ${input} I am confident my background, communication style, and product-focused approach would support your team and help create meaningful impact.\n\nI look forward to discussing how I can contribute to your goals.\n\nSincerely,\n[Your Name]`
  },
  interview: {
    title: 'Interview Coach',
    build: (input) => `Interview plan:\n1. Tell me about a project where you improved user experience.\n2. How do you prioritize work when deadlines change?\n3. Describe a time you handled conflict in a team.\n4. What would you do if a feature was delayed but still had to be shipped?\n5. How do you measure success in a product role?\n\nFocus area:\n${input}`
  },
  social: {
    title: 'Social Media Studio',
    build: (input) => `LinkedIn post draft:\n${input}\n\nA simple system beats a noisy strategy. The best teams focus on clarity, consistent action, and a few high-value workflows that reduce friction.\n\nCTA: What part of your workflow could be simplified this week?`
  },
  hook: {
    title: 'Hook Generator',
    build: (input) => `Hook options:\n1. Most people overcomplicate content. Here is the simple strategy that actually works.\n2. If your workflow feels messy, this is the change that fixes it.\n3. Why ${input} is the mistake most creators make after month one.\n4. The painful truth about lazy content systems.\n5. What nobody tells you before building a creator workflow.`
  },
  script: {
    title: 'Script Generator',
    build: (input) => `Hook:\nMost people think productivity is about doing more. It is actually about removing friction.\n\nIntro:\nToday we are talking about ${input}.\n\nBody:\n- Current problem\n- Why it happens\n- Better workflow\n- Quick examples\n- Final payoff\n\nCTA:\nComment “workflow” if you want a simple system to try this week.`
  },
  thumbnail: {
    title: 'Thumbnail Concept',
    build: (input) => `Thumbnail idea:\nMain text: ${input}\nVisual direction: bold contrast, big face expression, one clean color pop, simple background, clear value proposition.\nLayout: left-aligned headline, close-up subject, high-contrast color blocks, strong focal point.`
  },
  calendar: {
    title: 'Content Calendar',
    build: (input) => `30-day plan:\nWeek 1: Core concept post + share a real workflow example\nWeek 2: Honest breakdown of common mistakes\nWeek 3: Case study or before/after workflow\nWeek 4: Personal lesson, tool recommendation, and call-to-action\n\nAudience: ${input}`
  },
  regex: {
    title: 'Regex Helper',
    build: (input) => `Recommended pattern:\n^(\+91[ -]?)?[6-9]\d{9}$\n\nUse case:\n${input}\n\nNotes:\n- Allows optional +91 prefix\n- Validates 10 digits after the country code\n- Works for Indian mobile numbers` 
  },
  sql: {
    title: 'SQL Generator',
    build: (input) => `Query:\nSELECT customer_id, SUM(total_amount) AS total_value\nFROM orders\nWHERE order_date >= CURRENT_DATE - INTERVAL '30 days'\nGROUP BY customer_id\nORDER BY total_value DESC\nLIMIT 5;\n\nIntent:\n${input}`
  },
  json: {
    title: 'JSON Formatter',
    build: (input) => `Pretty JSON:\n{\n  "name": "Rahul",\n  "experience": 2,\n  "skills": ["Python", "SQL", "React"],\n  "status": "active"\n}\n\nExplanation:\nThis object contains basic profile fields. The arrays represent skill tags and the nested data is easy to consume in UI or API flows.\n\nInput preview:\n${input}`
  },
  api: {
    title: 'API Blueprint',
    build: (input) => `REST API design:\n- GET /students\n- POST /students\n- GET /students/:id\n- PUT /students/:id\n- DELETE /students/:id\n- GET /reports/student-performance\n\nRequest idea:\n${input}\n\nBest practice:\nUse JSON body, validation middleware, and standard HTTP status codes such as 200, 201, 400 and 404.`
  },
  code: {
    title: 'Code Explainer',
    build: (input) => `What this does:\nThis function checks a base condition and then recursively reduces a problem until it reaches a terminating case.\n\nWhy it works:\n- Base case stops recursion\n- Recursive branch reduces problem size\n- Each call moves closer to the final answer\n\nExample snippet:\n${input}`
  },
  error: {
    title: 'Error Explainer',
    build: (input) => `Root cause:\nThe code is trying to access a list item using a string key instead of an integer index. This causes a TypeError because the data structure is a list, not a dictionary.\n\nLikely fix:\nUse a valid index or convert the structure as needed.\n\nError text:\n${input}`
  },
  readme: {
    title: 'README Generator',
    build: (input) => `# Project Overview\n${input}\n\n## Features\n- Fast and simple workflows\n- Modern UI\n- Secure local processing\n- Responsive design\n\n## Installation\n1. Clone the repository\n2. Install dependencies\n3. Run the app locally\n\n## Usage\nUse the product dashboard to generate reports, transform files and manage workflows.`
  },
  businessName: {
    title: 'Business Name Ideas',
    build: (input) => `Brand concepts:\n1. ${input.split(' ')[0] || 'Nova'}Flow\n2. ${input.split(' ')[0] || 'Bright'}Launch\n3. ${input.split(' ')[0] || 'Signal'}Hive\n4. ${input.split(' ')[0] || 'Quest'}Panel\n5. ${input.split(' ')[0] || 'Flow'}Orbit\n\nStrategy:\nKeep the name short, memorable, and easy to pronounce across web and mobile.`
  },
  domain: {
    title: 'Domain Suggestions',
    build: (input) => `Suggested domains:\n- ${input.trim().toLowerCase().replace(/\s+/g, '')}labs.com\n- ${input.trim().toLowerCase().replace(/\s+/g, '')}hq.com\n- ${input.trim().toLowerCase().replace(/\s+/g, '')}works.io\n- ${input.trim().toLowerCase().replace(/\s+/g, '')}flow.co\n- ${input.trim().toLowerCase().replace(/\s+/g, '')}studio.ai`
  },
  aboutUs: {
    title: 'About Us Copy',
    build: (input) => `About us:\nWe help ambitious people simplify complex work through practical tools, clear workflows and thoughtful digital experiences. ${input} Our mission is to make value creation easier, faster, and more sustainable for teams and creators.`
  },
  idea: {
    title: 'Idea Generator',
    build: (input) => `Startup ideas:\n1. AI planner for students and creators\n2. Smart file summarizer for small teams\n3. Lightweight automation toolkit for SaaS customers\n4. Research assistant for college projects\n5. Creator dashboard for campaign planning\n\nLaunch focus:\n${input}`
  },
  feature: {
    title: 'Feature Suggestions',
    build: (input) => `Core features:\n• Sign-up + login\n• Job posting dashboard\n• Candidate search\n• Smart skill matching\n• Interview scheduler\n• Analytics and insights\n\nInitial idea:\n${input}`
  },
  chat: {
    title: 'Private AI Response',
    build: (input) => `Helpful answer:\nStart with one clear use-case, keep the stack simple, and focus on the core workflow before adding extra features. For a new AI tool website, the most important things are trust, speed, and a clear value proposition.\n\nPrompt context:\n${input}`
  },
  fileChat: {
    title: 'File Chat Summary',
    build: (input) => `Key points:\n• The strongest trends come from consistent repeatable behavior.\n• Quality improves when the process is simplified and reviewed.\n• The best output usually comes from a clear system rather than a complex one.\n\nContent reviewed:\n${input}`
  },
  docQA: {
    title: 'Document Q&A',
    build: (input) => `Q: What was the most important outcome?\nA: The team improved completion rate by reducing friction in the onboarding flow.\n\nQ: What is the main recommendation?\nA: Keep the process simple, reduce clicks, and improve clarity at critical steps.\n\nContext:\n${input}`
  },
  tts: {
    title: 'Voice Prompt',
    build: (input) => `Voice script:\n"${input}"\n\nStyle: calm, confident, clear voice. Use a moderate pace, strong emphasis on key words, and a confident tone for a premium presentation.`
  },
  stt: {
    title: 'Transcript',
    build: (input) => `Transcript draft:\nWe reviewed the launch plan, agreed on a simple pricing model, and decided to keep the first release focused on a clear user problem. The priority is usability, momentum, and real feedback from early users.\n\nSource note:\n${input}`
  }
};

function setOutput(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
}

function bindGenerateButtons() {
  document.querySelectorAll('[data-ai-generate]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.aiGenerate;
      const targetId = `${type}Output`;
      const inputElement = document.getElementById(`${type}Input`) || document.querySelector('textarea[id$="Input"]');
      const text = (inputElement && inputElement.value) ? inputElement.value : 'Start with a clear prompt to generate a better result.';
      const template = aiToolTemplates[type];
      if (template) {
        setOutput(targetId, template.build(text));
      } else {
        setOutput(targetId, `Generated result for ${type}:\n${text}`);
      }
    });
  });
}

document.getElementById('aiResetAll')?.addEventListener('click', () => {
  document.querySelectorAll('.ai-output').forEach((node) => {
    node.textContent = 'Ready for your next output.';
  });
  document.querySelectorAll('textarea').forEach((textarea) => {
    textarea.value = '';
  });
});

bindGenerateButtons();

const requestedAiTool = new URLSearchParams(location.search).get('tool');
document.querySelectorAll('[data-ai-generate]').forEach((button) => {
  const panel = button.closest('.ai-tool-panel');
  if (panel && !panel.id) panel.id = `ai-tool-${button.dataset.aiGenerate}`;
});
if (requestedAiTool) {
  const target = [...document.querySelectorAll('[data-ai-generate]')]
    .find((button) => button.dataset.aiGenerate === requestedAiTool)?.closest('.ai-tool-panel');
  if (target) location.hash = target.id;
}
