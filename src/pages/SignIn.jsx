import { useEffect } from 'react';
import { loginRedirect } from '@/auth/msalInstance';

export default function SignIn() {
  useEffect(() => {
    loginRedirect();
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      <span className="ml-3 text-slate-600">Redirecting to sign in...</span>
    </div>
  );
}
