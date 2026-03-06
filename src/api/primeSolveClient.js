import axiosInstance from './axiosInstance';
import { loginRedirect, logoutRedirect, getActiveAccount } from '@/auth/msalInstance';

// ──────────────────────────────────────────────────────────────
// Case conversion utilities
// ──────────────────────────────────────────────────────────────

function camelToSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Recursively convert object keys from camelCase to snake_case.
 */
function camelToSnakeKeys(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnakeKeys);
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = camelToSnakeKeys(value);
  }
  return result;
}

/**
 * Recursively convert object keys from snake_case to camelCase.
 */
function snakeToCamelKeys(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamelKeys);
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = snakeToCamelKeys(value);
  }
  return result;
}

// ──────────────────────────────────────────────────────────────
// Role mapping: PrimeSolve API roles → Base44 role strings
// ──────────────────────────────────────────────────────────────

const ROLE_MAP = {
  0: 'admin',
  1: 'advice_group',
  2: 'adviser',
  3: 'adviser',
  4: 'client',
};

const STRING_ROLE_MAP = {
  'admin': 'admin',
  'platformadmin': 'admin',
  'tenantadmin': 'advice_group',
  'advicegroup': 'advice_group',
  'advice_group': 'advice_group',
  'adviser': 'adviser',
  'advisor': 'adviser',
  'supportstaff': 'adviser',
  'client': 'client',
};

function mapPrimeSolveRole(roleValue) {
  if (typeof roleValue === 'number' || !isNaN(parseInt(roleValue))) {
    return ROLE_MAP[parseInt(roleValue)] || 'user';
  }
  if (typeof roleValue === 'string') {
    return STRING_ROLE_MAP[roleValue.toLowerCase()] || 'user';
  }
  return 'user';
}

// ──────────────────────────────────────────────────────────────
// Transform user data from PrimeSolve API format to Base44 format
// ──────────────────────────────────────────────────────────────

function transformUserResponse(apiUser) {
  if (!apiUser) return apiUser;

  // Convert keys from camelCase to snake_case first
  const user = camelToSnakeKeys(apiUser);

  // Map role integer to string
  const roleStr = mapPrimeSolveRole(apiUser.role ?? apiUser.Role);

  // Build full_name from firstName + lastName (original camelCase from API)
  const firstName = apiUser.firstName || apiUser.first_name || '';
  const lastName = apiUser.lastName || apiUser.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || user.full_name || apiUser.fullName || '';

  return {
    ...user,
    role: roleStr,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    email: apiUser.email || user.email,
    id: apiUser.id || user.id,
  };
}

// ──────────────────────────────────────────────────────────────
// Entity proxy factory
// ──────────────────────────────────────────────────────────────

/**
 * Creates a proxy object that mimics Base44 SDK entity interface.
 *
 * @param {string} endpoint - API endpoint path (e.g. 'users', 'clients')
 * @param {object} options - Additional options
 * @param {object} options.defaultFilter - Default query params applied to all requests
 */
function createEntityProxy(endpoint, options = {}) {
  const { defaultFilter = {} } = options;

  return {
    /**
     * Filter entities by query object.
     * Special case: filter({ id: someId }) → GET /{endpoint}/{someId} wrapped in array
     * Also supports additional sort/limit args: filter(queryObj, sortField, limit)
     */
    async filter(queryObj = {}, sortField, limit) {
      // Convert snake_case query keys to camelCase for API
      const apiQuery = snakeToCamelKeys({ ...defaultFilter, ...queryObj });

      // Special case: if only `id` is provided, fetch single record
      const queryKeys = Object.keys(queryObj);
      if (queryKeys.length === 1 && queryKeys[0] === 'id') {
        try {
          const response = await axiosInstance.get(`/${endpoint}/${queryObj.id}`);
          const item = camelToSnakeKeys(response.data);
          return [item];
        } catch (error) {
          if (error.response?.status === 404) return [];
          throw error;
        }
      }

      // Build query params
      const params = {};
      for (const [key, value] of Object.entries(apiQuery)) {
        params[key] = value;
      }
      if (sortField) params.sort = sortField;
      if (limit) params.limit = limit;

      const response = await axiosInstance.get(`/${endpoint}`, { params });
      const data = Array.isArray(response.data) ? response.data : (response.data?.items || response.data?.data || []);
      return data.map(camelToSnakeKeys);
    },

    /**
     * List entities with optional sort and limit.
     */
    async list(sortField, limit) {
      const params = { ...snakeToCamelKeys(defaultFilter) };
      if (sortField) params.sort = sortField;
      if (limit) params.limit = limit;

      const response = await axiosInstance.get(`/${endpoint}`, { params });
      const data = Array.isArray(response.data) ? response.data : (response.data?.items || response.data?.data || []);
      return data.map(camelToSnakeKeys);
    },

    /**
     * Create a new entity.
     */
    async create(data) {
      const apiData = snakeToCamelKeys(data);
      const response = await axiosInstance.post(`/${endpoint}`, apiData);
      return camelToSnakeKeys(response.data);
    },

    /**
     * Update an entity by ID.
     */
    async update(id, data) {
      const apiData = snakeToCamelKeys(data);
      const response = await axiosInstance.put(`/${endpoint}/${id}`, apiData);
      return camelToSnakeKeys(response.data);
    },

    /**
     * Delete an entity by ID.
     */
    async delete(id) {
      const response = await axiosInstance.delete(`/${endpoint}/${id}`);
      return response.data;
    },

    /**
     * Bulk create: POST each item sequentially.
     */
    async bulkCreate(items) {
      const results = [];
      for (const item of items) {
        const apiData = snakeToCamelKeys(item);
        const response = await axiosInstance.post(`/${endpoint}`, apiData);
        results.push(camelToSnakeKeys(response.data));
      }
      return results;
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Entity definitions (Base44 name → PrimeSolve endpoint)
// ──────────────────────────────────────────────────────────────

const entities = {
  Admin: createEntityProxy('users', { defaultFilter: { role: 0 } }),
  AdviceGroup: createEntityProxy('tenants'),
  Adviser: createEntityProxy('advisers'),
  Client: createEntityProxy('clients'),
  User: createEntityProxy('users'),
  FactFind: createEntityProxy('advice-requests'),
  SOARequest: createEntityProxy('advice-requests'),
  SOATemplate: createEntityProxy('soa-templates'),
  Ticket: createEntityProxy('tickets'),
  RiskProfile: createEntityProxy('risk-profiles'),
  ModelPortfolio: createEntityProxy('model-portfolios'),
  Principal: createEntityProxy('clients'),
  SoaExample: createEntityProxy('soa-examples'),
  SoaDocument: createEntityProxy('soa-documents'),
  CashflowModel: createEntityProxy('cashflow-models'),
  AdviceRecord: createEntityProxy('advice-records'),
  Document: createEntityProxy('documents'),
};

// ──────────────────────────────────────────────────────────────
// Auth adapter
// ──────────────────────────────────────────────────────────────

const auth = {
  /**
   * Get current user info from PrimeSolve API.
   */
  async me() {
    const response = await axiosInstance.get('/me');
    return transformUserResponse(response.data);
  },

  /**
   * Login via email/password — triggers MSAL redirect.
   * (PrimeSolve uses Entra ID; email/password form is no longer used directly)
   */
  async loginViaEmailPassword(_email, _password) {
    await loginRedirect();
    return {};
  },

  /**
   * Logout — triggers MSAL logout redirect.
   */
  async logout(redirectUrl) {
    await logoutRedirect(redirectUrl);
  },

  /**
   * Redirect to login page via MSAL.
   */
  async redirectToLogin(redirectUrl) {
    await loginRedirect(redirectUrl);
  },

  /**
   * Update the current user's profile.
   */
  async updateMe(data) {
    const account = getActiveAccount();
    // First get the current user to find their ID
    const meResponse = await axiosInstance.get('/me');
    const userId = meResponse.data.id;
    const apiData = snakeToCamelKeys(data);
    const response = await axiosInstance.put(`/users/${userId}`, apiData);
    return camelToSnakeKeys(response.data);
  },

  /**
   * Register a new user.
   */
  async register(data) {
    const apiData = snakeToCamelKeys(data);
    const response = await axiosInstance.post('/setup/register', apiData);
    return camelToSnakeKeys(response.data);
  },

  /**
   * Verify OTP — no-op placeholder (Entra ID handles verification).
   */
  async verifyOtp(data) {
    console.warn('verifyOtp is a no-op in PrimeSolve adapter; Entra ID handles verification.');
    return { success: true };
  },

  /**
   * Resend OTP — no-op placeholder.
   */
  async resendOtp(email) {
    console.warn('resendOtp is a no-op in PrimeSolve adapter; Entra ID handles verification.');
    return { success: true };
  },
};

// ──────────────────────────────────────────────────────────────
// Integrations adapter
// ──────────────────────────────────────────────────────────────

const integrations = {
  Core: {
    /**
     * Invoke LLM — POST to AI endpoint or no-op placeholder.
     */
    async InvokeLLM(params) {
      try {
        const response = await axiosInstance.post('/ai/invoke', params);
        return response.data;
      } catch (error) {
        console.warn('InvokeLLM failed, returning placeholder:', error.message);
        return { response: 'AI service is not available.' };
      }
    },

    /**
     * Upload a file — POST to files endpoint or no-op placeholder.
     */
    async UploadFile({ file }) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (error) {
        console.warn('UploadFile failed, returning placeholder:', error.message);
        return { file_url: '' };
      }
    },
  },
};

// ──────────────────────────────────────────────────────────────
// App logs adapter
// ──────────────────────────────────────────────────────────────

const appLogs = {
  /**
   * Log user activity — no-op (resolves immediately).
   */
  async logUserInApp(_pageName) {
    return;
  },
};

// ──────────────────────────────────────────────────────────────
// AI endpoint helpers (use axiosInstance directly for non-entity routes)
// ──────────────────────────────────────────────────────────────

const ai = {
  async generateSection(payload) {
    const response = await axiosInstance.post('/ai/generate-section', payload);
    return response.data;
  },

  async extractTemplate(payload) {
    const response = await axiosInstance.post('/ai/extract-template', payload);
    return response.data;
  },

  async refine(payload) {
    const response = await axiosInstance.post('/ai/refine', payload);
    return response.data;
  },
};

// ──────────────────────────────────────────────────────────────
// Document upload & extraction API helpers
// ──────────────────────────────────────────────────────────────

export const documentsApi = {
  /**
   * Upload a document for AI extraction.
   * @param {File} file - The file to upload
   * @param {string} clientId - The client ID
   * @param {string} [fileType] - Document type hint (tax_return, super_statements, etc.)
   * @returns {{ id, fileName, fileType, blobUrl, status, uploadedAt }}
   */
  async upload(file, clientId, fileType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);
    if (fileType) formData.append('fileType', fileType);

    const response = await axiosInstance.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return camelToSnakeKeys(response.data);
  },

  /**
   * Get all documents for a client.
   * @param {string} clientId
   * @returns {Array} documents
   */
  async getByClient(clientId) {
    const response = await axiosInstance.get('/documents', {
      params: { clientId },
    });
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(camelToSnakeKeys);
  },

  /**
   * Get a single document by ID (includes extractedSections).
   * @param {string} documentId
   * @returns {object} document
   */
  async getById(documentId) {
    const response = await axiosInstance.get(`/documents/${documentId}`);
    return camelToSnakeKeys(response.data);
  },

  /**
   * Poll a document until extraction completes or times out.
   * @param {string} documentId
   * @param {number} [maxAttempts=30] - Max polling attempts
   * @param {number} [intervalMs=2000] - Polling interval in ms
   * @returns {object} document with extractedSections
   */
  async pollUntilExtracted(documentId, maxAttempts = 30, intervalMs = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
      const doc = await this.getById(documentId);
      if (doc.status === 'Extracted' || doc.status === 'Confirmed') {
        return doc;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error('Document extraction timed out');
  },
};

// ──────────────────────────────────────────────────────────────
// SOA Document AI API helpers
// ──────────────────────────────────────────────────────────────

export const aiApi = {
  async generateSection(documentId, sectionId, additionalInstructions = '') {
    const response = await axiosInstance.post(
      `/soa-documents/${documentId}/generate/${sectionId}`,
      { additionalInstructions }
    );
    return response.data;
  },
  async generateAll(documentId) {
    const response = await axiosInstance.post(`/soa-documents/${documentId}/generate-all`);
    return response.data;
  },
  async complianceCheck(documentId) {
    const response = await axiosInstance.post(`/soa-documents/${documentId}/compliance-check`);
    return response.data;
  },
  async saveSection(documentId, sectionId, content) {
    const response = await axiosInstance.put(
      `/soa-documents/${documentId}/sections/${sectionId}`,
      { content }
    );
    return response.data;
  }
};

// ──────────────────────────────────────────────────────────────
// Export the adapter with the same `base44` name
// ──────────────────────────────────────────────────────────────

export const base44 = {
  auth,
  entities,
  integrations,
  appLogs,
  ai,
  documentsApi,
};
