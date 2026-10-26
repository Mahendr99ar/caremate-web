import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, TextField } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useGetMeQuery, useLoginMutation, useRegisterMutation } from '../../services/api';
import { getErrorMessage } from '../../utils/apiError';

const MIN_PASSWORD_LENGTH = 8;

export function validateAuthForm(values, mode) {
  const errors = {};
  if (mode === 'register' && !values.name.trim()) errors.name = 'Please enter your name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Please enter a valid email';
  if (mode === 'register' && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (mode === 'login' && !values.password) errors.password = 'Please enter your password';
  return errors;
}

const COPY = {
  login: {
    title: 'Log in',
    submit: 'Log in',
    switchText: "Don't have an account?",
    switchLink: { to: '/register', label: 'Create one' },
  },
  register: {
    title: 'Create your account',
    submit: 'Create account',
    switchText: 'Already registered?',
    switchLink: { to: '/login', label: 'Log in' },
  },
};

export function AuthForm({ mode }) {
  const copy = COPY[mode];
  useDocumentTitle(copy.title);

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? '/doctors';

  const { data: currentUser } = useGetMeQuery();
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const { isLoading, error } = mode === 'login' ? loginState : registerState;

  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  if (currentUser) return <Navigate to={redirectTo} replace />;

  function updateField(event) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validateAuthForm(values, mode);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const submit = mode === 'login' ? login : register;
    try {
      await submit(values).unwrap();
      navigate(redirectTo, { replace: true });
    } catch {
      // The server message is shown from `error` below.
    }
  }

  return (
    <section className="auth-card card">
      <h1 className="auth-card__title">{copy.title}</h1>
      <Alert>{getErrorMessage(error)}</Alert>

      <form onSubmit={handleSubmit} noValidate>
        {mode === 'register' && (
          <TextField label="Full name" name="name" autoComplete="name" value={values.name} onChange={updateField} error={fieldErrors.name} />
        )}
        <TextField label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={updateField} error={fieldErrors.email} />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          hint={mode === 'register' ? `At least ${MIN_PASSWORD_LENGTH} characters` : undefined}
          value={values.password}
          onChange={updateField}
          error={fieldErrors.password}
        />
        <Button type="submit" className="btn--block" isLoading={isLoading}>{copy.submit}</Button>
      </form>

      <p className="auth-card__switch">
        {copy.switchText}{' '}
        <Link to={copy.switchLink.to} state={location.state}>{copy.switchLink.label}</Link>
      </p>
    </section>
  );
}
