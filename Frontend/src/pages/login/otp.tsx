import React, { useEffect, useRef, useState } from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Button } from "../../stories/components/button";
import { Divider } from "../../stories/components/divider";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../stories/components/input-otp";
import { authService, LoginResponse } from "../../services/authService";

export default function Otp() {
  const [email, setEmail] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState<number>(180); // 3 minutes
  const timerRef = useRef<number | null>(null);

  // Get user info from session or previous login attempt
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const authStatus = await authService.getAuthStatus();
        if (authStatus.user_info) {
          setEmail(authStatus.user_info.email);
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
        // Fallback to default email
        setEmail("user@xu.edu.ph");
      }
    };
    
    getUserInfo();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!timerRef.current) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }, 1000) as unknown as number;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [secondsLeft]);

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (pin.length !== 6) {
      setError("Please enter a 6-digit PIN");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response: LoginResponse = await authService.verifyPin(pin);
      
      if (response.success && response.user_info?.dashboard_url) {
        // Login successful, redirect to role-specific dashboard
        window.location.href = response.user_info.dashboard_url;
      } else if (response.success) {
        // Fallback to default dashboard
        window.location.href = "/dashboard";
      } else {
        setError(response.message || "PIN verification failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during PIN verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    // TODO: implement resend PIN functionality
    // For now, just reset timer
    setSecondsLeft(180);
  };

  const handlePinChange = (value: string) => {
    setPin(value);
    setError(""); // Clear error when user starts typing
  };

  return (
    <div className="login-container bg-primary text-primary-foreground min-h-screen flex justify-center items-center p-7">

      {/* OTP PANEL */}
      <div className="w-full bg-primary p-8 flex flex-col items-center px-0">

      {/* Logos */}
        <div className="w-full max-w-screen-sm px-3 flex flex-col items-center gap-8">

        <img src="/RemoveBG_Logomark.png" className="w-full max-w-[40%] h-auto -mt-12" />


        {/* App Logo + Title */}
        <div className=" items-center justify-center gap-5 w-full">
          
          {/* Instruction */}
          <div className="instruction flex flex-col items-center justify-center gap-3 w-full  pb-6">

            <h1 className="text-center font-bold leading-[1.05] max-w-[20rem] text-[clamp(1.5rem,6vw,2.25rem)]">
              Verify Your Email
            </h1>

            <h2 className="text-center font-bold leading-[1.3] max-w-[20rem] text-[clamp(0.9rem,3.5vw,1rem)] text-muted-foreground">
              We have sent a verification to {" "} <span className="text-white ">{email}</span>
            </h2>
          </div>

          {/* Pin Code */}
          <div className=" items-center justify-center gap-5 w-full pt-4 pb-6">

            <h2 className="text-center font-semibold leading-[1.05] max-w-[20rem] text-[clamp(1.25rem,5vw,1.5rem)]">
              Enter Verification Code
            </h2>

          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full max-w-md mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Pin Code */}
          <div className="otp-input flex flex-col  justify-center items-center w-full  pb-6">
            <InputOTP 
              length={6}
              value={pin}
              onChange={handlePinChange}
              disabled={isLoading}
            >
              <InputOTPGroup className="gap-2 justify-center">
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Pin Code Resend */}
          <div className=" items-center justify-center gap-5 w-full  pb-6">
            {secondsLeft > 0 ? (
              <p className="text-center leading-[1.05] max-w-[20rem] text-[clamp(0.85rem,3vw,0.9rem)] text-muted-foreground">
                  Resend code in {formatTime(secondsLeft)}
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-center leading-[1.05] max-w-[20rem] text-[clamp(0.85rem,3vw,0.9rem)] text-primary-foreground underline"
              >
                  Resend code to <strong className="font-semibold">{email}</strong>
              </button>
            )}

          </div>

          {/* Buttons + Divider */}
        <div className="login-input flex flex-col gap-4">
          {/* Primary verify button */}
          <Button 
            variant="secondary" 
            onClick={handleVerify}
            disabled={isLoading || pin.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>

          {/* Divider with OR */}
          <div className="flex items-center gap-2">
            <Divider className="flex-grow" />
            <span className="text-sm text-muted-foreground">or</span>
            <Divider className="flex-grow" />
          </div>

          {/* Outline Google login button */}
          <Button 
            variant="outline" 
            className="group"
            onClick={() => window.location.href = "/"}
            disabled={isLoading}
          >
            <span className="relative w-5 h-5 mr-0 inline-block">
              <img src="/whiteGoogleLogo.png" alt="Google Icon" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-100 group-hover:opacity-0" />
              <img src="/BlackGoogleLogo.png" alt="Google Icon hover" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 opacity-0 group-hover:opacity-100" />
            </span>
            Back to Login
          </Button>
        </div>
        
        </div>
      </div>

      </div>
      </div>
  );
}

