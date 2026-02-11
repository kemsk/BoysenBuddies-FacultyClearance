import React, { useState } from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Checkbox } from "../../stories/components/checkbox";
import { Divider } from "../../stories/components/divider";
import { Button } from "../../stories/components/button";
import { Input } from "../../stories/components/input";
import { authService, LoginResponse } from "../../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response: LoginResponse = await authService.login(email, password);
      
      if (response.success && response.requires_pin) {
        // Redirect to PIN verification page
        window.location.href = "/login/otp";
      } else if (response.success && response.user_info?.dashboard_url) {
        // Login successful, redirect to role-specific dashboard
        window.location.href = response.user_info.dashboard_url;
      } else if (response.success) {
        // Fallback to default dashboard
        window.location.href = "/dashboard";
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authService.loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google login failed");
    }
  };

  const handleSSOLogin = async () => {
    try {
      // For demonstration, we'll use a mock SSO token
      // In production, this would come from your SSO provider
      const ssoToken = "mock-sso-token-" + Date.now();
      const response = await authService.loginWithSSO(ssoToken, 'default');
      
      if (response.success && response.user_info?.dashboard_url) {
        // SSO login successful, redirect to role-specific dashboard
        window.location.href = response.user_info.dashboard_url;
      } else if (response.success) {
        // Fallback to default dashboard
        window.location.href = "/dashboard";
      } else {
        setError(response.message || "SSO login failed");
      }
    } catch (err: any) {
      setError(err.message || "SSO login failed");
    }
  };

  return (
    <div className="login-container bg-primary text-primary-foreground min-h-screen flex justify-center items-center p-4">

      {/* LOGIN PANEL */}
      <div className="w-full bg-primary p-8 flex flex-col items-center px-0">

      {/* Logos */}
        <div className="w-full max-w-screen-sm px-3 flex flex-col items-center gap-8">

        <img src="/public/RemoveBG_Logomark.png" className="w-full max-w-[40%] h-auto -mt-12" />

        {/* App Logo + Title */}
        <div className="flex items-center justify-center gap-5 w-full">

          <img src="/public/Pen Swish White_FacultyClearTrack.png" className="w-full max-w-[30%] h-auto" />

          <h1 className="text-center font-bold leading-[1.05] max-w-[20rem] text-[clamp(1.75rem,7vw,2.75rem)]">
            XU Faculty <br /> ClearTrack
          </h1>

        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-md mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="mt-5 p-8 w-full max-w-md">

        {/* Username input + checkbox */}
        <div className="login-input mb-4 flex flex-col gap-2">
          <Input  
            type="email"
            id="email"
            name="email"
            required
            className="input-field"
            placeholder="Enter your XU Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <div className="flex items-center gap-2 mt-2">
            <Checkbox variant="outline"/>
            <p className="text-sm text-white-background">
              Keep Me logged in
            </p>
          </div>
        </div>

        {/* Password input */}
        <div className="login-input mb-4 flex flex-col gap-2">
          <Input  
            type="password"
            id="password"
            name="password"
            required
            className="input-field"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Buttons + Divider */}
        <div className="login-input flex flex-col gap-4">
          {/* Primary login button */}
          <Button 
            variant="secondary" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>

          {/* Divider with OR */}
          <div className="flex items-center gap-2">
            <Divider className="flex-grow" />
            <span className="text-sm text-muted-foreground">or</span>
            <Divider className="flex-grow" />
          </div>

          {/* SSO login button */}
          <Button 
            variant="outline" 
            className="group"
            type="button"
            onClick={handleSSOLogin}
            disabled={isLoading}
          >
            <i className="fas fa-university mr-2"></i>
            Sign in with SSO
          </Button>

          {/* Outline Google login button */}
          <Button 
            variant="outline" 
            className="group"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <span className="relative w-5 h-5 mr-0 inline-block">
              <img src="/public/whiteGoogleLogo.png" alt="Google Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-100 group-hover:opacity-0" />
              <img src="/public/BlackGoogleLogo.png" alt="Google Icon hover" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-0 group-hover:opacity-100" />
            </span>
            Sign in with Google
          </Button>
        </div>
        
      </form>
      </div>
    </div>
  );
}

