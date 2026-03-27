import { useState, useEffect } from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Progress } from "../../stories/components/progress";
import { authService } from "../../services/authService";

export default function LoginPrompt() {
  const [progress, setProgress] = useState(0);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 5 : 100));
    }, 200); // increase 5% every 200ms

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  useEffect(() => {
    if (progress < 100) return;

    const resolveAndRedirect = async () => {
      try {
        // Handle OAuth callback if this is the initial authentication
        authService.handleOAuthCallback();
        
        // Check if we have a selected role from session storage
        const selectedRoleStr = sessionStorage.getItem('selected_role');
        if (!selectedRoleStr) {
          console.log('LOGIN_PROMPT: No selected role found, this is initial OAuth callback');
          
          // Wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try to get auth status, but if it fails, still redirect to role selection
          try {
            const authStatus = await authService.getAuthStatus();
            console.log('LOGIN_PROMPT: Auth status after OAuth callback:', authStatus);
            
            if (!authStatus.authenticated || !authStatus.user_info) {
              console.log('LOGIN_PROMPT: Auth status not ready, but proceeding to role selection');
            }
          } catch (error) {
            console.log('LOGIN_PROMPT: Auth status check failed, but proceeding to role selection:', error);
          }
          
          // This is the initial OAuth callback, redirect to role selection
          console.log('LOGIN_PROMPT: Redirecting to role selection page');
          window.location.replace('http://localhost:8001/login');
          return;
        }

        // If we have a selected role, show authentication verification
        const role = JSON.parse(selectedRoleStr);
        setSelectedRole(role);
        console.log('LOGIN_PROMPT: Selected role for verification:', role);

        // Get user authentication status
        const authStatus = await authService.getAuthStatus();
        console.log('LOGIN_PROMPT: Auth status:', authStatus);
        
        if (!authStatus.authenticated || !authStatus.user_info) {
          console.log('LOGIN_PROMPT: User not authenticated, redirecting to login');
          window.location.replace('http://localhost:8001/?error=authentication_failed');
          return;
        }

        setUserInfo(authStatus.user_info);

        // Verify user has the selected role
        const userRoleValue = authStatus.user_info.role_value;
        if (userRoleValue !== role.value) {
          console.log('LOGIN_PROMPT: Role mismatch, user role:', userRoleValue, 'selected role:', role.value);
          sessionStorage.removeItem('selected_role');
          window.location.replace('http://localhost:8001/login?error=role_mismatch');
          return;
        }

        // Wait a moment to show the verification screen
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Role-based dashboard mapping
        const roleDashboardMap: Record<number, string> = {
          1: '/CISO-dashboard',
          2: '/OVPHE-dashboard', 
          3: '/approver-dashboard',
          4: '/assistant-approver-dashboard',
          5: '/faculty-dashboard',
        };

        const target = roleDashboardMap[role.value] || '/faculty-dashboard';
        console.log('LOGIN_PROMPT: Redirecting to dashboard:', target);
        
        // Clear selected role from session storage
        sessionStorage.removeItem('selected_role');
        
        // Redirect to the appropriate dashboard
        window.location.replace(target);
        
      } catch (error) {
        console.error('LOGIN_PROMPT: Error during authentication:', error);
        if (error instanceof Error && error.message.includes('401')) {
          window.location.replace('http://localhost:8001/?error=unauthorized');
        } else {
          window.location.replace('http://localhost:8001/?error=authentication_failed');
        }
      }
    };

    resolveAndRedirect();
  }, [progress]);

  return (
    <div className="login-container bg-primary text-primary-foreground min-h-screen flex justify-center items-center p-0">
      <div className="text-center space-y-6">
        <div className="mb-8">
          <img 
            src="/public/XU-Logo.png" 
            alt="Xavier University" 
            className="mx-auto w-24 h-24"
          />
        </div>
        
        {/* Show different content based on whether we have a selected role */}
        {selectedRole && userInfo ? (
          // Authentication verification screen
          <>
            <h1 className="text-3xl font-bold text-white mb-4">Verifying Authentication</h1>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
              <div className="text-white">
                <p className="text-lg">Welcome, {userInfo.first_name} {userInfo.last_name}</p>
                <p className="text-sm opacity-75">{userInfo.email}</p>
              </div>
              
              <div className="border-t border-white/20 pt-4">
                <p className="text-white text-sm mb-2">Selected Role:</p>
                <p className="text-xl font-semibold text-white">{selectedRole.display_name}</p>
              </div>
              
              <div className="text-white text-sm opacity-75">
                <p>Redirecting to your dashboard...</p>
              </div>
            </div>
            
            <div className="w-full max-w-md">
              <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white text-sm mt-2">{progress}% Complete</p>
            </div>
          </>
        ) : (
          // Initial authentication screen
          <>
            <h1 className="text-3xl font-bold text-white mb-4">Authenticating...</h1>
            <div className="w-full max-w-md">
              <Progress value={progress} className="w-full" />
              <p className="text-white text-sm mt-2">{progress}% Complete</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
