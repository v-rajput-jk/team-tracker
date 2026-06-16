import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => {
      console.error(e);
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-main)] p-4 transition-colors duration-300">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-[var(--bg-main)] to-[var(--bg-main)]"></div>
      </div>
      
      <div className="relative z-10 glass-card max-w-md w-full p-8 flex flex-col items-center text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 shadow-lg shadow-primary-500/20">
          <Zap className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">Welcome to AOSC</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-xs">
          Please sign in with your Microsoft account to access the team tracker and fetch data.
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-primary-500/30 flex items-center justify-center gap-3 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <path fill="#f35325" d="M0 0h10v10H0z"/>
            <path fill="#81bc06" d="M11 0h10v10H11z"/>
            <path fill="#05a6f0" d="M0 11h10v10H0z"/>
            <path fill="#ffba08" d="M11 11h10v10H11z"/>
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
