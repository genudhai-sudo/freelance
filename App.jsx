import { useEffect, useMemo, useRef, useState } from 'react';
import './style.css';
import { getCurrentUser, requestPasswordReset, signIn, signOut, signUp, updatePassword } from './lib/auth.js';
import { createProject, getFreelancers, getMarketplaceStats, getMyProfile, getProjectProposals, getProjects, saveMyProfile, submitProposal } from './lib/marketplace.js';


/* ============ DATA (copy taken from the Figma frames) ============ */

const NAV_ITEMS = [
  { label: "Home", target: "top" },
  { label: "Find Freelancers", target: "freelancers" },
  { label: "Find Jobs", target: "projects" },
  { label: "How It Works", target: "how" },
  { label: "About Us", target: "about" },
];

const MASCOTS = [
  { step: "01 • DISCOVER", title: "Curated Match", text: "Pinpoint elite…", bg: "rgba(0,104,95,.1)", tagBg: "rgba(0,104,95,.1)", tagFg: "#00685f", emoji: "🔍" },
  { step: "02 • CREATE", title: "Precision Craft", text: "Bring technical roadmaps", bg: "rgba(254,166,25,.2)", tagBg: "#ffddb8", tagFg: "#2a1700", emoji: "🛠️" },
  { step: "03 • COLLABORATE", title: "Escrow Secured", text: "Zero friction contract…", bg: "rgba(201,230,255,.3)", tagBg: "#c9e6ff", tagFg: "#001e2f", emoji: "🤝" },
];

const HERO_SUGGESTIONS = ["Web Development", "Graphic Design", "Video Editing", "Content Writing"];
const HERO_POPULAR = ["Web Development", "Logo Design", "Graphic Design", "WordPress", "Video Editing"];

const CATEGORIES = [
  { title: "Web Development", motion: "web", desc: ["Build fast, modern and scalable", "websites."], count: "14,820", ico: "</>", tone: "teal", arrow: "#00685f" },
  { title: "Mobile App Development", motion: "mobile", desc: ["Native iOS and Android apps with", "sleek UX."], count: "8,940", ico: "📱", tone: "teal", arrow: "#00685f" },
  { title: "Graphic Design", motion: "graphic", desc: ["Brand identities, illustrations and", "visual systems."], count: "19,300", ico: "🎨", tone: "peach", arrow: "#855300" },
  { title: "UI/UX Design", motion: "ux", desc: ["User journeys, Figma design", "systems & prototypes."], count: "11,250", ico: "◈", tone: "sky", arrow: "#00628d" },
  { title: "Logo Design", motion: "logo", desc: ["Iconic marks and vector identity", "guidelines."], count: "15,600", ico: "✒️", tone: "peach", arrow: "#855300" },
  { title: "Video Editing", motion: "video", desc: ["Motion design, Reels, YouTube and", "commercial cuts."], count: "7,480", ico: "🎬", tone: "teal", arrow: "#00685f" },
  { title: "Content Writing", motion: "writing", desc: ["SEO articles, technical copy, and", "brand storytelling."], count: "13,100", ico: "📝", tone: "sky", arrow: "#00628d" },
  { title: "Digital Marketing", motion: "marketing", desc: ["Paid acquisition, social growth, and", "funnels."], count: "9,620", ico: "📣", tone: "peach", arrow: "#855300" },
  { title: "SEO & Optimization", motion: "seo", desc: ["Search engine visibility and organic", "traffic growth."], count: "6,850", ico: "📈", tone: "teal", arrow: "#00685f" },
  { title: "Data Entry & Analytics", motion: "analytics", desc: ["BI dashboards, spreadsheets, and", "data cleaning."], count: "8,100", ico: "📊", tone: "sky", arrow: "#00628d" },
  { title: "Photography & Retouching", motion: "photo", desc: ["Product imagery, studio portraits", "and color grading."], count: "5,230", ico: "📷", tone: "peach", arrow: "#855300" },
  { title: "Translation & Localization", motion: "translation", desc: ["Native multilingual translations in", "40+ languages."], count: "6,400", ico: "🌐", tone: "teal", arrow: "#00685f" },
];
const PROJECT_TEMPLATES = {
  web: ["Small business website", "SaaS landing page", "E-commerce storefront", "Creative portfolio", "Online booking website", "Website redesign", "Company blog", "Membership website", "Real estate listings", "Restaurant website"],
  mobile: ["Mobile app MVP", "E-commerce shopping app", "Appointment booking app", "Fitness tracker", "Community social app", "Food delivery app", "Personal finance app", "Online learning app", "Wellness and meditation app", "Mobile app redesign"],
  graphic: ["Complete brand identity", "Social media design kit", "Product packaging", "Investor pitch deck", "Event poster and graphics", "Business infographic", "Digital ad creative set", "Company brochure", "Presentation slide deck", "Custom editorial illustrations"],
  ux: ["Website UX audit", "User onboarding flow", "Mobile app wireframes", "Analytics dashboard UX", "E-commerce checkout redesign", "Reusable product design system", "Accessibility review", "Usability testing plan", "SaaS product interface", "Responsive website redesign"],
  logo: ["Startup logo design", "Custom wordmark", "Icon and brand mark", "Existing logo refresh", "Logo vector file package", "Brand mascot design", "Logo usage guidelines", "Sub-brand logo family", "Mobile app icon set", "Print-ready logo variations"],
  video: ["Short-form social media reels", "YouTube video editing", "Product promo video", "Corporate interview edit", "Event highlight video", "Podcast video edit", "Motion graphics package", "Short video ad campaign", "Online course lesson editing", "Color grading and sound polish"],
  writing: ["SEO blog article", "Website homepage copy", "Landing page copy", "E-commerce product descriptions", "Welcome email sequence", "Industry whitepaper", "Customer case study", "Technical documentation", "Weekly email newsletter", "Video script writing"],
  marketing: ["New product launch campaign", "Social media content calendar", "Paid search ad campaign", "Social ads campaign", "Email marketing campaign", "Lead generation funnel", "Influencer outreach plan", "Brand awareness campaign", "Marketing strategy and audit", "Campaign performance report"],
  seo: ["Technical SEO audit", "Keyword research plan", "On-page SEO optimization", "Local SEO setup", "SEO content brief set", "Link building campaign", "E-commerce SEO improvements", "Website speed and Core Web Vitals", "Search ranking recovery plan", "Monthly SEO reporting dashboard"],
  analytics: ["Business KPI dashboard", "Sales data analysis", "Spreadsheet cleanup and automation", "Customer behavior report", "Website analytics setup", "Market research data collection", "Financial forecasting spreadsheet", "Survey results analysis", "Data visualization report", "CRM data import and validation"],
  photo: ["E-commerce product photo retouching", "Portrait retouching", "Event photo editing", "Food photography editing", "Real estate photo enhancement", "Fashion photo color grading", "Background removal batch", "Product photo shoot plan", "Photo restoration", "Social media image package"],
  translation: ["Website translation", "Mobile app localization", "Business document translation", "E-commerce catalog translation", "Marketing campaign localization", "Video subtitle translation", "Technical manual translation", "Multilingual proofreading", "Software UI string translation", "Cross-language content review"],
};
const TONES = {
  teal: { bg: "rgba(0,104,95,.1)" },
  peach: { bg: "rgba(255,221,184,.7)" },
  sky: { bg: "#c9e6ff" },
};

const PROJECTS = [
  { tag: "React & Next.js", tagBg: "rgba(0,104,95,.1)", tagFg: "#00685f", time: "1 hour ago", title: ["Build a Modern SaaS Marketing & Web", "App"], desc: ["Looking for a senior frontend developer to convert", "Figma designs into an accessible, high-…"], skills: ["React", "Next.js", "Tailwind CSS"], budget: "$1,200 – $2,500", proposals: 18 },
  { tag: "Branding", tagBg: "#ffddb8", tagFg: "#2a1700", time: "3 hours ago", title: ["Rebrand & Complete Visual Identity", "System"], desc: ["Seeking an elite brand identity designer to build", "logo guidelines, typography scale, iconography,…"], skills: ["Figma", "Brand Guidelines", "Typography"], budget: "$800 – $1,500", proposals: 24 },
  { tag: "Mobile App", tagBg: "#c9e6ff", tagFg: "#001e2f", time: "5 hours ago", title: ["Native iOS & Android Fitness Tracker", "App"], desc: ["Cross-platform fitness application integration", "connecting with Apple HealthKit and Google Fit…"], skills: ["Flutter", "REST API", "HealthKit"], budget: "$3,000 – $5,500", proposals: 14 },
  { tag: "3D & Motion", tagBg: "#ffddb8", tagFg: "#2a1700", time: "2 hours ago", title: ["Product Explainer 3D Animation &", "Motion Video"], desc: ["Looking for a 60-second high-energy 3D product", "showcase animation highlighting hardware sensors"], skills: ["Blender", "After Effects", "Sound Design"], budget: "$900 – $1,800", proposals: 9 },
  { tag: "Copywriting", tagBg: "rgba(0,104,95,.1)", tagFg: "#00685f", time: "4 hours ago", title: ["High-Converting B2B Tech Content &", "Whitepaper"], desc: ["Write a 3,500-word authoritative cybersecurity", "whitepaper analyzing enterprise zero-trust…"], skills: ["SEO Copywriting", "Tech Writing", "Research"], budget: "$600 – $1,100", proposals: 11 },
  { tag: "E-Commerce", tagBg: "rgba(0,104,95,.1)", tagFg: "#00685f", time: "30 mins ago", title: ["E-Commerce Performance", "Optimization & Custom Checkout"], desc: ["Optimize core web vitals, speed score above 90,", "and build customized bundle checkout logic for a…"], skills: ["Shopify Plus", "Liquid", "JavaScript"], budget: "$1,500 – $3,000", proposals: 16 },
];

const FREELANCERS = [
  { name: "Alex Morgan", role: "Full Stack Developer", loc: "New York, USA", rating: 4.9, ratingText: "4.9", reviews: 124, rate: 45, skills: ["React", "Node.js", "TypeScript"], initials: "AM", grad: "linear-gradient(135deg,#00685f,#89f5e7)" },
  { name: "Sofia Chen", role: "Senior UI/UX & Design Systems", loc: "Toronto, Canada", rating: 5.0, ratingText: "5.0", reviews: 98, rate: 65, skills: ["Figma", "Design Systems", "Mobile UX"], initials: "SC", grad: "linear-gradient(135deg,#fea619,#ffddb8)" },
  { name: "Marcus Vance", role: "Brand Identity & 3D Artist", loc: "London, UK", rating: 4.95, ratingText: "4.95", reviews: 142, rate: 55, skills: ["Blender", "Logo Design", "Vector Art"], initials: "MV", grad: "linear-gradient(135deg,#00628d,#c9e6ff)" },
  { name: "Amara Patel", role: "Mobile Engineer (Flutter & Swift)", loc: "Bengaluru, India", rating: 4.88, ratingText: "4.88", reviews: 87, rate: 40, skills: ["Flutter", "Swift", "Firebase"], initials: "AP", grad: "linear-gradient(135deg,#855300,#fea619)" },
  { name: "Lucas Ribeiro", role: "Motion Designer & Video Editor", loc: "São Paulo, Brazil", rating: 4.97, ratingText: "4.97", reviews: 110, rate: 50, skills: ["After Effects", "Premiere Pro", "3D Motion"], initials: "LR", grad: "linear-gradient(135deg,#008378,#89f5e7)" },
  { name: "Elena Rostova", role: "Technical Writer & SEO Strategist", loc: "Berlin, Germany", rating: 4.92, ratingText: "4.92", reviews: 76, rate: 48, skills: ["Content Strategy", "SEO", "Ghostwriting"], initials: "ER", grad: "linear-gradient(135deg,#283044,#bcc9c6)" },
];

const BENEFITS = [
  { ico: "🧑‍💻", tone: "teal", title: "Public Profiles", text: ["Browse freelancer skills, locations,", "professional headlines, and hourly", "rates in one directory."] },
  { ico: "📋", tone: "peach", title: "Clear Project Briefs", text: ["Review a client's description,", "category, skills, and budget before", "sending a proposal."] },
  { ico: "↗", tone: "sky", title: "Proposal Tracking", text: ["Submit a message and bid. The", "proposal is saved with the project", "and counted in its listing."] },
  { ico: "💾", tone: "teal", title: "Local Data", text: ["Your account and marketplace", "records are stored in SQLite on", "this computer."] },
];

const FLOW_CLIENT = [
  { n: "01", title: "Post Your Project", text: ["Describe the work, choose a", "category, list the skills you need,", "and set a project budget."], foot: "Saved to the open board", footFg: "#00685f", bg: "rgba(0,104,95,.1)", fg: "#00685f", icon: "⏱" },
  { n: "02", title: "Review Freelancer Profiles", text: ["Compare published skills, hourly", "rates, and experience in the", "freelancer directory."], foot: "Browse public profiles", footFg: "#00685f", bg: "rgba(0,104,95,.1)", fg: "#00685f", icon: "⚲" },
  { n: "03", title: "Review Proposals", text: ["Freelancers send a project-specific", "message and bid. Proposal counts", "update on the listing."], foot: "Saved with the project", footFg: "#00685f", bg: "rgba(0,104,95,.1)", fg: "#00685f", icon: "↗" },
  { n: "04", title: "Agree on the Work", text: ["Discuss scope, delivery, and terms", "directly with your freelancer", "before starting the work."], foot: "Coordinate directly", footFg: "#855300", bg: "#ffddb8", fg: "#2a1700", icon: "🤝" },
];

const FLOW_FREELANCER = [
  { n: "01", title: "Build Your Profile", text: ["Add your professional headline,", "skills, location, and hourly rate", "so clients can review your", "experience."], foot: "Saved to your profile", footFg: "#00685f", bg: "rgba(0,104,95,.1)", fg: "#00685f", icon: "✦" },
  { n: "02", title: "Browse Open Projects", text: ["Review project descriptions,", "budgets, categories, and the skills", "clients are looking for before", "you apply."], foot: "Open project board", footFg: "#00685f", bg: "rgba(0,104,95,.1)", fg: "#00685f", icon: "⌕" },
  { n: "03", title: "Send a Proposal", text: ["Write a short project-specific", "message and your bid. Your", "proposal is saved for the project", "owner to review."], foot: "One proposal per project", footFg: "#00685f", bg: "rgba(0,104,95,.1)", fg: "#00685f", icon: "↗" },
  { n: "04", title: "Work With the Client", text: ["Discuss the scope and delivery", "directly with the client. Agree on", "the work and payment terms", "before starting."], foot: "Coordinate directly", footFg: "#855300", bg: "#ffddb8", fg: "#2a1700", icon: "🤝" },
];

const STATS = [
  { key: "members", label: "Member Accounts", color: "#89f5e7" },
  { key: "openProjects", label: "Open Projects", color: "#ffddb8" },
  { key: "freelancerProfiles", label: "Freelancer Profiles", color: "#c9e6ff" },
  { key: "proposals", label: "Proposals Sent", color: "#6bd8cb" },
];

const ABOUT_LINES = [
  "KipTalent brings clients and independent professionals together through public freelancer profiles, clear project briefs, and proposals. In this local preview, account and marketplace data is saved on your computer.",
];
const ABOUT_BULLETS = [
  { t: "Freelancer Profiles", d: "Browse public profiles with professional skills, location, and hourly rates." },
  { t: "Project Proposals", d: "Clients publish a scope and budget; freelancers can send a message and bid." },
  { t: "Local Marketplace Data", d: "Profiles, project posts, and proposals are stored in the local SQLite database." },
];

const FOOTER_COLS = [
  { title: "For Clients", links: ["Find Freelancers", "Post a Project", "Enterprise Solutions", "Project Catalog", "Escrow Protection", "Talent Scout"] },
  { title: "For Freelancers", links: ["Find Projects", "Create Profile", "Submit Proposals", "Skill Assessments", "Community Forum", "Freelancer Guides"] },
  { title: "Company", links: ["About KipTalent", "Careers", "Press & Media", "Trust & Safety", "Terms of Service", "Privacy Policy"] },
  { title: "Resources", links: ["Help Center", "Blog & Articles", "Freelance Calculator", "Success Stories", "Developer API", "Status"] },
];
const SOCIAL = [
  { label: "Workplace Network", ico: "💼" },
  { label: "Global Broadcast", ico: "📡" },
  { label: "Media Gallery", ico: "🖼" },
  { label: "Community Circle", ico: "👥" },
  { label: "Video Hub", ico: "▶" },
  { label: "Code Repository", ico: "⌘" },
];

/* ============ HELPERS ============ */

function scrollToTarget(id) {
  if (id === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ============ COMPONENTS ============ */

function Header({ activeNav, onNav, onAuth, onPostProject, onProfile, currentUser, authReady, onSignOut }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (item) => {
    onNav(item.target);
    setOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); go(NAV_ITEMS[0]); }} aria-label="CODE IO home">CODE IO</a>

        <nav className="nav" aria-label="Primary">
          {NAV_ITEMS.map(item => (
            <a
              key={item.label}
              href={"#" + item.target}
              className={activeNav === item.target ? "active" : ""}
              aria-current={activeNav === item.target ? "page" : undefined}
              onClick={(e) => { e.preventDefault(); go(item); }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          {authReady && (currentUser
            ? <button className="outline-btn desk" onClick={onSignOut}>Sign out</button>
            : <button className="outline-btn desk" onClick={() => onAuth("signup")}>Sign Up</button>)}
          <a className="outline-btn desk workspace-preview-link" href="/marketplace-preview.html">Workspace Preview</a>
          <button className="solid-btn desk" onClick={onPostProject}>Post a Project</button>
          <button className="avatar-sm" aria-label={currentUser ? `Edit profile for ${currentUser.fullName}` : "Open profile menu"} onClick={onProfile}>{currentUser?.fullName?.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || "AM"}</button>
          <button
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(o => !o)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={"mobile-nav" + (open ? " open" : "")}>
        {NAV_ITEMS.map(item => (
          <a key={item.label} href={"#" + item.target} onClick={(e) => { e.preventDefault(); go(item); }}>{item.label}</a>
        ))}
        <a href="/marketplace-preview.html" onClick={() => setOpen(false)}>Marketplace Workspace Preview</a>
        {authReady && (currentUser
          ? <><button onClick={() => { setOpen(false); onProfile(); }}>My Freelancer Profile</button><button onClick={() => { setOpen(false); onSignOut(); }}>Sign out</button></>
          : <button onClick={() => { setOpen(false); onAuth("signup"); }}>Sign Up</button>)}
        <button onClick={() => { setOpen(false); onPostProject(); }}>Post a Project</button>
      </div>
    </header>
  );
}

function MascotCard({ m, offset }) {
  return (
    <div className={"mascot" + (offset ? " offset" : "")}>
      <div className="mascot-thumb" style={{ background: m.bg }} aria-hidden="true">{m.emoji}</div>
      <div style={{ minWidth: 0 }}>
        <span className="pill" style={{ background: m.tagBg, color: m.tagFg }}>{m.step}</span>
        <div className="mascot-title">{m.title}</div>
        <div className="mascot-sub">{m.text}</div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero hero-video-landing" id="top" aria-label="KipTalent landing video">
      <video className="hero-background-video" autoPlay loop muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1}>
        <source src="/videos/kiptalent-landing.mp4" type="video/mp4" />
      </video>
      <span className="hero-video-shade" aria-hidden="true" />
    </section>
  );
}
function CategoryAnimation({ motion }) {
  if (motion === "web") return <div className="anim-browser"><div className="anim-browser-bar"><i /><i /><i /><span>your-next-project.dev</span></div><div className="anim-code"><b>&lt;build</b><i /><i /><i /><b>/&gt;</b></div><span className="anim-code-cursor" /></div>;
  if (motion === "mobile") return <div className="anim-phone"><div className="anim-phone-camera" /><div className="anim-app-mark">✦</div><div className="anim-app-lines"><i /><i /><i /></div><div className="anim-app-nav"><b /><b /><b /></div><span className="anim-phone-pop">App ready ✓</span></div>;
  if (motion === "graphic") return <div className="anim-design-board"><span className="anim-orb orb-one" /><span className="anim-orb orb-two" /><span className="anim-orb orb-three" /><span className="anim-design-spark">✦</span><div className="anim-palette"><i /><i /><i /><i /><i /></div></div>;
  if (motion === "ux") return <div className="anim-wireframe"><div className="anim-wire-top"><i /><i /><i /></div><div className="anim-wire-hero"><i /><b /><em /></div><div className="anim-wire-cards"><i /><i /><i /></div><span className="anim-pointer">↖</span></div>;
  if (motion === "logo") return <div className="anim-logo-stage"><span className="anim-logo-halo" /><span className="anim-logo-glyph">K</span><i className="anim-logo-spark">✦</i><i className="anim-logo-dot" /></div>;
  if (motion === "video") return <div className="anim-video-editor"><div className="anim-video-preview"><span className="anim-video-sun" /><span className="anim-video-mountain mountain-a" /><span className="anim-video-mountain mountain-b" /><span className="anim-video-play">▶</span><span className="anim-video-time">00:14 / 01:28</span></div><div className="anim-timeline"><div className="anim-track"><i /><i /><i /></div><div className="anim-track secondary"><i /><i /></div><span className="anim-playhead" /></div></div>;
  if (motion === "writing") return <div className="anim-writing-page"><span className="anim-writing-title" /><span /><span /><span className="short" /><span /><span className="medium" /><i className="anim-writing-caret" /><div className="anim-writing-tag">Story in progress</div></div>;
  if (motion === "marketing") return <div className="anim-marketing-stage"><span className="anim-megaphone">📣</span><div className="anim-market-bars"><i /><i /><i /><i /><i /></div><span className="anim-market-bubble">+28%</span></div>;
  if (motion === "seo") return <div className="anim-seo-stage"><div className="anim-search-ring"><i /></div><div className="anim-seo-chart"><i /><i /><i /><i /><i /><span>↗</span></div><span className="anim-seo-chip">#1 ranking</span></div>;
  if (motion === "analytics") return <div className="anim-analytics-stage"><div className="anim-analytics-bars"><i /><i /><i /><i /><i /><i /></div><div className="anim-analytics-pie"><i /></div><span className="anim-analytics-label">+42.8%</span></div>;
  if (motion === "photo") return <div className="anim-camera-stage"><span className="anim-camera-flash" /><div className="anim-camera"><i /><b /></div><span className="anim-photo-spark spark-a">✦</span><span className="anim-photo-spark spark-b">✦</span></div>;
  return <div className="anim-translation-stage"><div className="anim-globe"><i /><b /><span /></div><span className="anim-language lang-a">A</span><span className="anim-language lang-b">あ</span><span className="anim-language lang-c">文</span><span className="anim-language lang-d">Hola!</span></div>;
}

function TemplateTopicArt({ category, title, index }) {
  const motion = category.motion;
  const variation = `topic-art-variation-${index % 10}`;
  if (motion === "video") return <div className={`template-site-art template-topic-art topic-art-video ${variation}`}><div className="topic-video-scene"><span className="topic-video-sun" /><span className="topic-video-mountain" /><b>{["▶", "▶", "▶", "●", "▶"][index % 5]}</b><small>{["REELS", "CREATOR", "PROMO", "INTERVIEW", "TRAVEL"][index % 5]}</small><i className="topic-video-extra" /></div><div className="topic-video-timeline"><i /><i /><i /></div></div>;
  if (motion === "photo") return <div className={`template-site-art template-topic-art topic-art-photo ${variation}`}><div className="topic-photo-scene"><span /><i /><b /><em>{["STUDIO", "NATURE", "PRODUCT", "PORTRAIT", "TRAVEL"][index % 5]}</em></div></div>;
  if (motion === "mobile") return <div className={`template-site-art template-topic-art topic-art-mobile ${variation}`}><div className="topic-phone"><i /><b>{["✦", "◉", "↗", "♥", "☼"][index % 5]}</b><span /><span /><em /></div><div className="topic-phone-note">{["New activity", "Your next trip", "Order confirmed", "Daily progress", "Good morning"][index % 5]}</div></div>;
  if (motion === "graphic" || motion === "logo") return <div className={`template-site-art template-topic-art topic-art-brand topic-brand-${index % 3} ${variation}`}><span className="topic-brand-orb" /><span className="topic-brand-shape" /><b>{motion === "logo" ? ["A", "N", "✦", "M", "S"][index % 5] : ["COLOR", "STUDIO", "FORM", "PLAY", "FRESH"][index % 5]}</b><small>{title.toUpperCase()}</small></div>;
  if (["analytics", "seo", "marketing"].includes(motion)) return <div className={`template-site-art template-topic-art topic-art-chart topic-chart-${motion} ${variation}`}><div className="topic-chart-head"><b>{motion === "seo" ? "SEARCH GROWTH" : motion === "marketing" ? "CAMPAIGN" : "OVERVIEW"}</b><i>↗</i></div><div className="topic-chart-grid"><span /><span /><span /><span /><span /><span /><em /></div><div className="topic-chart-legend"><i /><i /><i /></div></div>;
  if (motion === "writing" || motion === "translation") return <div className={`template-site-art template-topic-art topic-art-document topic-document-${motion} ${variation}`}><div className="topic-doc-sheet"><b>{motion === "translation" ? ["Hola!", "こんにちは", "Bonjour", "नमस्ते", "مرحبا"][index % 5] : ["The creative brief", "A better story", "Ideas that work", "The weekly edit", "A fresh perspective"][index % 5]}</b><i /><i /><i /><span>{motion === "translation" ? "EN  →  世界" : "By KipTalent  ·  5 min read"}</span></div><div className="topic-doc-mark">{motion === "translation" ? ["文", "あ", "ع", "क", "ñ"][index % 5] : ["Aa", "✎", "¶", "✦", "…"][index % 5]}</div></div>;
  if (motion === "ux") return <div className={`template-site-art template-topic-art topic-art-ux ${variation}`}><div className="topic-ux-sidebar"><i /><i /><i /><i /></div><div className="topic-ux-canvas"><b /><span /><span /><em /><i /></div><div className="topic-ux-cursor">↖</div></div>;
  return <div className={`template-site-art template-topic-art topic-art-web ${variation}`}><div className="topic-web-window"><span /><span /><span /><div className="topic-web-content"><div className="topic-web-copy"><small>{["DESIGN STUDIO", "MADE FOR YOU", "DISCOVER MORE", "SIMPLE. BETTER.", "BUILT TO GROW"][index % 5]}</small><b>{title}</b><i /><i /><em>Explore</em></div><div className="topic-web-visual"><i /><b>{["✦", "◈", "A", "▤", "↗"][index % 5]}</b></div></div></div><div className="topic-web-badge">{index % 2 ? "LIVE" : "BUILD"}</div></div>;
}

function TemplateThumbnail({ category, title, index }) {
  return (
    <div className={`template-thumb template-style-${index % 5}`} style={{ "--template-accent": category.arrow, "--template-tint": TONES[category.tone].bg }} aria-hidden="true">
      <TemplateTopicArt category={category} title={title} index={index} />
      <span className="template-art-number">{String(index + 1).padStart(2, "0")}</span>
    </div>
  );
}

function CategoryPreview({ category, onClose, onUseTemplate }) {
  const [activeTab, setActiveTab] = useState("Trending");
  const [priceFilter, setPriceFilter] = useState("all");
  const templates = useMemo(() => {
    const items = (PROJECT_TEMPLATES[category.motion] || []).map((title, index) => ({ title, index }));
    if (activeTab === 'Recent') items.reverse();
    if (activeTab === 'Best') {
      const featuredOrder = [2, 0, 3, 5, 1, 4, 6, 7, 8, 9];
      items.sort((a, b) => featuredOrder.indexOf(a.index) - featuredOrder.indexOf(b.index));
    }
    return items;
  }, [category.motion, activeTab]);
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="category-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`category-modal template-gallery-modal motion-${category.motion}`} role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <button className="category-modal-close" type="button" aria-label="Close website templates" onClick={onClose}>×</button>
        <header className="template-gallery-head">
          <span className="kicker">{PROJECT_TEMPLATES[category.motion]?.length || 0} WEBSITE TEMPLATES</span>
          <h2 id="category-modal-title">{category.title}</h2>
          <p>Choose a website design to preview for your {category.title.toLowerCase()} project.</p>
        </header>
        <div className="template-market-toolbar">
          <div className="template-market-tabs" role="tablist" aria-label="Template collections">
            {["Trending", "Best", "Recent"].map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>
          <label className="template-price-filter"><span>Price</span><select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)} aria-label="Filter templates by price"><option value="all">All</option><option value="free">Free</option></select><span aria-hidden="true">⌄</span></label>
        </div>
        <div className="template-gallery-grid">
          {templates.map(({ title, index }) => (
            <article className="website-template-card" key={title} style={{ "--card-order": index }}>
              <TemplateThumbnail category={category} title={title} index={index} />
              <div className="website-template-copy">
                <div className="template-meta-text"><h3>{title}</h3><p>KipTalent</p></div>
                <button type="button" className="template-use-button" onClick={() => onUseTemplate({ title, category: category.title })}>Use template →</button>
              </div>
            </article>
          ))}
        </div>
        <div className="category-modal-count"><strong>{category.count}</strong><span>freelancers ready to help</span></div>
      </section>
    </div>
  );
}

function Categories({ query, onToast, onUseTemplate, onClearSearch }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const trackRef = useRef(null);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(c =>
      c.title.toLowerCase().includes(q) || c.desc.join(" ").toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section id="categories" className="section section-tint category-marketplace" aria-labelledby="cat-title">
      <div className="container">
        <div className="head-row">
          <div className="head-left">
            <span className="kicker">Marketplace specialties</span>
            <h2 id="cat-title" className="title-36">Explore Top Freelance Services</h2>
            <p className="sub-16">Find skilled professionals across hundreds of creative and technical categories.</p>
          </div>
          <div className="category-carousel-actions">
            <button className="link-teal" onClick={() => { onClearSearch(); setActiveCategory(null); trackRef.current?.scrollTo({ left: trackRef.current.scrollWidth, behavior: 'smooth' }); }}>Browse all 12 Services →</button>
          </div>
        </div>

        <div className="service-carousel-wrap">
        <div id="category-grid" className="service-poster-track" ref={trackRef}>
          {shown.length === 0 && (
            <div className="empty">No categories match “{query}”. Try another search from the hero.</div>
          )}
          {shown.map((c, index) => (
            <button key={c.title} className="service-poster-card" style={{ "--service-order": index }} onClick={() => setActiveCategory(c)} aria-haspopup="dialog">
              <span className="service-poster-title">{c.title}</span>
              <div className={`service-poster-art service-poster-${c.motion}`} style={{ "--template-accent": c.arrow, "--template-tint": TONES[c.tone].bg }} aria-hidden="true">
                <TemplateTopicArt category={c} title={PROJECT_TEMPLATES[c.motion]?.[CATEGORIES.indexOf(c) % 10] || c.title} index={CATEGORIES.indexOf(c)} />
                <span className="service-poster-art-label">{c.title.toUpperCase()}</span>
              </div>
              <div className="service-poster-foot">
                <span>{c.count} freelancers</span>
                <span aria-hidden="true">Explore templates ↗</span>
              </div>
            </button>
          ))}
        </div>
        <button className="service-carousel-next" type="button" aria-label="Show more freelance services" onClick={() => trackRef.current?.scrollBy({ left: trackRef.current.clientWidth * 0.78, behavior: 'smooth' })}>›</button>
        <button className="service-carousel-prev" type="button" aria-label="Show previous freelance services" onClick={() => trackRef.current?.scrollBy({ left: -trackRef.current.clientWidth * 0.78, behavior: 'smooth' })}>‹</button>
        </div>
      </div>
      {activeCategory && <CategoryPreview category={activeCategory} onClose={() => setActiveCategory(null)} onUseTemplate={(template) => { setActiveCategory(null); onUseTemplate(template); }} />}
    </section>
  );
}

function ProjectDialog({ mode, project, onClose, onCreated, onToast, initialTemplate }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = new FormData(event.currentTarget);
    try {
      if (mode === 'create') {
        const created = await createProject({
          title: values.get('title'), category: values.get('category'),
          description: values.get('description'), budget: values.get('budget'),
          skills: String(values.get('skills') || '').split(',').map((item) => item.trim()).filter(Boolean),
        });
        onCreated(created);
        onToast('Project posted and saved to your local SQLite database.');
      } else {
        await submitProposal(project.id, { coverLetter: values.get('coverLetter'), bidAmount: values.get('bidAmount') });
        onCreated(project.id);
        onToast('Your proposal has been submitted.');
      }
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [busy, onClose]);

  return <div className="project-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title">
      <button type="button" className="project-dialog-close" onClick={onClose} aria-label="Close">×</button>
      <span className="kicker">{mode === 'create' ? 'CLIENT WORKSPACE' : project.category}</span>
      <h2 id="project-dialog-title">{mode === 'create' ? 'Post a project' : `Send a proposal`}</h2>
      {mode === 'proposal' && <p className="project-dialog-context">{project.title}</p>}
      <form className="project-dialog-form" onSubmit={submit}>
        {mode === 'create' ? <>
          <label>Project title<input name="title" minLength="5" maxLength="120" defaultValue={initialTemplate?.title || ''} placeholder="e.g. Build a booking website" required /></label>
          <label>Category<select name="category" defaultValue={initialTemplate?.category || 'Web Development'} required>{CATEGORIES.map((item) => <option key={item.title}>{item.title}</option>)}</select></label>
          <label>Description<textarea name="description" minLength="20" maxLength="5000" rows="4" defaultValue={initialTemplate ? `I need a ${initialTemplate.title} for my ${initialTemplate.category} project. Please customize the layout, content, and deliverables for my business.` : ''} placeholder="Describe the work, goals, and expected deliverables" required /></label>
          <label>Budget (USD)<input name="budget" type="number" min="1" step="1" placeholder="1200" required /></label>
          <label>Skills, separated by commas<input name="skills" maxLength="300" placeholder="React, Figma, API integration" /></label>
        </> : <>
          <label>Proposal message<textarea name="coverLetter" minLength="20" maxLength="3000" rows="5" placeholder="Explain how you would deliver this project" required /></label>
          <label>Your bid (USD)<input name="bidAmount" type="number" min="1" step="1" placeholder={String(project.budget)} required /></label>
        </>}
        {error && <p className="project-dialog-error" role="alert">{error}</p>}
        <div className="project-dialog-actions"><button type="button" className="outline-btn" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="solid-btn" disabled={busy}>{busy ? 'Saving…' : mode === 'create' ? 'Publish project' : 'Submit proposal'}</button></div>
      </form>
    </section>
  </div>;
}

function ProfileDialog({ onClose, onToast, onSaved }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMyProfile().then(({ profile: saved }) => { if (active) setProfile(saved || {}); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { active = false; window.removeEventListener('keydown', closeOnEscape); };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = new FormData(event.currentTarget);
    try {
      const result = await saveMyProfile({
        headline: values.get('headline'), bio: values.get('bio'), location: values.get('location'),
        hourlyRate: values.get('hourlyRate'),
        skills: String(values.get('skills') || '').split(',').map((skill) => skill.trim()).filter(Boolean),
      });
      onSaved();
      onToast('Freelancer profile saved. It is now visible in the directory.');
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="project-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
      <button type="button" className="project-dialog-close" onClick={onClose} aria-label="Close">×</button>
      <span className="kicker">FREELANCER PROFILE</span>
      <h2 id="profile-dialog-title">Your public profile</h2>
      <p className="project-dialog-context">Add your skills and hourly rate so clients can find you.</p>
      {loading ? <p>Loading profile…</p> : <form className="project-dialog-form" onSubmit={submit}>
        <label>Professional headline<input name="headline" minLength="3" maxLength="100" defaultValue={profile?.headline || ''} placeholder="e.g. Full stack web developer" required /></label>
        <label>About you<textarea name="bio" minLength="20" maxLength="2000" rows="4" defaultValue={profile?.bio || ''} placeholder="Your experience, strengths, and the work you do" required /></label>
        <label>Location<input name="location" maxLength="100" defaultValue={profile?.location || ''} placeholder="City, country" /></label>
        <label>Hourly rate (USD)<input name="hourlyRate" type="number" min="1" max="100000" step="1" defaultValue={profile?.hourlyRate || ''} placeholder="35" required /></label>
        <label>Skills, separated by commas<input name="skills" maxLength="500" defaultValue={profile?.skills?.join(', ') || ''} placeholder="React, Node.js, UI design" required /></label>
        {error && <p className="project-dialog-error" role="alert">{error}</p>}
        <div className="project-dialog-actions"><button type="button" className="outline-btn" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="solid-btn" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
      </form>}
    </section>
  </div>;
}

function ProposalsDialog({ project, onClose }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getProjectProposals(project.id).then((items) => { if (active) setProposals(items); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { active = false; window.removeEventListener('keydown', closeOnEscape); };
  }, [project.id]);

  return <div className="project-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="project-dialog proposals-dialog" role="dialog" aria-modal="true" aria-labelledby="proposals-title">
      <button type="button" className="project-dialog-close" onClick={onClose} aria-label="Close">×</button>
      <span className="kicker">CLIENT WORKSPACE</span>
      <h2 id="proposals-title">Project proposals</h2>
      <p className="project-dialog-context">{project.title} · {proposals.length} proposal{proposals.length === 1 ? '' : 's'}</p>
      {loading ? <p>Loading proposals…</p> : error ? <p className="project-dialog-error" role="alert">{error}</p> : proposals.length === 0 ? <p className="project-empty-state">No proposals yet. Freelancers can find this project in the open project board.</p> : <div className="proposal-list">
        {proposals.map((proposal) => <article className="proposal-item" key={proposal.id}>
          <div className="proposal-item-head"><div><h3>{proposal.freelancerName}</h3><p>{proposal.headline || 'Freelancer'}{proposal.location ? ` · ${proposal.location}` : ''}</p></div><strong>${Number(proposal.bidAmount).toLocaleString()}</strong></div>
          <p className="proposal-message">{proposal.coverLetter}</p>
          <div className="tags">{proposal.skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div>
        </article>)}
      </div>}
      <div className="project-dialog-actions"><button type="button" className="solid-btn" onClick={onClose}>Done</button></div>
    </section>
  </div>;
}

function Projects({ onToast, currentUser, onRequireAuth, postProjectOpen, onClosePostProject, projectTemplate, pendingProposalProject, onResumeProposal }) {
  const [savedProjects, setSavedProjects] = useState([]);
  const [proposalProject, setProposalProject] = useState(null);
  const [proposalsProject, setProposalsProject] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    getProjects().then((items) => { if (active) setSavedProjects(items); }).catch((error) => { if (active) setLoadError(error.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!pendingProposalProject) return;
    setProposalProject(pendingProposalProject);
    onResumeProposal();
  }, [pendingProposalProject]);

  const projectCards = [
    ...savedProjects.map((p) => ({
      ...p, dynamic: true, displayTitle: p.title, displayDesc: p.description,
      tag: p.source === 'featured' ? `Featured · ${p.category}` : p.category, tagBg: 'rgba(0,104,95,.1)', tagFg: '#00685f',
      time: new Date(p.created_at || Date.now()).toLocaleDateString(),
      title: [p.title], desc: [p.description], budget: `$${Number(p.budget).toLocaleString()}`,
      proposals: p.proposals || 0, skills: p.skills || [],
    })),
  ];

  const startProposal = (project) => {
    if (!currentUser) return onRequireAuth(project);
    setProposalProject(project);
  };

  return (
    <section id="projects" className="section section-wide" aria-labelledby="proj-title">
      <div className="container">
        <div className="head-row">
          <div className="head-left">
            <span className="kicker peach">Active job board</span>
            <h2 id="proj-title" className="title-36">Popular Projects</h2>
            <p className="sub-16">Discover projects from clients looking for talented professionals.</p>
          </div>
          <button className="link-teal" onClick={() => document.getElementById('project-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Browse All Open Gigs →</button>
        </div>

        {loadError && <p className="project-load-error" role="status">Saved projects could not load: {loadError}</p>}

        <div id="project-list" className="proj-grid">
          {projectCards.map((p, index) => (
            <article key={p.id || p.title[0] + index} className="card">
              <div>
                <div className="card-top">
                  <span className="tag lg" style={{ background: p.tagBg, color: p.tagFg, fontWeight: 600 }}>{p.tag}</span>
                  <span className="timestamp">{p.dynamic ? `Posted ${p.time}` : p.time}</span>
                </div>
                <h3 className="card-title" style={{ marginTop: 8 }}>{p.displayTitle}</h3>
                <p className="card-desc" style={{ marginTop: 8 }}>{p.displayDesc}</p>
                <div className="tags" style={{ marginTop: 12 }}>
                  {p.skills.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              </div>
              <div>
                <div className="budget-row">
                  <span className="budget">Budget: <b>{p.budget}</b></span>
                  <span className="proposals">📄 {p.proposals} proposals</span>
                </div>
                <button className="btn-wide" style={{ marginTop: 12 }} onClick={() => p.is_owner ? setProposalsProject(p) : startProposal(p)}>
                  {p.is_owner ? `View Proposals (${p.proposals})` : 'View Project & Submit Proposal ↗'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      {postProjectOpen && <ProjectDialog mode="create" initialTemplate={projectTemplate} onClose={onClosePostProject} onCreated={(project) => setSavedProjects((items) => [project, ...items])} onToast={onToast} />}
      {proposalProject && <ProjectDialog mode="proposal" project={proposalProject} onClose={() => setProposalProject(null)} onCreated={(projectId) => setSavedProjects((items) => items.map((item) => item.id === projectId ? { ...item, proposals: (item.proposals || 0) + 1 } : item))} onToast={onToast} />}
      {proposalsProject && <ProposalsDialog project={proposalsProject} onClose={() => setProposalsProject(null)} />}
    </section>
  );
}

function Freelancers({ onToast, refreshKey }) {
  const [filter, setFilter] = useState("all");
  const [savedFreelancers, setSavedFreelancers] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    let active = true;
    getFreelancers().then((items) => {
      if (!active) return;
      setSavedFreelancers(items.map((item, index) => ({
        ...item, isSavedProfile: true, rating: 0, ratingText: 'New', reviews: 0,
        grad: ['linear-gradient(135deg,#00685f,#89f5e7)', 'linear-gradient(135deg,#fea619,#ffddb8)', 'linear-gradient(135deg,#00628d,#c9e6ff)'][index % 3],
        initials: item.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
      })));
    }).catch(() => { if (active) setSavedFreelancers([]); });
    return () => { active = false; };
  }, [refreshKey]);

  const list = useMemo(() => {
    const combined = [...savedFreelancers];
    if (filter === "rate") return combined.sort((a, b) => b.rate - a.rate);
    return combined;
  }, [filter, savedFreelancers]);

  return (
    <section id="freelancers" className="section" aria-labelledby="free-title">
      <div className="container">
        <div className="head-row">
          <div className="head-left">
            <span className="kicker">Top talent pool</span>
            <h2 id="free-title" className="title-36">Top Freelancers</h2>
            <p className="sub-16">Meet highly rated professionals ready to work on your next project.</p>
          </div>
          <div className="seg" role="group" aria-label="Filter freelancers">
            <button className={filter === "all" ? "on" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All Profiles</button>
            <button className={filter === "rate" ? "on" : ""} aria-pressed={filter === "rate"} onClick={() => setFilter("rate")}>Highest Rate</button>
          </div>
        </div>

        <div id="freelancer-list" className="free-grid">
          {list.map(f => (
            <article key={f.name} className="free-card">
              <div>
                <div className="free-top">
                  <div className="avatar lg" style={{ background: f.grad }} aria-hidden="true">{f.initials}<span className="online" /></div>
                  <span className="rating">{f.ratingText === 'New' ? 'New profile' : `★ ${f.ratingText} (${f.reviews})`}</span>
                </div>
                <div className="free-name" style={{ marginTop: 14 }}>{f.name}</div>
                <div className="free-role">{f.role}</div>
                <div className="free-loc">📍 {f.loc}</div>
                <div className="tags" style={{ marginTop: 14 }}>
                  {f.skills.map(s => <span key={s} className="tag lg">{s}</span>)}
                </div>
              </div>
              <div className="free-foot">
                <div className="rate">${f.rate}<span>/ hr</span></div>
                <button className="view-btn" onClick={() => setSelectedProfile(f)}>View Profile →</button>
              </div>
            </article>
          ))}
        </div>

        <div className="view-all-wrap">
          <button className="btn-pale" onClick={() => document.getElementById('freelancer-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>View All Freelancers →</button>
        </div>
      </div>
      {selectedProfile && <div className="project-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProfile(null); }}>
        <section className="project-dialog freelancer-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="freelancer-profile-title">
          <button type="button" className="project-dialog-close" onClick={() => setSelectedProfile(null)} aria-label="Close">×</button>
          <div className="avatar lg" style={{ background: selectedProfile.grad }} aria-hidden="true">{selectedProfile.initials}</div>
          <span className="kicker">FREELANCER PROFILE</span>
          <h2 id="freelancer-profile-title">{selectedProfile.name}</h2>
          <p className="project-dialog-context">{selectedProfile.role} · {selectedProfile.location || selectedProfile.loc}</p>
          <p className="freelancer-profile-bio">{selectedProfile.bio}</p>
          <div className="tags">{selectedProfile.skills.map((skill) => <span className="tag lg" key={skill}>{skill}</span>)}</div>
          <div className="freelancer-profile-rate">${selectedProfile.rate} <span>/ hour</span></div>
        </section>
      </div>}
    </section>
  );
}

function Benefits() {
  return (
    <section id="trust" className="section section-tint" aria-labelledby="trust-title">
      <div className="container">
        <div className="center-head">
          <span className="kicker" style={{ alignSelf: "center" }}>Security &amp; excellence</span>
          <h2 id="trust-title" className="title-36">Built for Better Freelancing</h2>
          <p className="sub-16">Everything you need to work and collaborate with confidence.</p>
        </div>
        <div className="ben-grid">
          {BENEFITS.map(b => (
            <article key={b.title} className="ben">
              <div className="ben-ico" style={{ background: TONES[b.tone].bg }} aria-hidden="true">{b.ico}</div>
              <h3 className="ben-title">{b.title}</h3>
              <p className="ben-text">{b.text.map((line, i) => <span key={i} style={{ display: "block" }}>{line}</span>)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const [role, setRole] = useState("hiring");
  return (
    <section id="how" className="section" aria-labelledby="how-title">
      <div className="container">
        <div className="center-head" style={{ marginBottom: 0 }}>
          <span className="kicker" style={{ alignSelf: "center" }}>Clear &amp; frictionless</span>
          <h2 id="how-title" className="title-36">How Freelancing Works</h2>
          <p className="sub-16">Whether you are hiring top talent or taking on projects, our transparent system protects both sides.</p>
          <div className="switch" role="tablist" aria-label="Choose your role">
            <button role="tab" aria-selected={role === "hiring"} className={role === "hiring" ? "on" : ""} onClick={() => setRole("hiring")}>I'm Hiring</button>
            <button role="tab" aria-selected={role === "freelancing"} className={role === "freelancing" ? "on" : ""} onClick={() => setRole("freelancing")}>I'm Freelancing</button>
          </div>
        </div>

        <div className="flow-grid" style={{ marginTop: 40 }} role="tabpanel">
          {(role === "hiring" ? FLOW_CLIENT : FLOW_FREELANCER).map(s => (
            <article key={s.n} className="step">
              <div>
                <div className="step-num" style={{ background: s.bg, color: s.fg }} aria-hidden="true">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-text">{s.text.map((line, i) => <span key={i} style={{ display: "block" }}>{line}</span>)}</p>
              </div>
              <div className="step-foot" style={{ color: s.footFg }}>
                <span aria-hidden="true">{s.icon}</span>
                <span>{s.foot}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const [stats, setStats] = useState(null);
  useEffect(() => { getMarketplaceStats().then(setStats).catch(() => setStats({ members: 0, openProjects: 0, freelancerProfiles: 0, proposals: 0 })); }, []);
  return (
    <section className="stats" aria-label="Platform statistics">
      <div className="stats-grid">
        {STATS.map(s => (
          <div key={s.label} className="metric">
            <div className="metric-num" style={{ color: s.color }}>{stats ? Number(stats[s.key]).toLocaleString() : '—'}</div>
            <div className="metric-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function About({ onNav }) {
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div className="about-grid">
        <div className="about-visual" role="img" aria-label="Team collaborating around a screen">
          <div className="about-network-scene" aria-hidden="true">
            <svg className="about-network-lines" viewBox="0 0 600 360" preserveAspectRatio="none">
              <path d="M135 88 C185 95 205 137 265 163" />
              <path d="M458 78 C400 95 385 135 335 163" />
              <path d="M135 262 C188 248 213 217 265 195" />
              <path d="M465 250 C411 238 387 211 335 192" />
              <circle cx="135" cy="88" r="5" /><circle cx="458" cy="78" r="5" />
              <circle cx="135" cy="262" r="5" /><circle cx="465" cy="250" r="5" />
            </svg>
            <div className="about-hub-card">
              <span className="about-hub-mark">KT</span>
              <strong>Great work, connected</strong>
              <small>Ideas move forward together</small>
              <div className="about-hub-progress"><i /></div>
            </div>
            <div className="about-person about-person-one"><span className="about-avatar avatar-teal">AM</span><span className="about-person-copy"><b>Alex Morgan</b><small>Product designer</small></span><i className="about-online-dot" /></div>
            <div className="about-person about-person-two"><span className="about-avatar avatar-amber">SC</span><span className="about-person-copy"><b>Sofia Chen</b><small>Brand strategist</small></span><i className="about-online-dot" /></div>
            <div className="about-person about-person-three"><span className="about-avatar avatar-blue">JR</span><span className="about-person-copy"><b>Jordan Reed</b><small>Web developer</small></span><i className="about-online-dot" /></div>
            <div className="about-project-chip"><span>✓</span><div><small>PROJECT MILESTONE</small><b>Design approved</b></div></div>
          </div>
          <div className="float-card">
            <div className="float-left">
              <div className="float-ico" aria-hidden="true">◎</div>
              <div>
                <div className="float-title">Global Talent Mesh</div>
                <div className="float-sub">Projects and profiles saved locally</div>
              </div>
            </div>
            <span className="pill" style={{ background: "rgba(0,104,95,.1)", color: "#00685f", textTransform: "none", letterSpacing: 0, fontSize: 12 }}>SQLite-backed</span>
          </div>
        </div>

        <div className="about-copy">
          <div className="head-left" style={{ gap: 8 }}>
            <span className="kicker">About our platform</span>
            <h2 id="about-title" className="about-title">We're building a better way for businesses and independent professionals to work together.</h2>
          </div>
          <p className="about-text">{ABOUT_LINES[0]}</p>
          <div className="bullets">
            {ABOUT_BULLETS.map(b => (
              <div key={b.t} className="bullet">
                <span className="bullet-dot" aria-hidden="true">✓</span>
                <div>
                  <div className="bullet-t">{b.t}</div>
                  <div className="bullet-d">{b.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 8 }}>
            <button className="btn btn-primary" onClick={() => onNav('how')}>Learn More →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ onNav, onProfile }) {
  return (
    <section className="final" aria-labelledby="final-title">
      <span className="glow-a" aria-hidden="true" />
      <span className="glow-b" aria-hidden="true" />
      <div className="final-inner">
        <span className="final-pill">Start in under 2 minutes</span>
        <h2 id="final-title" className="final-title">Ready to Turn Your Next Idea Into Reality?</h2>
        <p className="final-sub">Find a professional, post a project, or start your freelance profile. Project details and proposals are saved in your local marketplace.</p>
        <div className="final-cta">
          <button className="btn btn-white" onClick={() => onNav("freelancers")}>Find a Freelancer 🔍</button>
          <button className="btn btn-outline" onClick={onProfile}>Start Freelancing 📈</button>
        </div>
      </div>
    </section>
  );
}

function Footer({ onToast, onNav, onPostProject, onProfile }) {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const sectionForLink = {
    'Find Freelancers': 'freelancers', 'Enterprise Solutions': 'how', 'Project Catalog': 'projects',
    'Escrow Protection': 'trust', 'Talent Scout': 'freelancers', 'Find Projects': 'projects',
    'Skill Assessments': 'categories', 'Community Forum': 'freelancers', 'Freelancer Guides': 'how',
    'About KipTalent': 'about', 'Careers': 'about', 'Press & Media': 'about',
    'Trust & Safety': 'trust', 'Help Center': 'how', 'Blog & Articles': 'categories',
    'Freelance Calculator': 'projects', 'Success Stories': 'projects',
  };
  const handleLink = async (event, label) => {
    event.preventDefault();
    if (label === 'Post a Project') return onPostProject();
    if (label === 'Create Profile') return onProfile();
    if (label === 'Freelance Calculator') {
      setEstimate(null);
      setCalculatorOpen(true);
      return;
    }
    if (label === 'Developer API') {
      window.open('/api/health', '_blank', 'noopener,noreferrer');
      return;
    }
    if (label === 'Status') {
      try {
        const result = await fetch('/api/health');
        const health = await result.json();
        onToast(health.ok ? 'Local API and SQLite are online.' : 'Local API is unavailable.');
      } catch {
        onToast('Local API is unavailable. Start it with npm run dev.');
      }
      return;
    }
    if (label === 'Privacy Policy') {
      onToast('Local privacy: account, profile, project, and proposal data stays in data/kiptalent.sqlite. Passwords are stored as hashes.');
      return;
    }
    if (label === 'Terms of Service') {
      onToast('Local demo terms: this app saves projects and proposals locally; no contract, payment, or escrow transaction is created.');
      return;
    }
    onNav(sectionForLink[label] || 'about');
  };

  const shareSite = async (label) => {
    try {
      if (navigator.share) await navigator.share({ title: 'KipTalent', text: 'Explore KipTalent freelance projects and profiles.', url: window.location.origin });
      else {
        await navigator.clipboard.writeText(window.location.href);
        onToast('KipTalent link copied. You can share it anywhere.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') onToast(`${label} sharing is unavailable in this browser.`);
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand">KipTalent</div>
            <p>Connecting ambitious businesses with world-class independent professionals to build the future of work.</p>
            <div className="social">
              {SOCIAL.map(s => (
                <button key={s.label} type="button" aria-label={`Share KipTalent · ${s.label}`} title={`Share KipTalent · ${s.label}`} onClick={() => shareSite(s.label)}>{s.ico}</button>
              ))}
            </div>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.title} className="footer-col">
              <h3>{col.title}</h3>
              <ul>
                {col.links.map(l => {
                  const isHiring = l === "Careers";
                  return (
                    <li key={l}>
                      <a href={sectionForLink[l] ? `#${sectionForLink[l]}` : '#'} onClick={(event) => handleLink(event, l)}>{l === 'Status' && <span className="status-dot" aria-hidden="true" />}{l}</a>
                      {isHiring && <span className="hiring">Hiring!</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© 2026 KipTalent Technologies Inc. All rights reserved.</span>
          <div className="footer-meta">
            <span className="pill-chip">🌐 English (US)</span>
            <span className="pill-chip">$ USD ($)</span>
            <span className="soc2">SQLite local preview</span>
          </div>
        </div>
      </div>
      {calculatorOpen && <div className="project-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCalculatorOpen(false); }}>
        <section className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="freelance-calculator-title">
          <button type="button" className="project-dialog-close" onClick={() => setCalculatorOpen(false)} aria-label="Close">×</button>
          <span className="kicker">QUICK ESTIMATE</span>
          <h2 id="freelance-calculator-title">Freelance project calculator</h2>
          <p className="project-dialog-context">Estimate a project total from an hourly rate and expected hours.</p>
          <form className="project-dialog-form" onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); setEstimate(Number(values.get('rate')) * Number(values.get('hours'))); }}>
            <label>Hourly rate (USD)<input name="rate" type="number" min="1" step="1" placeholder="35" required /></label>
            <label>Estimated hours<input name="hours" type="number" min="1" step="1" placeholder="20" required /></label>
            {estimate !== null && <p className="calculator-result" role="status">Estimated project total: <strong>${estimate.toLocaleString()}</strong></p>}
            <div className="project-dialog-actions"><button type="button" className="outline-btn" onClick={() => setCalculatorOpen(false)}>Close</button><button type="submit" className="solid-btn">Calculate estimate</button></div>
          </form>
        </section>
      </div>}
    </footer>
  );
}

function AuthPage({ initialMode, onModeChange, onAuthenticated, onHome, onToast }) {
  const [mode, setMode] = useState(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(() => new URLSearchParams(window.location.search).get('recovery') === '1');
  const [formMessage, setFormMessage] = useState(null);
  const emailRef = useRef(null);

  useEffect(() => setMode(initialMode), [initialMode]);

  const changeMode = (nextMode) => {
    setFormMessage(null);
    setRecoveryMode(false);
    setMode(nextMode);
    onModeChange(nextMode);
  };

  const isSignUp = mode === "signup";

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    try {
      if (recoveryMode) {
        const resetToken = String(form.get('resetToken') || '').trim();
        await updatePassword({ password, resetToken });
        setRecoveryMode(false);
        setFormMessage({ type: 'success', text: 'Password updated. You can now sign in with your new password.' });
        window.history.replaceState({}, '', '/login');
      } else if (isSignUp) {
        const fullName = String(form.get('name') || '').trim();
        const { data, error } = await signUp({ fullName, email, password });
        if (error) throw error;
        if (data.session) {
          onAuthenticated(`Account created. Welcome to CODE IO, ${fullName}.`, data.user);
        } else {
          setFormMessage({ type: 'success', text: 'Account created. Check your email to confirm your address, then sign in.' });
        }
      } else {
        const { data, error } = await signIn({ email, password });
        if (error) throw error;
        onAuthenticated(`Signed in as ${data.user.email}.`, data.user);
      }
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message || 'Authentication failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const sendPasswordReset = async () => {
    const email = emailRef.current?.value.trim();
    if (!email) {
      setFormMessage({ type: 'error', text: 'Enter your email address first.' });
      emailRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setFormMessage(null);
    try {
      await requestPasswordReset(email);
      window.history.replaceState({}, '', '/login?recovery=1');
      setRecoveryMode(true);
      setMode('signin');
      setFormMessage({ type: 'success', text: 'If an account exists, a reset token was printed in the terminal running npm run dev. Paste it below; it expires in 15 minutes.' });
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message || 'Could not send the reset email. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-topbar">
        <button className="auth-brand" onClick={onHome} aria-label="Back to CODE IO home">CODE IO</button>
        <button className="auth-back" onClick={onHome}>← Back to home</button>
      </div>

      <div className="auth-layout">
        <section className="auth-aside" aria-label="CODE IO marketplace">
          <div className="auth-aside-content">
            <span className="auth-eyebrow"><span /> WORK BETTER, TOGETHER</span>
            <h1>Great work starts with the right connection.</h1>
            <p>Find independent talent, discover meaningful projects, and make your next idea happen.</p>
            <div className="auth-trust-row">
              <span className="auth-avatars" aria-hidden="true"><i>AM</i><i>SC</i><i>MV</i></span>
              <span>Join a community of ambitious teams and talented freelancers.</span>
            </div>
          </div>
          <div className="auth-aside-note"><span>✦</span> Your next great project is one connection away.</div>
        </section>

        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-panel-inner">
            <span className="auth-kicker">{recoveryMode ? "PASSWORD RECOVERY" : isSignUp ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</span>
            <h2 id="auth-title">{recoveryMode ? "Choose a new password" : isSignUp ? "Join CODE IO" : "Sign in to CODE IO"}</h2>
            <p className="auth-intro">{recoveryMode ? "Enter the reset token from your local API terminal and choose a new password." : isSignUp ? "Create an account to get started with your next opportunity." : "Enter your details to access your account."}</p>

            {!recoveryMode && <div className="auth-tabs" role="tablist" aria-label="Account access">
              <button type="button" role="tab" aria-selected={!isSignUp} className={!isSignUp ? "selected" : ""} onClick={() => changeMode("signin")}>Sign In</button>
              <button type="button" role="tab" aria-selected={isSignUp} className={isSignUp ? "selected" : ""} onClick={() => changeMode("signup")}>Sign Up</button>
            </div>}

            <form className="auth-form" onSubmit={submit}>
              {!recoveryMode && isSignUp && (
                <label className="auth-field">
                  <span>Full name</span>
                  <input autoComplete="name" name="name" placeholder="Your full name" required />
                </label>
              )}
              {recoveryMode && <label className="auth-field">
                <span>Password reset token</span>
                <input autoComplete="one-time-code" name="resetToken" placeholder="Paste the token from the API terminal" required />
              </label>}
              {!recoveryMode && <label className="auth-field">
                <span>Email address</span>
                <input ref={emailRef} autoComplete="email" name="email" type="email" placeholder="you@example.com" required />
              </label>}
              <label className="auth-field">
                <span>Password</span>
                <span className="password-input-wrap">
                  <input autoComplete={isSignUp || recoveryMode ? "new-password" : "current-password"} name="password" type={showPassword ? "text" : "password"} minLength="8" placeholder="At least 8 characters" required />
                  <button className="password-visibility" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
                </span>
              </label>

              {recoveryMode ? null : isSignUp ? (
                <label className="auth-check"><input type="checkbox" required /><span>I agree to the <a href="#terms" onClick={(event) => { event.preventDefault(); onToast('Local demo: proposals are stored for review; no payment or contract is created.'); }}>Terms of Service</a> and <a href="#privacy" onClick={(event) => { event.preventDefault(); onToast('Account and marketplace data is saved in local SQLite; passwords are stored as hashes.'); }}>Privacy Policy</a>.</span></label>
              ) : (
                <div className="auth-form-options">
                  <label className="auth-check"><input type="checkbox" /><span>Remember me</span></label>
                  <button type="button" className="auth-text-button" disabled={submitting} onClick={sendPasswordReset}>Forgot password?</button>
                </div>
              )}

              <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Please wait…" : recoveryMode ? "Update password" : isSignUp ? "Create account" : "Sign in"}<span aria-hidden="true">→</span></button>
            </form>

            {formMessage && <p className={`auth-message ${formMessage.type}`} role={formMessage.type === 'error' ? 'alert' : 'status'}>{formMessage.text}</p>}
            {!recoveryMode && <p className="auth-switch">
              {isSignUp ? "Already have an account?" : "New to CODE IO?"}{" "}
              <button type="button" onClick={() => changeMode(isSignUp ? "signin" : "signup")}>{isSignUp ? "Sign in" : "Create an account"}</button>
            </p>}
            <p className="auth-secure"><span aria-hidden="true">▣</span> Your information is encrypted and secure.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function SignOutDialog({ onConfirm, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="signout-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="signout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="signout-title" aria-describedby="signout-description">
        <span className="signout-icon" aria-hidden="true">↗</span>
        <h2 id="signout-title">Sign out?</h2>
        <p id="signout-description">Are you sure you want to sign out of your account?</p>
        <div className="signout-actions">
          <button className="outline-btn" type="button" autoFocus onClick={onCancel}>Cancel</button>
          <button className="solid-btn" type="button" onClick={onConfirm}>OK</button>
        </div>
      </section>
    </div>
  );
}

/* ============ APP ============ */

function App() {
  const [activeNav, setActiveNav] = useState("top");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [toast, setToast] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [postProjectOpen, setPostProjectOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [projectTemplate, setProjectTemplate] = useState(null);
  const [pendingProjectAction, setPendingProjectAction] = useState(false);
  const [pendingProfileAction, setPendingProfileAction] = useState(false);
  const [pendingProposalProject, setPendingProposalProject] = useState(null);
  const [authMode, setAuthMode] = useState(() => {
    if (window.location.pathname.endsWith("/login")) return "signin";
    if (window.location.pathname.endsWith("/signup")) return "signup";
    return null;
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((user) => {
      if (!active) return;
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => { active = false; };
  }, []);

  const navTo = (target) => {
    setActiveNav(target);
    scrollToTarget(target);
  };

  const onSearch = (q) => {
    setCategoryQuery(q);
    navTo("categories");
  };

  const openAuth = (mode) => {
    window.history.pushState({}, "", mode === "signup" ? "/signup" : "/login");
    setAuthMode(mode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProjectComposer = () => {
    setProjectTemplate(null);
    if (!currentUser) {
      setPendingProjectAction(true);
      setToast('Sign in to post a project.');
      openAuth('signin');
      return;
    }
    setPendingProjectAction(false);
    setPostProjectOpen(true);
  };

  const openProfile = () => {
    if (!currentUser) {
      setPendingProfileAction(true);
      openAuth('signin');
      return;
    }
    setProfileOpen(true);
  };

  const openTemplateComposer = (template) => {
    setProjectTemplate(template);
    if (!currentUser) {
      setToast('Sign in to post a project from this template.');
      openAuth('signin');
      return;
    }
    setPostProjectOpen(true);
  };

  const closeProjectComposer = () => {
    setPostProjectOpen(false);
    setProjectTemplate(null);
  };

  const changeAuthMode = (mode) => {
    window.history.replaceState({}, "", mode === "signup" ? "/signup" : "/login");
  };

  const goHome = () => {
    window.history.pushState({}, "", "/");
    setAuthMode(null);
    setPendingProjectAction(false);
    setPendingProfileAction(false);
    setPendingProposalProject(null);
    setProjectTemplate(null);
  };

  const onAuthenticated = (message, user) => {
    setCurrentUser(user);
    setAuthReady(true);
    window.history.pushState({}, "", "/");
    setAuthMode(null);
    if (projectTemplate || pendingProjectAction) setPostProjectOpen(true);
    if (pendingProfileAction) setProfileOpen(true);
    setPendingProjectAction(false);
    setPendingProfileAction(false);
    setToast(message);
  };

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false);
    try { await signOut(); }
    finally {
      setCurrentUser(null);
      setToast("You have been signed out.");
    }
  };

  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname.endsWith("/login")) setAuthMode("signin");
      else if (window.location.pathname.endsWith("/signup")) setAuthMode("signup");
      else setAuthMode(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <>
      <a href="#main" className="sr-only">Skip to content</a>
      {authMode ? (
        <AuthPage initialMode={authMode} onModeChange={changeAuthMode} onAuthenticated={onAuthenticated} onHome={goHome} onToast={setToast} />
      ) : (
        <>
          <Header activeNav={activeNav} onNav={navTo} onAuth={openAuth} onPostProject={openProjectComposer} onProfile={openProfile} currentUser={currentUser} authReady={authReady} onSignOut={() => setShowSignOutConfirm(true)} />
          <main id="main">
            <Hero />
            <Categories query={categoryQuery} onToast={setToast} onUseTemplate={openTemplateComposer} onClearSearch={() => setCategoryQuery('')} />
            <Projects onToast={setToast} currentUser={currentUser} onRequireAuth={(project) => { setPendingProposalProject(project); openAuth('signin'); }} pendingProposalProject={pendingProposalProject} onResumeProposal={() => setPendingProposalProject(null)} postProjectOpen={postProjectOpen} onClosePostProject={closeProjectComposer} projectTemplate={projectTemplate} />
            <Freelancers onToast={setToast} refreshKey={profileRefreshKey} />
            <Benefits />
            <HowItWorks />
            <Stats />
            <About onNav={navTo} />
            <FinalCTA onNav={navTo} onProfile={openProfile} />
          </main>
          <Footer onToast={setToast} onNav={navTo} onPostProject={openProjectComposer} onProfile={openProfile} />
        </>
      )}
      {profileOpen && currentUser && <ProfileDialog onClose={() => setProfileOpen(false)} onToast={setToast} onSaved={() => setProfileRefreshKey((key) => key + 1)} />}
      {showSignOutConfirm && <SignOutDialog onConfirm={confirmSignOut} onCancel={() => setShowSignOutConfirm(false)} />}
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}



export default App;


