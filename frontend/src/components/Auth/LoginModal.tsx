import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import Input from '../Form/Input';
import { Button } from '../Button/Button';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../Snackbar';
import styled from 'styled-components';
import type { ValidationErrors } from '../../services/authService';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await login(email, password);
      showSnackbar({ type: 'success', message: 'Logged in successfully', duration: 3000 });
      resetAndClose();
    } catch (err: unknown) {
      const error = err as ValidationErrors & { message?: string };
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.errors)) {
          fieldErrors[key] = messages[0];
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.message || 'Login failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setEmail('');
    setPassword('');
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Sign in" maxWidth="400px">
      <Form onSubmit={handleSubmit}>
        {errors.general && (
          <ErrorMessage>{errors.general}</ErrorMessage>
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="your@email.com"
          fullWidth
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Password"
          fullWidth
          required
        />
        <Button variant="primary" fullWidth loading={loading} type="submit">
          Sign in
        </Button>
      </Form>
    </Modal>
  );
};

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.error}20;
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export default LoginModal;
