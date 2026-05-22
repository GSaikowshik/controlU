import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
      <Analytics />
    </>
  );
}
