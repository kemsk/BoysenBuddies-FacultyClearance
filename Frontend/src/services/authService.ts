const API_BASE_URL = '';

export interface LoginResponse {
  ok: boolean;
  token?: string;
  email: string;
  roles: string[];
  redirect: string;
  message?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user_info?: {
    email: string;
    role_value: number;
    role_name: string;
    first_name: string;
    last_name: string;
  };
}

class AuthService {
  private getCSRFToken(): string {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return decodeURIComponent(value);
      }
    }
    return '';
  }

  // Store JWT token
  setToken(token: string): void {
    console.log('AUTH_SERVICE: Storing JWT token:', token);
    localStorage.setItem('jwt_token', token);
  }

  // Get JWT token
  getToken(): string | null {
    const token = localStorage.getItem('jwt_token');
    console.log('AUTH_SERVICE: Retrieved JWT token:', token);
    return token;
  }

  // Clear JWT token
  clearToken(): void {
    console.log('AUTH_SERVICE: Clearing JWT token');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
  }

  // Add JWT to request headers
  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('AUTH_SERVICE: Adding Authorization header:', `Bearer ${token.substring(0, 50)}...`);
    } else {
      console.log('AUTH_SERVICE: No JWT token available for Authorization header');
    }
    
    return headers;
  }




  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async verifyPin(pin: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({ user_pin: pin }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'PIN verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('PIN verification error:', error);
      throw error;
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('AUTH_SERVICE: Initiating logout');

      this.clearToken();

      const response = await fetch(`${API_BASE_URL}/admin/xu-faculty-clearance/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      const result = await response.json();
      console.log('AUTH_SERVICE: Logout successful', result);
      return result;
    } catch (error) {
      console.error('AUTH_SERVICE: Logout error:', error);
      throw error;
    }
  }

  async getAuthStatus(): Promise<AuthStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/xu-faculty-clearance/api/me`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return { authenticated: false };
      }

      const userData = await response.json();
      console.log('AUTH_SERVICE: Auth status successful:', userData);
      
      return {
        authenticated: true,
        user_info: {
          email: userData.email,
          role_value: userData.role_value,
          role_name: userData.role_name,
          first_name: userData.first_name,
          last_name: userData.last_name,
        }
      };
    } catch (error) {
      console.error('AUTH_SERVICE: Auth status error:', error);
      return { authenticated: false };
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      console.log('AUTH_SERVICE: Initiating Google OAuth login');
      // Direct redirect to Google OAuth endpoint
      window.location.href = `${API_BASE_URL}/accounts/login/google/`;
    } catch (error) {
      console.error('AUTH_SERVICE: Google login error:', error);
      throw error;
    }
  }

  // Handle OAuth callback with JWT token
  handleOAuthCallback(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      console.log('AUTH_SERVICE: Received JWT token from OAuth callback:', token);
      this.setToken(token);
      
      // Store user info (would need to get from token or API)
      const userInfo = this.parseJWT(token);
      if (userInfo) {
        localStorage.setItem('user_info', JSON.stringify({
          email: userInfo.email,
          roles: userInfo.roles || []
        }));
      }
      
      // Remove token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      console.log('AUTH_SERVICE: No token found in OAuth callback');
    }
  }

  // Parse JWT token (simple implementation)
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('AUTH_SERVICE: Error parsing JWT:', error);
      return null;
    }
  }

  async loginWithSSO(email: string, password: string, provider: string = 'default'): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login/sso/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email,
          password: password,
          sso_provider: provider
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'SSO login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('SSO login error:', error);
      throw error;
    }
  }

  async loginWithSSOToken(ssoToken: string, provider: string = 'default'): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login/sso/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({ 
          sso_token: ssoToken,
          sso_provider: provider
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'SSO login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('SSO login error:', error);
      throw error;
    }
  }

  // Get supported SSO providers
  async getSSOProviders(): Promise<{ message: string; supported_providers: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/login/sso/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get SSO providers');
      }

      return await response.json();
    } catch (error) {
      console.error('SSO providers error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return document.cookie.includes('sessionid');
  }

  // Get current user info from JWT token
  async getCurrentUser() {
    try {
      const authStatus = await this.getAuthStatus();
      console.log('AUTH_SERVICE: Current user from auth status:', authStatus.user_info);
      return authStatus.user_info;
    } catch (error) {
      console.error('AUTH_SERVICE: Failed to get current user:', error);
      return null;
    }
  }

  // Role-based access checking
  canAccessFolder(folderName: string): boolean {
    const userInfo = this.getCurrentUserFromSession();
    if (!userInfo || !userInfo.role_value) return false;

    const roleAccessMap = {
      1: ['ciso'],      // CISO
      2: ['ovphe'],     // OVPHE
      3: ['approver'],  // APPROVER
      4: ['assistant'], // ASSISTANT_APPROVER
      5: ['faculty'],   // FACULTY
    };

    const accessibleFolders = roleAccessMap[userInfo.role_value as keyof typeof roleAccessMap] || [];
    return accessibleFolders.includes(folderName);
  }

  hasRole(roleValue: number): boolean {
    const userInfo = this.getCurrentUserFromSession();
    return userInfo?.role_value === roleValue;
  }

  isCISO(): boolean { return this.hasRole(1); }
  isOVPHE(): boolean { return this.hasRole(2); }
  isApprover(): boolean { return this.hasRole(3); }
  isAssistant(): boolean { return this.hasRole(4); }
  isFaculty(): boolean { return this.hasRole(5); }

  private getCurrentUserFromSession(): { role_value?: number; } | null {
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
      try {
        return JSON.parse(userInfoStr);
      } catch (error) {
        console.error('AUTH_SERVICE: Error parsing user info from session:', error);
      }
    }
    return null;
  }

  // Get role display name
  getRoleName(roleValue: number): string {
    const roleNames = {
      1: 'CISO',
      2: 'OVPHE',
      3: 'APPROVER',
      4: 'ASSISTANT_APPROVER',
      5: 'FACULTY'
    };
    return roleNames[roleValue as keyof typeof roleNames] || 'Unknown';
  }

  // Get dashboard URL for role
  getDashboardUrl(roleValue: number): string {
    const dashboardPaths = {
      1: '/CISO-dashboard',
      2: '/OVPHE-dashboard',
      3: '/approver-dashboard',
      4: '/assistant-approver-dashboard',
      5: '/faculty-dashboard'
    };
    return dashboardPaths[roleValue as keyof typeof dashboardPaths] || '/faculty-dashboard';
  }

  // Get current user's dashboard URL
  async getCurrentUserDashboardUrl(): Promise<string> {
    try {
      const authStatus = await this.getAuthStatus();
      if (authStatus.authenticated && authStatus.user_info) {
        return this.getDashboardUrl(authStatus.user_info.role_value);
      }
      return '/login';
    } catch (error) {
      console.error('Failed to get dashboard URL:', error);
      return '/login';
    }
  }
}

export const authService = new AuthService();
