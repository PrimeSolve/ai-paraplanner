import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRedirect, logoutRedirect } from '@/auth/msalInstance';

const UserNotRegisteredError = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
              AI
            </div>
            <span className="font-semibold text-[20px] text-[#0f172a]">
              AI <span className="text-[#3b82f6]">Paraplanner</span>
            </span>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Account Not Set Up</h1>
          <p className="text-slate-600 mb-6">
            Your Microsoft account is signed in, but you don't have an AI Paraplanner account yet.
          </p>
          <button
            onClick={() => navigate('/Register')}
            className="w-full px-5 py-3 rounded-[10px] text-[15px] font-semibold text-white bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all cursor-pointer mb-3"
          >
            Complete Registration
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => logoutRedirect()}
              className="flex-1 px-5 py-3 rounded-[10px] text-[15px] font-semibold text-[#0f172a] bg-transparent border-2 border-[#e2e8f0] hover:border-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-all cursor-pointer"
            >
              Sign Out
            </button>
            <button
              onClick={() => loginRedirect()}
              className="flex-1 px-5 py-3 rounded-[10px] text-[15px] font-semibold text-[#0f172a] bg-transparent border-2 border-[#e2e8f0] hover:border-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
