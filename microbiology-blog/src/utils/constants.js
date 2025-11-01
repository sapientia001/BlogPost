// User roles
export const USER_ROLES = {
  READER: 'reader',
  RESEARCHER: 'researcher',
  ADMIN: 'admin',
};

// Post status
export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PENDING: 'pending',
  ARCHIVED: 'archived',
};

// Category types
export const CATEGORY_TYPES = {
  BACTERIOLOGY: 'bacteriology',
  VIROLOGY: 'virology',
  MYCOLOGY: 'mycology',
  PARASITOLOGY: 'parasitology',
  IMMUNOLOGY: 'immunology',
  MICROBIAL_GENETICS: 'microbial_genetics',
  ENVIRONMENTAL_MICROBIOLOGY: 'environmental_microbiology',
  INDUSTRIAL_MICROBIOLOGY: 'industrial_microbiology',
  MEDICAL_MICROBIOLOGY: 'medical_microbiology',
};

// Validation constants
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
  },
  POST: {
    TITLE_MAX_LENGTH: 200,
    EXCERPT_MAX_LENGTH: 300,
  },
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [5, 10, 20, 50],
};