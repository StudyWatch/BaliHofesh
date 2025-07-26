import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/'); // הפניה לדף הבית
  }, [navigate]);

  return null;
};

export default Login;
