import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

describe('LoginForm', () => {
  test('submits email and password', () => {
    const onSubmit = jest.fn();
    render(
      <MemoryRouter>
        <LoginForm onSubmit={onSubmit} />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ email: 'user@test.com', password: 'secret' });
  });

  test('toggles password visibility', () => {
    const onSubmit = jest.fn();
    render(
      <MemoryRouter>
        <LoginForm onSubmit={onSubmit} />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/Mot de passe/i) as HTMLInputElement;
    const toggleButton = screen.getAllByRole('button').find(b => b.getAttribute('aria-label') === null) || screen.getAllByRole('button')[1];

    // Initially password type should be password
    expect(passwordInput.type).toBe('password');

    // Click toggle
    fireEvent.click(toggleButton);
    // After toggle it should be text
    expect(passwordInput.type).toBe('text');
  });
});
