/**
 * Seed catalog for the career knowledge graph.
 *
 * JobRole nodes are connected to Skill nodes through REQUIRES_SKILL
 * relationships. The catalog makes it possible to compute a skill gap and
 * role-readiness score even before the platform has seen many resumes.
 */
const SKILL_ALIASES = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  'react.js': 'React',
  reactjs: 'React',
  react: 'React',
  'next.js': 'Next.js',
  nextjs: 'Next.js',
  node: 'Node.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  expressjs: 'Express',
  'express.js': 'Express',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  'rest api': 'REST APIs',
  'rest apis': 'REST APIs',
  rest: 'REST APIs',
  html5: 'HTML',
  css3: 'CSS',
  tailwind: 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  ml: 'Machine Learning',
  'machine learning': 'Machine Learning',
  ai: 'Artificial Intelligence',
  nlp: 'Natural Language Processing',
  llm: 'Large Language Models',
  'llms': 'Large Language Models',
  'ci/cd': 'CI/CD',
  cicd: 'CI/CD',
  k8s: 'Kubernetes',
  aws: 'AWS',
  gcp: 'GCP',
  'google cloud': 'GCP',
  'power bi': 'Power BI',
  powerbi: 'Power BI',
  'ui/ux': 'UI/UX Design',
  ux: 'UX Design',
  ui: 'UI Design',
  'data analysis': 'Data Analysis',
  'data visualization': 'Data Visualization',
};

const ROLE_CATALOG = [
  {
    name: 'Frontend Developer',
    core: [
      'JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Tailwind CSS',
      'REST APIs', 'Git', 'Responsive Design', 'Accessibility', 'Testing',
    ],
    niceToHave: ['Next.js', 'Redux', 'Vite', 'GraphQL', 'Jest', 'Storybook', 'Cypress'],
  },
  {
    name: 'Backend Developer',
    core: [
      'Node.js', 'Express', 'REST APIs', 'MongoDB', 'SQL', 'PostgreSQL',
      'Redis', 'Docker', 'Git', 'Authentication', 'Microservices',
    ],
    niceToHave: ['TypeScript', 'GraphQL', 'Message Queues', 'AWS', 'Kubernetes', 'System Design'],
  },
  {
    name: 'Full Stack Developer',
    core: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB',
      'SQL', 'REST APIs', 'HTML', 'CSS', 'Git', 'Docker',
    ],
    niceToHave: ['Next.js', 'GraphQL', 'Redis', 'AWS', 'CI/CD', 'PostgreSQL', 'System Design'],
  },
  {
    name: 'Data Scientist',
    core: [
      'Python', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'Statistics',
      'Machine Learning', 'Data Visualization', 'Data Cleaning', 'Git',
    ],
    niceToHave: ['TensorFlow', 'PyTorch', 'Spark', 'NLP', 'A/B Testing', 'Deep Learning'],
  },
  {
    name: 'Data Analyst',
    core: [
      'SQL', 'Excel', 'Python', 'Tableau', 'Power BI', 'Data Visualization',
      'Statistics', 'Data Cleaning', 'Reporting', 'ETL',
    ],
    niceToHave: ['Looker', 'R', 'Snowflake', 'dbt', 'A/B Testing', 'Data Modeling'],
  },
  {
    name: 'Machine Learning Engineer',
    core: [
      'Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Deep Learning',
      'SQL', 'Docker', 'Kubernetes', 'MLOps', 'Machine Learning', 'Git',
    ],
    niceToHave: ['MLflow', 'Spark', 'NLP', 'Computer Vision', 'AWS', 'Large Language Models', 'Vector Databases'],
  },
  {
    name: 'DevOps Engineer',
    core: [
      'Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform',
      'Ansible', 'Jenkins', 'Git', 'Monitoring', 'Bash', 'Networking',
    ],
    niceToHave: ['Prometheus', 'Grafana', 'ArgoCD', 'Helm', 'Python', 'Security'],
  },
  {
    name: 'Cloud Engineer',
    core: [
      'AWS', 'Azure', 'GCP', 'Terraform', 'Kubernetes', 'Docker', 'Linux',
      'Networking', 'IAM', 'CI/CD', 'Python',
    ],
    niceToHave: ['Serverless', 'CloudFormation', 'Monitoring', 'Security', 'Cost Optimization'],
  },
  {
    name: 'Mobile Developer',
    core: [
      'Swift', 'Kotlin', 'React Native', 'Flutter', 'Dart', 'iOS', 'Android',
      'REST APIs', 'Git', 'Firebase', 'UI Design',
    ],
    niceToHave: ['TypeScript', 'GraphQL', 'SwiftUI', 'Jetpack Compose', 'App Store Deployment'],
  },
  {
    name: 'Cybersecurity Analyst',
    core: [
      'Networking', 'Linux', 'Security', 'SIEM', 'Incident Response', 'Firewalls',
      'Vulnerability Assessment', 'Python', 'Cryptography', 'Risk Assessment',
    ],
    niceToHave: ['Penetration Testing', 'Splunk', 'Wireshark', 'AWS Security', 'ISO 27001'],
  },
  {
    name: 'Product Manager',
    core: [
      'Product Strategy', 'Roadmapping', 'User Research', 'Analytics', 'Agile',
      'Stakeholder Management', 'A/B Testing', 'SQL', 'Communication', 'Wireframing',
    ],
    niceToHave: ['Jira', 'Figma', 'OKRs', 'Go-to-Market', 'Data Visualization'],
  },
  {
    name: 'UI/UX Designer',
    core: [
      'Figma', 'User Research', 'Wireframing', 'Prototyping', 'Interaction Design',
      'Visual Design', 'Usability Testing', 'Design Systems', 'Accessibility', 'HTML', 'CSS',
    ],
    niceToHave: ['Framer', 'Adobe XD', 'Illustration', 'Motion Design', 'Frontend Development'],
  },
  {
    name: 'Software Engineer',
    core: [
      'JavaScript', 'Python', 'Java', 'Data Structures', 'Algorithms', 'Git',
      'SQL', 'REST APIs', 'Testing', 'Docker', 'System Design', 'Agile',
    ],
    niceToHave: ['TypeScript', 'React', 'Node.js', 'AWS', 'Kubernetes', 'CI/CD'],
  },
  {
    name: 'Business Analyst',
    core: [
      'SQL', 'Excel', 'Requirements Gathering', 'Data Analysis', 'Stakeholder Management',
      'Agile', 'Process Modeling', 'Reporting', 'Communication',
    ],
    niceToHave: ['Tableau', 'Power BI', 'Jira', 'BPMN', 'Data Visualization'],
  },
];

module.exports = { ROLE_CATALOG, SKILL_ALIASES };
