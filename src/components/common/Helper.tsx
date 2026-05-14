
export const MENU_DATA_LIST = [
  {
    title: "Courses",
    url: "#course",
  },
  {
    title: "Learning Paths",
    url: "#learning",
  },
  {
    title: "Pricing",
    url: "#pricing",
  },
  {
    title: "About",
    url: "#about",
  },
]

export const CHOOSE_YOUR_PATH_DATA_LIST = [
  {
    icon: "student",
    title: "Student",
    description: "Learn by Inventa",
    list_one: "Follow guided projects step-by-step",
    list_two: "Earn badges and track progress",
    button: "Continue as Student",
    url: "#",
    className: "text-green!",
  },
  {
    icon: "education",
    title: "Educator / School",
    description: "Manage classrooms",
    list_one: "Create classes and assign projects",
    list_two: "Monitor student progress in real time",
    button: "Continue as Educator",
    url: "#",
    className: "text-blue!",
  },
  {
    icon: "team",
    title: "Creator / Team",
    description: "Prototype ideas fast",
    list_one: "Start from scratch or use templates",
    list_two: "Collaborate and share with your team",
    button: "Continue as Creator",
    url: "#",
    className: "text-yellow",
  },
]


export const OUR_PLANS_Data = [
  {
    title: "Free",
    subtitle: "Perfect for getting started.",
    price: "$0",
    duration: "forever",
    features: [
      "5 projects",
      "50+ templates",
      "Basic export",
      "Community support",
      "Autosave"
    ],
    button: "Start Free",
    highlight: false
  },
  {
    title: "Pro",
    subtitle: "For serious creators & makers",
    price: "$12",
    duration: "Per Month",
    features: [
      "Unlimited projects",
      "All templates",
      "Advanced export",
      "Priority support",
      "Collaboration"
    ],
    button: "Go Pro",
    highlight: true
  },
  {
    title: "Education",
    subtitle: "For schools & classrooms",
    price: "$4",
    duration: "Per Student/Month",
    features: [
      "Student accounts",
      "Assignment tracking",
      "Admin dashboard",
      "COPPA compliant",
      "Autosave"
    ],
    button: "Contact Sales",
    highlight: false
  }
]
export const FAQS_DATA_LIST = [
  {
    question: "Is Inventa really free?",
    answer: "Yes, Inventa offers a free plan with basic features so you can get started without any cost."
  },
  {
    question: "Does it work on mobile and tablet?",
    answer: "Yes, Inventa works smoothly on mobile phones, tablets, and desktops with a responsive interface."
  },
  {
    question: "What export formats are supported?",
    answer: "You can export your projects in multiple formats including images, PDFs, and other supported file types."
  },
  {
    question: "Can I use Inventa in my classroom?",
    answer: "Yes, Inventa is designed for education and can be used by teachers and students in classrooms."
  },
  {
    question: "Is student data safe and private?",
    answer: "Yes, Inventa follows strict security practices to keep student data safe and private."
  }
]

export const TRUSTED_LOGOS_DATA_LIST = [
  {
    name: "logo-1",
    src: "/images/home/svg/logo1.svg",
    width: 110,
    height: 35
  },
  {
    name: "logo-2",
    src: "/images/home/svg/logo2.svg",
    width: 164,
    height: 36
  },
  {
    name: "logo-3",
    src: "/images/home/svg/logo3.svg",
    width: 155,
    height: 35
  },
  {
    name: "logo-4",
    src: "/images/home/svg/logo4.svg",
    width: 69,
    height: 27
  },
  {
    name: "logo-5",
    src: "/images/home/svg/logo5.svg",
    width: 155,
    height: 35
  },
  {
    name: "logo-6",
    src: "/images/home/svg/logo6.svg",
    width: 88,
    height: 35
  }
]

export const TESTIMONIALS_DATA_LIST = [
  {
    name: "Sarah Chen",
    role: "STEM Director, Oakridge School",
    image: "/images/home/svg/client-two.svg",
    rating: 5,
    review:
      "Inventa transformed how we teach STEM. Students are more engaged and creating real projects from day one."
  },
  {
    name: "Marcus Rivera",
    role: "High School Student",
    image: "/images/home/svg/client-one.svg",
    rating: 5,
    review:
      "I went from zero experience to building my first circuit in 10 minutes. The tutorials are incredible."
  }
]

export const DASHBOARD_SIDERBAR_MENU = [
  {
    title: "Home",
    icon: "home",
    path: "/dashboard"
  },
  {
    title: "Classes",
    icon: "studentcap",
    path: "/dashboard/board",
  },
  {
    title: "Projects",
    icon: "project",
    path: "/dashboard/projects"
  },
  {
    title: "Templates",
    icon: "template",
    path: "/dashboard/templates"
  },
  {
    title: "Community",
    icon: "community",
    path: "/dashboard/community"
  },
  {
    title: "Settings",
    icon: "setting",
    path: "/dashboard/settings"
  }
];

export const BOARDS_DASHBOARD_DATA = [
  {
    title: "CBSE",
    desc: "Central Board of Secondary Education",
    type: "National Board",
    popular: true,
    logo: "/images/dashboard/classes/png/cbse.png",
  },
  {
    title: "Rajasthan",
    desc: "Board of Secondary Education, Rajasthan (BSER/RBSE)",
    type: "State Board",
    popular: true,
    logo: "/images/dashboard/classes/png/rajasthan.png",
  },
  {
    title: "CISCE",
    desc: "Council for the Indian School Certificate Examinations",
    type: "National Board",
    popular: true,
    logo: "/images/dashboard/classes/png/new-delhi.png",
  },
  {
    title: "UP Board",
    desc: "Uttar Pradesh Madhyamik Shiksha Parishad",
    type: "State Board",
    popular: true,
    logo: "/images/dashboard/classes/png/up.png",
  },
  {
    title: "HBSE",
    desc: "Board of School Education Haryana",
    type: "State Board",
    popular: true,
    logo: "/images/dashboard/classes/png/hbse.png",
  },
  {
    title: "Maharashtra",
    desc: "Maharashtra State Board of Secondary & Higher Secondary Education",
    type: "State Board",
    popular: true,
    logo: "/images/dashboard/classes/png/maharaster.png",
  },
  {
    title: "NIOS",
    desc: "National Institute of Open Schooling",
    type: "National Board",
    popular: true,
    logo: "/images/dashboard/classes/png/nios.png",
  },
  {
    title: "MP",
    desc: "Madhya Pradesh Board of Secondary Education",
    type: "State Board",
    popular: true,
    logo: "/images/dashboard/classes/png/mp.png",
  },
  {
    title: "Bihar",
    desc: "Bihar School Examination Board",
    type: "State Board",
    popular: true,
    logo: "/images/dashboard/classes/png/bihar.png",
  },
  {
    title: "West Bengal",
    desc: "West Bengal Board of Secondary Education",
    type: "State Board",
    popular: true,
    logo: "/images/dashboard/classes/png/west-bangale.png",
  },
]


export const CURRENT_PROJECTS_WORKING_LIST = [
  {
    title: "Solar System Model",
    status: "Draft",
    time: "2h ago",
    image: "/images/dashboard/home/png/project-1.png",
    shared: false,
    members: 0,
  },
  {
    title: "LED Circuit Board",
    status: "Draft",
    time: "1d ago",
    image: "/images/dashboard/home/png/project-2.png",
    shared: true,
    members: 2,
  },
  {
    title: "Robot Arm Design",
    status: "Completed",
    time: "3d ago",
    image: "/images/dashboard/home/png/project-3.png",
    shared: false,
    members: 0,
  },
  {
    title: "Abstract Art Sculpture",
    status: "Completed",
    time: "1w ago",
    image: "/images/dashboard/home/png/project-4.png",
    shared: false,
    members: 0,
  },
]

export const PROJECT_OPTIONS_DATA_LIST = [
  {
    title: "New blank project",
    desc: "Start from scratch with an empty canvas",
    icon: "file", // tumhare Icons component ke hisaab se
    color: "#EFF6FF",
  },
  {
    title: "Start from template",
    desc: "Choose from hundreds of pre-made designs",
    icon: "templategreen",
    color: "#F0FDF4",
  },
  {
    title: "Import file",
    desc: "Upload STL, OBJ, or other 3D formats",
    icon: "upload",
    color: "#FEF3F2",
  },
]

export const TEMPLATES_DATA_LIST = [
  {
    id: 1,
    title: "LED Circuit Basics",
    category: "Electronics",
    time: "5 min",
    image: "/images/home/webp/template-img-1.webp"
  },
  {
    id: 2,
    title: "My First 3D House",
    category: "3D",
    time: "15 min",
    image: "/images/home/webp/template-img-2.webp"
  },
  {
    id: 3,
    title: "Simple Robot Arm",
    category: "Projects",
    time: "30 min",
    image: "/images/home/webp/template-img-3.webp"
  },
  {
    id: 4,
    title: "Solar System Model",
    category: "Classroom",
    time: "15 min",
    image: "/images/home/webp/template-img-4.webp"
  },
  {
    id: 5,
    title: "Traffic Light Sim",
    category: "Electronics",
    time: "5 min",
    image: "/images/home/webp/template-img-5.webp"
  },
  {
    id: 6,
    title: "Geometric Art",
    category: "Beginner",
    time: "10 min",
    image: "/images/home/webp/template-img-6.webp"
  },
  {
    id: 7,
    title: "Bridge Engineering",
    category: "Projects",
    time: "5 min",
    image: "/images/home/webp/template-img-7.webp"
  },
  {
    id: 8,
    title: "Dice Roller Game",
    category: "Beginner",
    time: "8 min",
    image: "/images/home/webp/template-img-8.webp"
  }
]

export const CATEGORIES_DATA_LIST = [
  "All",
  "Beginner",
  "Classroom",
  "Electronics",
  "3D",
  "Projects",
  "Trending"
]

export const CLASSES_DATA_LIST = [
  { name: "5th", recommended: false },
  { name: "6th", recommended: false },
  { name: "7th", recommended: false },
  { name: "8th", recommended: true },
  { name: "9th", recommended: false },
  { name: "10th", recommended: true },
  { name: "11th", recommended: false },
  { name: "12th", recommended: false },
]

export const TOOLBAR_ITEMS = [
  { icon: "copy" },
  { icon: "copy" },
  { icon: "delete" },

  { type: "divider" },

  { icon: "undo" },
  { icon: "redo" },

  { type: "divider" },

  { icon: "comment" },
  { icon: "preview" },

  { type: "divider" },

  { icon: "refresh" },
  { icon: "fullscreen" },
  { icon: "threeline" },

  { type: "divider" },

  { icon: "layout", active: true },
]

export const ELECTRONICS_COMPONENTS = [
  {
    title: "Resistor",
    image: "/images/design/png/resistor.png",
  },
  {
    title: "Capacitor",
    image: "/images/design/png/capacitor.png",
  },
  {
    title: "Diode",
    image: "/images/design/png/diode.png",
  },
  {
    title: "Inductor",
    image: "/images/design/png/inductor.png",
  },
  {
    title: "LED",
    image: "/images/design/png/led.png",
  },
  {
    title: "Diode",
    image: "/images/design/png/diode.png",
  },
  {
    title: "Diode",
    image: "/images/design/png/diode.png",
  },
  {
    title: "Capacitor",
    image: "/images/design/png/capacitor.png",
  },
]
