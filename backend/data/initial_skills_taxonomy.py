# Initial Skills Taxonomy Data
# This comprehensive dataset provides the foundation for skill standardization

INITIAL_SKILLS_TAXONOMY = {
    "technical_skills": {
        "programming_languages": [
            {
                "skill_id": "javascript",
                "canonical_name": "JavaScript",
                "aliases": ["JS", "JavaScript Programming", "JavaScript Development", "ECMAScript", "JS Development"],
                "description": "Programming language for web development, both frontend and backend",
                "keywords": ["programming", "web", "frontend", "backend", "scripting"],
                "industry_tags": ["web_development", "software", "technology"]
            },
            {
                "skill_id": "python",
                "canonical_name": "Python",
                "aliases": ["Python Programming", "Python Development", "Python Scripting"],
                "description": "High-level programming language for web development, data science, and automation",
                "keywords": ["programming", "web", "data", "automation", "scripting"],
                "industry_tags": ["web_development", "data_science", "automation", "ai_ml"]
            },
            {
                "skill_id": "java",
                "canonical_name": "Java",
                "aliases": ["Java Programming", "Java Development", "Java SE", "Java EE"],
                "description": "Object-oriented programming language for enterprise applications",
                "keywords": ["programming", "enterprise", "backend", "oop"],
                "industry_tags": ["enterprise", "fintech", "software"]
            },
            {
                "skill_id": "csharp",
                "canonical_name": "C#",
                "aliases": ["C Sharp", "C# Programming", "CSharp", ".NET Development"],
                "description": "Programming language for .NET framework and Microsoft technologies",
                "keywords": ["programming", "microsoft", "dotnet", "backend"],
                "industry_tags": ["enterprise", "software", "microsoft"]
            },
            {
                "skill_id": "php",
                "canonical_name": "PHP",
                "aliases": ["PHP Programming", "PHP Development", "PHP Scripting"],
                "description": "Server-side scripting language for web development",
                "keywords": ["programming", "web", "backend", "server"],
                "industry_tags": ["web_development", "ecommerce"]
            },
            {
                "skill_id": "typescript",
                "canonical_name": "TypeScript",
                "aliases": ["TS", "TypeScript Programming", "TypeScript Development"],
                "description": "Typed superset of JavaScript for large-scale applications",
                "keywords": ["programming", "web", "frontend", "typescript", "typed"],
                "industry_tags": ["web_development", "software"]
            },
            {
                "skill_id": "html",
                "canonical_name": "HTML",
                "aliases": ["HTML5", "HyperText Markup Language", "Web Markup", "HTML Development"],
                "description": "Standard markup language for creating web pages",
                "keywords": ["markup", "web", "frontend", "structure"],
                "industry_tags": ["web_development"]
            },
            {
                "skill_id": "css",
                "canonical_name": "CSS",
                "aliases": ["CSS3", "Cascading Style Sheets", "Styling", "CSS Development"],
                "description": "Style sheet language for describing web page presentation",
                "keywords": ["styling", "web", "frontend", "design"],
                "industry_tags": ["web_development", "design"]
            },
            {
                "skill_id": "sql",
                "canonical_name": "SQL",
                "aliases": ["Structured Query Language", "SQL Programming", "Database Queries"],
                "description": "Language for managing and querying relational databases",
                "keywords": ["database", "queries", "data", "sql"],
                "industry_tags": ["data", "backend", "database"]
            }
        ],
        "frameworks_libraries": [
            {
                "skill_id": "react",
                "canonical_name": "React",
                "aliases": ["React.js", "ReactJS", "React Development", "React Framework"],
                "description": "JavaScript library for building user interfaces",
                "keywords": ["javascript", "frontend", "ui", "library"],
                "industry_tags": ["web_development", "frontend"]
            },
            {
                "skill_id": "angular",
                "canonical_name": "Angular",
                "aliases": ["AngularJS", "Angular Framework", "Angular Development"],
                "description": "TypeScript-based web application framework",
                "keywords": ["typescript", "frontend", "framework", "spa"],
                "industry_tags": ["web_development", "frontend"]
            },
            {
                "skill_id": "vue",
                "canonical_name": "Vue.js",
                "aliases": ["Vue", "VueJS", "Vue Framework", "Vue Development"],
                "description": "Progressive JavaScript framework for building user interfaces",
                "keywords": ["javascript", "frontend", "progressive", "framework"],
                "industry_tags": ["web_development", "frontend"]
            },
            {
                "skill_id": "nodejs",
                "canonical_name": "Node.js",
                "aliases": ["NodeJS", "Node", "Node.js Development", "Node Backend"],
                "description": "JavaScript runtime for building server-side applications",
                "keywords": ["javascript", "backend", "server", "runtime"],
                "industry_tags": ["web_development", "backend"]
            },
            {
                "skill_id": "django",
                "canonical_name": "Django",
                "aliases": ["Django Framework", "Django Development", "Django Web Framework"],
                "description": "High-level Python web framework",
                "keywords": ["python", "web", "framework", "backend"],
                "industry_tags": ["web_development", "backend"]
            },
            {
                "skill_id": "laravel",
                "canonical_name": "Laravel",
                "aliases": ["Laravel Framework", "Laravel PHP", "Laravel Development"],
                "description": "PHP web application framework",
                "keywords": ["php", "web", "framework", "backend"],
                "industry_tags": ["web_development", "backend"]
            },
            {
                "skill_id": "nextjs",
                "canonical_name": "Next.js",
                "aliases": ["NextJS", "Next", "Next.js Framework"],
                "description": "React framework for production-ready applications",
                "keywords": ["react", "framework", "ssr", "frontend"],
                "industry_tags": ["web_development", "frontend"]
            }
        ],
        "databases": [
            {
                "skill_id": "mysql",
                "canonical_name": "MySQL",
                "aliases": ["MySQL Database", "MySQL Development", "MySQL Administration"],
                "description": "Open-source relational database management system",
                "keywords": ["database", "relational", "sql", "mysql"],
                "industry_tags": ["database", "backend"]
            },
            {
                "skill_id": "postgresql",
                "canonical_name": "PostgreSQL",
                "aliases": ["Postgres", "PostgreSQL Database", "PostgreSQL Development"],
                "description": "Advanced open-source relational database",
                "keywords": ["database", "relational", "sql", "postgres"],
                "industry_tags": ["database", "backend"]
            },
            {
                "skill_id": "mongodb",
                "canonical_name": "MongoDB",
                "aliases": ["Mongo", "MongoDB Database", "NoSQL", "MongoDB Development"],
                "description": "Document-oriented NoSQL database",
                "keywords": ["database", "nosql", "document", "mongodb"],
                "industry_tags": ["database", "backend", "nosql"]
            },
            {
                "skill_id": "sqlite",
                "canonical_name": "SQLite",
                "aliases": ["SQLite Database", "SQLite Development"],
                "description": "Lightweight embedded relational database",
                "keywords": ["database", "embedded", "lightweight", "sql"],
                "industry_tags": ["database", "mobile"]
            },
            {
                "skill_id": "redis",
                "canonical_name": "Redis",
                "aliases": ["Redis Cache", "Redis Database", "Redis Development"],
                "description": "In-memory data structure store used as cache and message broker",
                "keywords": ["cache", "memory", "nosql", "performance"],
                "industry_tags": ["database", "caching", "performance"]
            }
        ],
        "cloud_devops": [
            {
                "skill_id": "aws",
                "canonical_name": "AWS",
                "aliases": ["Amazon Web Services", "AWS Cloud", "AWS Development"],
                "description": "Amazon's cloud computing platform and services",
                "keywords": ["cloud", "aws", "amazon", "infrastructure"],
                "industry_tags": ["cloud", "devops", "infrastructure"]
            },
            {
                "skill_id": "azure",
                "canonical_name": "Azure",
                "aliases": ["Microsoft Azure", "Azure Cloud", "Azure Development"],
                "description": "Microsoft's cloud computing platform",
                "keywords": ["cloud", "microsoft", "azure", "infrastructure"],
                "industry_tags": ["cloud", "devops", "infrastructure"]
            },
            {
                "skill_id": "docker",
                "canonical_name": "Docker",
                "aliases": ["Docker Containers", "Containerization", "Docker Development"],
                "description": "Platform for developing and running containerized applications",
                "keywords": ["containers", "devops", "deployment", "docker"],
                "industry_tags": ["devops", "containerization"]
            },
            {
                "skill_id": "kubernetes",
                "canonical_name": "Kubernetes",
                "aliases": ["K8s", "Container Orchestration", "Kubernetes Administration"],
                "description": "Container orchestration platform for automating deployment and management",
                "keywords": ["containers", "orchestration", "k8s", "deployment"],
                "industry_tags": ["devops", "containerization", "orchestration"]
            },
            {
                "skill_id": "git",
                "canonical_name": "Git",
                "aliases": ["Git Version Control", "Source Control", "Version Control", "Git Development"],
                "description": "Distributed version control system for tracking code changes",
                "keywords": ["version", "control", "git", "collaboration"],
                "industry_tags": ["development", "collaboration"]
            }
        ],
        "tools_technologies": [
            {
                "skill_id": "api_development",
                "canonical_name": "API Development",
                "aliases": ["REST API", "API Design", "Web API", "RESTful Services"],
                "description": "Design and development of application programming interfaces",
                "keywords": ["api", "rest", "web", "services"],
                "industry_tags": ["backend", "integration"]
            },
            {
                "skill_id": "microservices",
                "canonical_name": "Microservices",
                "aliases": ["Microservices Architecture", "Service-Oriented Architecture", "SOA"],
                "description": "Architectural approach for building distributed systems",
                "keywords": ["architecture", "distributed", "services", "scalability"],
                "industry_tags": ["architecture", "backend", "scalability"]
            },
            {
                "skill_id": "testing",
                "canonical_name": "Software Testing",
                "aliases": ["Unit Testing", "Integration Testing", "QA", "Test Automation"],
                "description": "Practices for ensuring software quality and reliability",
                "keywords": ["testing", "quality", "automation", "qa"],
                "industry_tags": ["quality", "development"]
            }
        ]
    },
    "soft_skills": [
        {
            "skill_id": "communication",
            "canonical_name": "Communication",
            "aliases": ["Communication Skills", "Verbal Communication", "Written Communication", "Interpersonal Communication"],
            "description": "Ability to effectively convey information and ideas to others",
            "keywords": ["communication", "verbal", "written", "interpersonal"],
            "industry_tags": ["universal"]
        },
        {
            "skill_id": "problem_solving",
            "canonical_name": "Problem Solving",
            "aliases": ["Problem-Solving", "Analytical Thinking", "Critical Thinking", "Solution Design"],
            "description": "Ability to analyze complex problems and develop effective solutions",
            "keywords": ["problem", "solving", "analytical", "critical"],
            "industry_tags": ["universal"]
        },
        {
            "skill_id": "teamwork",
            "canonical_name": "Team Collaboration",
            "aliases": ["Teamwork", "Team Work", "Collaboration", "Team Player", "Cooperative Work"],
            "description": "Ability to work effectively with others towards common goals",
            "keywords": ["team", "collaboration", "cooperation", "group"],
            "industry_tags": ["universal"]
        },
        {
            "skill_id": "leadership",
            "canonical_name": "Leadership",
            "aliases": ["Leadership Skills", "Team Leadership", "Management", "People Management"],
            "description": "Ability to guide, motivate, and influence others",
            "keywords": ["leadership", "management", "influence", "guidance"],
            "industry_tags": ["universal", "management"]
        },
        {
            "skill_id": "adaptability",
            "canonical_name": "Adaptability",
            "aliases": ["Flexibility", "Adaptable", "Change Management", "Resilience"],
            "description": "Ability to adjust to new conditions and handle change effectively",
            "keywords": ["adaptability", "flexibility", "change", "resilience"],
            "industry_tags": ["universal"]
        },
        {
            "skill_id": "time_management",
            "canonical_name": "Time Management",
            "aliases": ["Time Management Skills", "Organization", "Planning", "Prioritization"],
            "description": "Ability to use time effectively and efficiently",
            "keywords": ["time", "management", "organization", "planning"],
            "industry_tags": ["universal"]
        },
        {
            "skill_id": "attention_to_detail",
            "canonical_name": "Attention to Detail",
            "aliases": ["Detail-Oriented", "Precision", "Accuracy", "Thoroughness"],
            "description": "Ability to achieve thoroughness and accuracy in work tasks",
            "keywords": ["detail", "precision", "accuracy", "thoroughness"],
            "industry_tags": ["universal", "quality"]
        },
        {
            "skill_id": "creativity",
            "canonical_name": "Creativity",
            "aliases": ["Creative Thinking", "Innovation", "Creative Problem Solving", "Ideation"],
            "description": "Ability to think outside the box and generate innovative solutions",
            "keywords": ["creativity", "innovation", "ideation", "original"],
            "industry_tags": ["universal", "design", "innovation"]
        },
        {
            "skill_id": "customer_service",
            "canonical_name": "Customer Service",
            "aliases": ["Customer Relations", "Client Service", "Customer Support", "Client Relations"],
            "description": "Ability to assist and satisfy customer needs effectively",
            "keywords": ["customer", "service", "support", "relations"],
            "industry_tags": ["service", "retail", "support"]
        }
    ],
    "domain_knowledge": {
        "fintech": [
            {
                "skill_id": "financial_regulations",
                "canonical_name": "Financial Regulations",
                "aliases": ["Compliance", "Regulatory Knowledge", "Financial Compliance", "Banking Regulations"],
                "description": "Understanding of financial industry regulations and compliance requirements",
                "keywords": ["finance", "regulations", "compliance", "banking"],
                "industry_tags": ["fintech", "banking", "finance"]
            },
            {
                "skill_id": "payment_systems",
                "canonical_name": "Payment Systems",
                "aliases": ["Payment Processing", "Financial Transactions", "Payment Gateways", "Digital Payments"],
                "description": "Knowledge of payment processing systems and financial transactions",
                "keywords": ["payments", "transactions", "processing", "gateways"],
                "industry_tags": ["fintech", "payments", "ecommerce"]
            },
            {
                "skill_id": "blockchain",
                "canonical_name": "Blockchain Technology",
                "aliases": ["Blockchain", "Cryptocurrency", "DeFi", "Smart Contracts"],
                "description": "Understanding of blockchain technology and decentralized finance",
                "keywords": ["blockchain", "crypto", "defi", "smart"],
                "industry_tags": ["fintech", "blockchain", "crypto"]
            }
        ],
        "healthcare": [
            {
                "skill_id": "hipaa_compliance",
                "canonical_name": "HIPAA Compliance",
                "aliases": ["HIPAA", "Healthcare Privacy", "Medical Privacy", "Health Information Security"],
                "description": "Knowledge of healthcare privacy regulations and compliance",
                "keywords": ["hipaa", "privacy", "healthcare", "medical"],
                "industry_tags": ["healthcare", "compliance"]
            },
            {
                "skill_id": "medical_terminology",
                "canonical_name": "Medical Terminology",
                "aliases": ["Healthcare Terms", "Medical Knowledge", "Clinical Terminology"],
                "description": "Understanding of medical and healthcare terminology",
                "keywords": ["medical", "terminology", "healthcare", "clinical"],
                "industry_tags": ["healthcare", "medical"]
            },
            {
                "skill_id": "ehr_systems",
                "canonical_name": "Electronic Health Records",
                "aliases": ["EHR", "EMR", "Electronic Medical Records", "Health Information Systems"],
                "description": "Knowledge of electronic health record systems and management",
                "keywords": ["ehr", "emr", "electronic", "records"],
                "industry_tags": ["healthcare", "medical", "technology"]
            }
        ],
        "ecommerce": [
            {
                "skill_id": "ecommerce_platforms",
                "canonical_name": "E-commerce Platforms",
                "aliases": ["Online Store Management", "E-commerce Systems", "Digital Commerce"],
                "description": "Knowledge of e-commerce platforms and online retail systems",
                "keywords": ["ecommerce", "online", "retail", "platforms"],
                "industry_tags": ["ecommerce", "retail", "digital"]
            },
            {
                "skill_id": "digital_marketing",
                "canonical_name": "Digital Marketing",
                "aliases": ["Online Marketing", "Digital Advertising", "SEO", "Social Media Marketing"],
                "description": "Knowledge of digital marketing strategies and techniques",
                "keywords": ["marketing", "digital", "seo", "advertising"],
                "industry_tags": ["marketing", "digital", "ecommerce"]
            }
        ],
        "manufacturing": [
            {
                "skill_id": "quality_control",
                "canonical_name": "Quality Control",
                "aliases": ["QC", "Quality Assurance", "QA", "Product Quality"],
                "description": "Knowledge of quality control processes and standards",
                "keywords": ["quality", "control", "assurance", "standards"],
                "industry_tags": ["manufacturing", "quality"]
            },
            {
                "skill_id": "lean_manufacturing",
                "canonical_name": "Lean Manufacturing",
                "aliases": ["Lean Principles", "Six Sigma", "Process Improvement", "Operational Excellence"],
                "description": "Knowledge of lean manufacturing principles and process optimization",
                "keywords": ["lean", "manufacturing", "process", "improvement"],
                "industry_tags": ["manufacturing", "process"]
            }
        ]
    }
}

# Skill competency ranges by category
COMPETENCY_RANGES = {
    "technical_skills": {
        "min": 1,
        "max": 100,
        "beginner": (1, 30),
        "intermediate": (31, 60),
        "advanced": (61, 80),
        "expert": (81, 100)
    },
    "soft_skills": {
        "min": 1,
        "max": 100,
        "developing": (1, 40),
        "proficient": (41, 70),
        "advanced": (71, 85),
        "expert": (86, 100)
    },
    "domain_knowledge": {
        "min": 1,
        "max": 100,
        "basic": (1, 35),
        "intermediate": (36, 65),
        "advanced": (66, 85),
        "expert": (86, 100)
    },
    "standard_operating_procedures": {
        "min": 1,
        "max": 100,
        "awareness": (1, 25),
        "understanding": (26, 50),
        "proficient": (51, 75),
        "expert": (76, 100)
    }
} 