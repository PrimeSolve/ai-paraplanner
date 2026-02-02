import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function TestVerifyOtp() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const test = async () => {
      try {
        console.log('Attempting direct verifyOtp with hardcoded OTP: 774113 (expires 05:42:58)');
        const verifyRes = await base44.auth.verifyOtp({
          email: 'logintest@hotmail.com',
          otpCode: '774113'
        });
        console.log('VERIFY SUCCESS:', verifyRes);
        setResult('✅ VERIFICATION SUCCESSFUL:\n' + JSON.stringify(verifyRes, null, 2));
      } catch (err) {
        console.error('VERIFY FAILED:', err);
        const errorMsg = err?.message || err?.detail || err?.error || JSON.stringify(err, null, 2) || 'Unknown error';
        setError('VERIFICATION FAILED:\n' + errorMsg);
      } finally {
        setLoading(false);
      }
    };
    test();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Testing verifyOtp()</h1>
      {loading && <p>Running verifyOtp()...</p>}
      {result && (
        <div className="bg-green-100 p-4 rounded">
          <p className="font-bold text-green-800">SUCCESS!</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div className="bg-red-100 p-4 rounded">
          <p className="font-bold text-red-800">ERROR:</p>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}
    </div>
  );
}