import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mocks
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { prenom: 'Jean', nom: 'Dupont', email: 'jean@example.com', role: 'user' },
    initials: 'JD',
    logout: jest.fn(),
    isAdmin: false,
    isResponsable: false,
  }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));

// Mock NotificationBell to keep test focused
jest.mock('../components/common/NotificationBell', () => () => <div data-testid="notif">notif</div>);

import Navbar from '../components/common/Navbar';

describe('Navbar', () => {
  test('renders title, avatar initials and opens menu', async () => {
    render(<Navbar onMenuClick={() => {}} />);

    // Title
    expect(screen.getByText(/Système de Réservation de Salles/i)).toBeInTheDocument();

    // Avatar initials
    expect(screen.getByText('JD')).toBeInTheDocument();

    // Click avatar to open menu
    const avatarButton = screen.getByRole('button', { name: /Mon compte/i });
    fireEvent.click(avatarButton);

    // Menu items should appear
    expect(await screen.findByText(/Mon Profil/i)).toBeInTheDocument();
    expect(screen.getByText(/Paramètres/i)).toBeInTheDocument();
    expect(screen.getByText(/Déconnexion/i)).toBeInTheDocument();

    // Click profile should call navigate to /profile
    fireEvent.click(screen.getByText(/Mon Profil/i));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
});
