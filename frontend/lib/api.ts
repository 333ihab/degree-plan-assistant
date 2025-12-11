import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Making API request to:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Signup Step 1: Create account with email and password
  signupStep1: async (email: string, password: string) => {
    const response = await api.post('/auth/signup/step1', {
      email,
      password,
    });
    return response.data;
  },

  // Signup Step 2: Verify confirmation code
  signupStep2: async (userId: string, code: string) => {
    const response = await api.post('/auth/signup/verify', {
      userId,
      code,
    });
    return response.data;
  },

  // Signup Step 3: Complete profile
  signupStep3: async (userId: string, profileData: {
    fullName: string;
    school: string;
    major?: string;
    classification?: string;
  }) => {
    const response = await api.post('/auth/signup/step3', {
      userId,
      ...profileData,
    });
    return response.data;
  },

  // Login Step 1: Login with email and password, get verification code
  loginStep1: async (email: string, password: string) => {
    const response = await api.post('/auth/login/step1', {
      email,
      password,
    });
    return response.data;
  },

  // Login Step 2: Verify login code and get JWT token
  loginStep2: async (userId: string, code: string) => {
    const response = await api.post('/auth/login/verify', {
      userId,
      code,
    });
    return response.data;
  },
};

export const adminAPI = {
  // Create admin user (for initial setup)
  createAdmin: async (adminData?: {
    email?: string;
    fullName?: string;
    school?: string;
  }) => {
    const response = await api.post("/admin/create", adminData || {});
    return response.data;
  },

  loginStep1: async (adminId: string, password: string) => {
    const response = await api.post("/admin/login/step1", {
      adminId,
      password,
    });
    return response.data;
  },

  loginStep2: async (userId: string, code: string) => {
    const response = await api.post("/admin/login/verify", {
      userId,
      code,
    });
    return response.data;
  },

  listStudents: async () => {
    const response = await api.get("/admin/students");
    return response.data;
  },

  searchStudents: async (query: string) => {
    const response = await api.get("/admin/students/search", {
      params: { query },
    });
    return response.data;
  },

  listMentors: async () => {
    const response = await api.get("/admin/mentors");
    return response.data;
  },

  listAdvisors: async () => {
    const response = await api.get("/admin/advisors");
    return response.data;
  },

  promoteStudentToMentor: async (studentId: string) => {
    const response = await api.post(`/admin/students/${studentId}/make-mentor`);
    return response.data;
  },

  assignMentor: async (studentId: string, mentorId: string) => {
    const response = await api.post(`/admin/students/${studentId}/assign-mentor`, {
      mentorId,
    });
    return response.data;
  },

  assignAdvisor: async (studentId: string, advisorId: string) => {
    const response = await api.post(`/admin/students/${studentId}/assign-advisor`, {
      advisorId,
    });
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await api.get("/admin/users/search", {
      params: { query },
    });
    return response.data;
  },

  makeUserAdvisor: async (userId: string) => {
    const response = await api.post(`/admin/users/${userId}/make-advisor`);
    return response.data;
  },
};

export const advisorAPI = {
  getAssignedStudents: async () => {
    const response = await api.get("/advisor/assigned-students");
    return response.data;
  },
};

export const mentorAPI = {
  getAssignedStudents: async () => {
    const response = await api.get("/mentor/assigned-students");
    return response.data;
  },
};

// --- NEW: ADVISING AGENT API ---

export type ApiResponse = {
  success: boolean;
  analysis: string;
}

// --- UPDATED ADVISING FUNCTION ---
export const sendAdvisingRequest = async (
  currentQuestion: string,
  history: { sender: 'user' | 'assistant'; content: string }[], // New History Parameter
  transcriptFile: File
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();

    // 1. Format the history into a string context
    // We take the last 6 messages to keep the prompt size manageable
    const recentHistory = history.slice(-6).map(msg => 
      `${msg.sender === 'user' ? 'Student' : 'Advisor'}: ${msg.content}`
    ).join('\n');

    // 2. Combine History + New Question
    const fullPrompt = `
      CONTEXT FROM PREVIOUS MESSAGES:
      ${recentHistory}

      CURRENT QUESTION:
      ${currentQuestion}
      `;

    // 3. Append to FormData
    formData.append('question', fullPrompt); 
    formData.append('transcript', transcriptFile);

    const response = await api.post('/analyze-plan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const newResponse = response.data.analysis
    return newResponse;
  } catch (error) {
    console.error("Advising Request Failed:", error);
    return {
      success: false,
      analysis: "**System Error:** Failed to connect to advisor."
    };
  }
}

export default api;