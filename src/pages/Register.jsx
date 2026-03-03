import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.info('Contact your administrator to create an account');
    navigate('/');
  }, []);

  return null;
}
