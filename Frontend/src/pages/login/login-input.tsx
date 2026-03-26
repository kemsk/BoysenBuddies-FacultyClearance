import { useState, useEffect } from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Button } from "../../stories/components/button";

export default function LoginInput() {
  // Check for error parameters in URL during initial render
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const errorParam = urlParams.get('error');
  
  const getInitialError = () => {
    if (errorParam === 'role_mismatch') {
      return "You don't have the required permissions for this login type. Please select the correct account type.";
    } else if (errorParam === 'no_role_selected') {
      return "Please select your account type from the login page to continue.";
    } else if (errorParam === 'invalid_role') {
      return "Invalid login type detected. Please select your account type from the options below.";
    }
    return "";
  };

  const [error, setError] = useState<string>(getInitialError());

  useEffect(() => {
    // Clear the error parameter from URL after initial render
    if (errorParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [errorParam]);

  const handleLogin = (role: string) => {
    setError("");
    
    // Store the intended role in session storage for validation after OAuth
    sessionStorage.setItem('intended_role', role);
    
    // Redirect to Google OAuth with role parameter
    window.location.assign(`/accounts/login/google/?role=${role}`);
  };

  return (
    <div className="login-container bg-primary text-primary-foreground min-h-screen flex justify-center items-center p-4">

      {/* LOGIN PANEL */}
      <div className="w-full bg-primary p-8 flex flex-col items-center px-0">

      {/* Login Header */}
        <div className="w-full max-w-screen-sm px-3 flex flex-col items-center gap-8">

        <img src="/public/RemoveBG_Logomark.png" className="w-full max-w-[28%] h-auto -mt-12" />

        <div>Welcome to</div>

        <div className="flex w-full items-center justify-center gap-5">

          <img
            src="/static/frontend/Pen Swish White_FacultyClearTrack.png"
            className="h-24 w-auto flex-shrink-0"
          />
          <div className="text-left leading-tight">
            <div className="text-3xl font-bold text-white">XU Faculty</div>
            <div className="text-3xl font-bold text-white">ClearTrack</div>
          </div>
        </div>
        </div>

      

      {/* Login Form */}
      <div className="mt-5 p-8 w-full max-w-md">

        {error ? (
          <div className="mb-4 text-sm text-red-200">{error}</div>
        ) : null}

        <div className="login-input mb-4 flex flex-col gap-2">
        
          {/* Primary login button */}
          <Button
            type="button"
            variant="white"
            className="w-full border border-gray-300 bg-white px-4 text-black"
            onClick={() => handleLogin('faculty')}
          >
            <span className="flex w-full items-center">
              <img
                src="/GoogleIcon.png"
                alt="Google"
                className="h-4 w-4 flex-shrink-0 object-contain"
              />
              <span className="flex-1 text-center text-sm font-medium">Sign in with Google</span>
            </span>
          </Button>

        </div>
        
      </div>
      </div>
    </div>
  );
}
