import { useState, useEffect } from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Progress } from "../../stories/components/progress";

export default function LoginPrompt() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 5 : 100));
    }, 200); // increase 5% every 200ms

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  useEffect(() => {
    if (progress < 100) return;

    const roleDashboardMap: Record<number, string> = {
      1: '/HRO-dashboard',
      2: '/CISO-dashboard',
      3: '/OVPHE-dashboard',
      4: '/approver-dashboard',
      5: '/assistant-approver-dashboard',
      6: '/faculty-dashboard',
      7: '/dual-role-approver-dashboard',
    };

    const resolveAndRedirect = async () => {
      const raw = localStorage.getItem('login_user_info');
      let userInfo: { role_value?: number; dashboard_url?: string } | null = null;
      try {
        userInfo = raw ? (JSON.parse(raw) as { role_value?: number; dashboard_url?: string }) : null;
      } catch {
        userInfo = null;
      }

      if (!userInfo) {
        try {
          const resp = await fetch('/admin/xu-faculty-clearance/api/me', { credentials: 'include' });
          const me = (await resp.json().catch(() => null)) as { role_value?: number } | null;
          if (resp.ok && me && typeof me === 'object') {
            userInfo = { role_value: me.role_value };
          }
        } catch {
          userInfo = null;
        }
      }

      const roleValue = userInfo?.role_value;
      const dashboardUrl = userInfo?.dashboard_url;

      const target = dashboardUrl || (roleValue ? roleDashboardMap[roleValue] : undefined) || '/';

      localStorage.removeItem('otp_should_send');
      localStorage.removeItem('otp_requested_at');

      window.location.replace(target);
    };

    resolveAndRedirect();
  }, [progress]);

  return (
    <div className="login-container bg-primary text-primary-foreground min-h-screen flex justify-center items-center p-0">

      {/* LOGIN PANEL */}
      <div className="w-full bg-primary p-8 flex flex-col items-center px-3">

        {/* Logos */}
        <div className="w-full max-w-screen-sm px-3 flex flex-col items-center gap-8">

          <img src="/RemoveBG_Logomark.png" className="w-full max-w-[40%] h-auto -mt-12" />

          {/* App Logo + Progress */}
          <div className="flex flex-col items-center gap-5 w-full">

            <img src="/Pen Swish White_FacultyClearTrack.png" className="w-full max-w-[70%] h-auto mb-2" />

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
