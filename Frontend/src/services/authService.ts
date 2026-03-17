const API_BASE_URL = '';

export interface LoginResponse {
  success: boolean;
  message: string;
  requires_pin?: boolean;
  user_info?: {
    id?: number;
    email: string;
    first_name: string;
    last_name: string;
    role_value?: number;
    role_name?: string;
    university_id?: string;
    dashboard_url?: string;
  };
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
      const response = await fetch(`${API_BASE_URL}/logout`, {
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

      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getAuthStatus(): Promise<AuthStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get auth status');
      }

      return await response.json();
    } catch (error) {
      console.error('Auth status error:', error);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      // Direct redirect to Google OAuth endpoint
      window.location.href = `${API_BASE_URL}/login/google/`;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
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
    // This is a simple check - you might want to implement a more robust solution
    return document.cookie.includes('sessionid');
  }

  // Get current user info from session storage or make an API call
  async getCurrentUser() {
    try {
      const authStatus = await this.getAuthStatus();
      return authStatus.user_info;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Role-based access checking
  canAccessFolder(folderName: string): boolean {
    const roleAccessMap = {
      1: ['ciso'],      // CISO
      2: ['ovphe'],     // OVPHE
      3: ['approver'],  // APPROVER
      4: ['assistant'], // ASSISTANT_APPROVER
      5: ['faculty'],   // FACULTY
    };

    const userInfo = this.getCurrentUserFromSession();
    if (!userInfo || !userInfo.role_value) return false;

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
    // This would typically come from your app's state management
    // For now, return null - you'd implement this based on your state management
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
