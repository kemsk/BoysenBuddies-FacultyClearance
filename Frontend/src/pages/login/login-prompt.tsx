import React, { useState, useEffect } from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Progress } from "../../stories/components/progress";
import { Button } from "../../stories/components/button";

export default function LoginPrompt() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 5 : 100));
    }, 200); // increase 5% every 200ms

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <div className="login-container bg-primary text-primary-foreground min-h-screen flex justify-center items-center p-0">

      {/* LOGIN PANEL */}
      <div className="w-full bg-primary p-8 flex flex-col items-center px-3">

        {/* Logos */}
        <div className="w-full max-w-screen-sm px-3 flex flex-col items-center gap-8">

          <img src="/public/RemoveBG_Logomark.png" className="w-full max-w-[40%] h-auto -mt-12" />

          {/* App Logo + Progress */}
          <div className="flex flex-col items-center gap-5 w-full">

            <img src="/public/Pen Swish White_FacultyClearTrack.png" className="w-full max-w-[70%] h-auto mb-2" />

            <div className="w-full flex flex-col items-center gap-11">

              <h1 className="text-center font-bold leading-[1.05] max-w-[20rem] text-[clamp(1.75rem,7vw,2.75rem)]">
                Signing you in..
              </h1>

              {/* Animated Progress Bar */}
              <Progress value={progress} className="w-full max-w-[70%] h-2 rounded" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
