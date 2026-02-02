import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function TestVerifyOtp() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const test = async () => {
      try {
        console.log('Step 1: Requesting fresh OTP for logintest@hotmail.com...');
        await base44.auth.resendOtp('logintest@hotmail.com');
        console.log('Step 2: Fresh OTP sent.');
        
        // Get the fresh OTP code from the database
        await new Promise(r => setTimeout(r, 1000));
        const users = await base44.entities.User.filter({ email: 'logintest@hotmail.com' });
        if (!users[0]?.otp_code) {
          throw new Error('No OTP code found in DB after resendOtp');
        }
        
        const newOtp = users[0].otp_code;
        console.log('Step 3: Fresh OTP code retrieved:', newOtp);
        setResult(`OTP: ${newOtp}\nVerifying...`);
        
        console.log('Step 4: Calling verifyOtp with otpCode parameter...');
        const verifyRes = await base44.auth.verifyOtp({
          email: 'logintest@hotmail.com',
          otpCode: newOtp
        });
        console.log('Step 5: VERIFY RESPONSE:', verifyRes);
        setResult('✅ SUCCESS:\n' + JSON.stringify(verifyRes, null, 2));
      } catch (err) {
        console.error('CRITICAL ERROR:', err);
        const errorMsg = err?.message || err?.detail || err?.error || JSON.stringify(err, null, 2) || 'Unknown error';
        setError('ERROR: ' + errorMsg);
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