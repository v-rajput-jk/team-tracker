import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Overtime from './pages/Overtime';
import Performance from './pages/Performance';
import EmployeeProfile from './pages/EmployeeProfile';
import Schedule from './pages/Schedule';
import ProfileSettings from './pages/ProfileSettings';

import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { DataProvider } from './context/DataContext';
import LoginPage from './pages/LoginPage';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';

export default function App() {
  return (
    <ToastProvider>
      <LanguageProvider>
        <UserProvider>
          <DataProvider>
            <ThemeProvider>
                            <AuthenticatedTemplate>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="tasks" element={<Tasks />} />
                      <Route path="schedule" element={<Schedule />} />
                      <Route path="overtime" element={<Overtime />} />
                      <Route path="performance" element={<Performance />} />
                      <Route path="performance/:id" element={<EmployeeProfile />} />
                      <Route path="settings" element={<ProfileSettings />} />
                    </Route>
                  </Routes>
                </BrowserRouter>
              </AuthenticatedTemplate>
              <UnauthenticatedTemplate>
                <LoginPage />
              </UnauthenticatedTemplate>
            </ThemeProvider>
          </DataProvider>
        </UserProvider>
      </LanguageProvider>
    </ToastProvider>
  );
}
