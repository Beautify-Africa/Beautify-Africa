import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAuth } from '../../hooks/useAuth';
import { CloseIcon } from '../Shared/Icons';
import AuthModalForm from './AuthModalForm';
import AuthVisualPanel from './AuthVisualPanel';

export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { register, login, loading, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const trapRef = useFocusTrap(isOpen);

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setTermsAccepted(false);
    clearError();
  }, [clearError]);

  const handleClose = useCallback(() => {
    if (loading) return;

    resetForm();
    onClose();
  }, [loading, onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, isOpen]);

  const toggleMode = useCallback(() => {
    if (loading) return;

    setIsLogin((prev) => !prev);
    resetForm();
  }, [loading, resetForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }

      handleClose();
      navigate('/shop');
    } catch {
      // AuthContext stores the error for display in the modal.
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={handleBackdropClick}
    >
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-md animate-fade-in"
        aria-hidden="true"
      />

      <div
        ref={trapRef}
        className="relative flex min-h-[600px] w-full max-w-4xl flex-col overflow-hidden rounded-sm bg-[#faf9f6] shadow-2xl animate-fade-in-up md:flex-row"
      >
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-6 right-6 z-20 p-2 text-stone-400 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-stone-400"
          aria-label="Close authentication dialog"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        <AuthVisualPanel />

        <AuthModalForm
          isLogin={isLogin}
          loading={loading}
          error={error}
          name={name}
          email={email}
          password={password}
          termsAccepted={termsAccepted}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTermsChange={setTermsAccepted}
          onSubmit={handleSubmit}
          onToggleMode={toggleMode}
        />
      </div>
    </div>
  );
}
