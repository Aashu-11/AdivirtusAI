import { countries } from 'countries-list'

// Convert countries object to array of options
export const countryOptions = Object.entries(countries).map(([code, country]) => ({
  value: code,
  label: country.name
})).sort((a, b) => a.label.localeCompare(b.label))

// Predefined departments
export const departmentOptions = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'legal', label: 'Legal' },
  { value: 'customer_support', label: 'Customer Support' },
  { value: 'research', label: 'Research & Development' },
  { value: 'other', label: 'Other' }
]

// Predefined job titles
export const jobTitleOptions = [
  // Engineering
  { value: 'software_engineer', label: 'Software Engineer' },
  { value: 'frontend_engineer', label: 'Frontend Engineer' },
  { value: 'backend_engineer', label: 'Backend Engineer' },
  { value: 'fullstack_engineer', label: 'Full Stack Engineer' },
  { value: 'devops_engineer', label: 'DevOps Engineer' },
  { value: 'qa_engineer', label: 'QA Engineer' },
  { value: 'security_engineer', label: 'Security Engineer' },
  { value: 'data_engineer', label: 'Data Engineer' },
  { value: 'ml_engineer', label: 'Machine Learning Engineer' },
  { value: 'systems_engineer', label: 'Systems Engineer' },
  
  // Product
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'product_designer', label: 'Product Designer' },
  { value: 'product_analyst', label: 'Product Analyst' },
  
  // Design
  { value: 'ui_designer', label: 'UI Designer' },
  { value: 'ux_designer', label: 'UX Designer' },
  { value: 'graphic_designer', label: 'Graphic Designer' },
  { value: 'interaction_designer', label: 'Interaction Designer' },
  
  // Marketing
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'content_marketer', label: 'Content Marketer' },
  { value: 'digital_marketer', label: 'Digital Marketer' },
  { value: 'social_media_manager', label: 'Social Media Manager' },
  { value: 'seo_specialist', label: 'SEO Specialist' },
  
  // Sales
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'sales_representative', label: 'Sales Representative' },
  { value: 'account_executive', label: 'Account Executive' },
  { value: 'sales_engineer', label: 'Sales Engineer' },
  
  // Operations
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'program_manager', label: 'Program Manager' },
  { value: 'scrum_master', label: 'Scrum Master' },
  
  // Finance
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'financial_analyst', label: 'Financial Analyst' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'controller', label: 'Controller' },
  
  // HR
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'hr_business_partner', label: 'HR Business Partner' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'talent_manager', label: 'Talent Manager' },
  
  // Legal
  { value: 'general_counsel', label: 'General Counsel' },
  { value: 'legal_counsel', label: 'Legal Counsel' },
  { value: 'compliance_officer', label: 'Compliance Officer' },
  
  // Customer Support
  { value: 'customer_support_manager', label: 'Customer Support Manager' },
  { value: 'customer_success_manager', label: 'Customer Success Manager' },
  { value: 'support_specialist', label: 'Support Specialist' },
  
  // Research
  { value: 'research_scientist', label: 'Research Scientist' },
  { value: 'data_scientist', label: 'Data Scientist' },
  { value: 'research_analyst', label: 'Research Analyst' },
  
  // Other
  { value: 'other', label: 'Other' }
] 