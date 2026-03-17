import { useState } from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Button } from "../../stories/components/button";

export default function Login() {
  const [error, setError] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Redirect directly to Google OAuth since we only support OAuth now
    window.location.assign("/accounts/login/google/");
  };

  return (
    <div className="login-container bg-primary text-primary-foreground min-h-screen flex justify-center items-center p-4">

      {/* LOGIN PANEL */}
      <div className="w-full bg-primary p-8 flex flex-col items-center px-0">

      {/* Login Header */}
        <div className="w-full max-w-screen-sm px-3 flex flex-col items-center gap-8">

        <img src="/public/RemoveBG_Logomark.png" className="w-full max-w-[40%] h-auto -mt-12" />

        <div className="flex flex-col items-center gap-4 w-full">
          <h1 className="text-center font-bold leading-[1.05] text-[clamp(1.5rem,6vw,2.25rem)] text-white">
            Log in to XU Faculty ClearTrack
          </h1>

          <p className="text-center text-white/80 text-sm md:text-base max-w-md">
            Select your account type to continue
          </p>
        </div>

        </div>

      

      {/* Login Form */}
      <form className="mt-5 p-8 w-full max-w-md" onSubmit={handleLogin}>

        {error ? (
          <div className="mb-4 text-sm text-red-200">{error}</div>
        ) : null}

        {/* Username input + checkbox */}
        <div className="login-input mb-4 flex flex-col gap-2">
            
            {/* Outline Google login button */}
            <Button
            type="button"
            variant="white"
            alignment="left"
            className="group"
            size="mobileXL"
            onClick={() => {
              setError("");
              window.location.assign("/accounts/login/google/");
            }}
          >
            <div className="flex items-start gap-3">
              <span className="relative w-5 h-5 flex-shrink-0 mt-0.5">
                <img src="/public/PrimaryChecklistIcon.png" alt="Google Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-100 group-hover:opacity-0" />
                <img src="/public/WhiteChecklistIcon.png" alt="Hover Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-0 group-hover:opacity-100" />
              </span>
              <span className="flex-1 text-left">Faculty Member</span>
            </div>
          </Button>

          {/* Outline Google login button */}
          <Button
            type="button"
            variant="white"
            alignment="left"
            className="group"
            size="mobileXL"
            onClick={() => {
              setError("");
              window.location.assign("/accounts/login/google/");
            }}
          >
            <div className="flex items-start gap-3">
              <span className="relative w-5 h-5 flex-shrink-0 mt-0.5">
                <img src="/public/PrimaryPersonChecked.png" alt="Google Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-100 group-hover:opacity-0" />
                <img src="/public/WhitePersonChecked.png" alt="Hover Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-0 group-hover:opacity-100" />
              </span>
              <span className="flex-1 text-left">Department or Office Approver</span>
            </div>
          </Button>

                    {/* Outline Google login button */}
          <Button
            type="button"
            variant="white"
            alignment="left"
            className="group"
            size="mobileXL"
            onClick={() => {
              setError("");
              window.location.assign("/accounts/login/google/");
            }}
          >
            <div className="flex items-start gap-3">
              <span className="relative w-5 h-5 flex-shrink-0 mt-0.5">
                <img src="/public/PrimaryHandIcon.png" alt="Google Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-100 group-hover:opacity-0" />
                <img src="/public/WhiteHandIcon.png" alt="Hover Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-0 group-hover:opacity-100" />
              </span>
              <span className="flex-1 text-left">Student Assistant</span>
            </div>
          </Button>

                    {/* Outline Google login button */}
          <Button
            type="button"
            variant="white"
            alignment="left"
            className="group"
            size="mobileXL"
            onClick={() => {
              setError("");
              window.location.assign("/accounts/login/google/");
            }}
          >
            <div className="flex items-start gap-3">
              <span className="relative w-5 h-5 flex-shrink-0 mt-0.5">
                <img src="/public/PrimaryShieldIcon.png" alt="Google Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-100 group-hover:opacity-0" />
                <img src="/public/WhiteShieldIcon.png" alt="Hover Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-0 group-hover:opacity-100" />
              </span>
              <span className="flex-1 text-left">CISO System Admin</span>
            </div>
          </Button>

                    {/* Outline Google login button */}
          <Button
            type="button"
            variant="white"
            alignment="left"
            className="group"
            size="mobileXL"
            onClick={() => {
              setError("");
              window.location.assign("/accounts/login/google/");
            }}
          >
            <div className="flex items-start gap-3">
              <span className="relative w-5 h-5 flex-shrink-0 mt-0.5">
                <img src="/public/PrimaryAnalysisIcon.png" alt="Google Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-100 group-hover:opacity-0" />
                <img src="/public/WhiteAnalysisIcon.png" alt="Hover Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-0 group-hover:opacity-100" />
              </span>
              <span className="flex-1 text-left">OVPHE System Admin</span>
            </div>
          </Button>
        </div>
        
      </form>
      </div>
      </div>
  );
}
