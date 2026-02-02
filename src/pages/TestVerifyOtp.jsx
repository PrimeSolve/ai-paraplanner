import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function TestVerifyOtp() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const test = async () => {
      try {
        console.log('Calling verifyOtp with email: logintest@hotmail.com, otp: 644299');
        const res = await base44.auth.verifyOtp({
          email: 'logintest@hotmail.com',
          otp: '644299'
        });
        console.log('SUCCESS:', res);
        setResult(res);
      } catch (err) {
        console.error('ERROR:', err);
        setError(err?.message || err?.toString());
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
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}