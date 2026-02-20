import { useState } from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Checkbox } from "../../stories/components/checkbox";
import { Divider } from "../../stories/components/divider";
import { Button } from "../../stories/components/button";
import { Input } from "../../stories/components/input";
import { authService } from "../../services/authService";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [error, setError] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your XU Email");
      return;
    }

    setIsLoading(true);
    try {
      await authService.checkEmail(normalizedEmail);
      localStorage.setItem('otp_email', normalizedEmail);
      localStorage.setItem('otp_should_send', '1');
      navigate('/otp');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
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

      

      {/* Login Form */}
      <form className="mt-5 p-8 w-full max-w-md" onSubmit={handleLogin}>

        {error ? (
          <div className="mb-4 text-sm text-red-200">{error}</div>
        ) : null}

        {/* Username input + checkbox */}
        <div className="login-input mb-4 flex flex-col gap-2">
          <Input  type="text"
            id="username"
            name="username"
            required
            className="input-field"
            placeholder="Enter your XU Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            ></Input>

          <div className="flex items-center gap-2 mt-2">
          <Checkbox variant="outline"/>
          <p className="text-sm text-white-background">
            Keep Me logged in
          </p>
          </div>
        </div>

        {/* Buttons + Divider */}
        <div className="login-input flex flex-col gap-4">
          {/* Primary login button */}
          <Button variant="secondary" type="submit" disabled={isLoading}>
            {isLoading ? "Checking..." : "Login"}
          </Button>

          {/* Divider with OR */}
          <div className="flex items-center gap-2">
            <Divider className="flex-grow" />
            <span className="text-sm text-muted-foreground">or</span>
            <Divider className="flex-grow" />
          </div>

          {/* Outline Google login button */}
          <Button
            type="button"
            variant="outline"
            className="group"
            onClick={() => {
              setError("");
              window.location.assign("/accounts/login/google/");
            }}
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

