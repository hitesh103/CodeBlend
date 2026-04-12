import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from './Home';
import { BrowserRouter } from 'react-router-dom';
import toast from 'react-hot-toast';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const renderHome = () => render(
  <BrowserRouter>
    <Home />
  </BrowserRouter>
);

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows inline error when roomId or username missing', () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: /join workspace/i }));
    expect(toast.error).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates when both fields are provided', () => {
    renderHome();
    fireEvent.change(screen.getByPlaceholderText(/paste invite room id/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), { target: { value: 'me' } });
    fireEvent.click(screen.getByRole('button', { name: /join workspace/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/editor/abc', { state: { username: 'me' } });
  });
});
