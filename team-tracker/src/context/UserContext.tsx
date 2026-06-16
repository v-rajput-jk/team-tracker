import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  initials: string;
  avatar?: string | null;
}

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { accounts, instance } = useMsal();
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('teampulse-user-profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved profile', e);
      }
    }
    return {
      name: 'User',
      email: '',
      role: 'Member',
      initials: 'U',
      avatar: null
    };
  });

  useEffect(() => {
    let objectUrl: string | null = null;

    const syncProfile = async () => {
      let account = instance.getActiveAccount();
      
      if (!account && accounts.length > 0) {
        account = accounts[0];
        instance.setActiveAccount(account);
      }

      if (account) {
        const name = account.name || account.username;
        const email = account.username;
        
        // Calculate initials
        const parts = name.split(' ').filter(Boolean);
        let initials = 'U';
        if (parts.length > 1) {
          initials = (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (parts.length === 1) {
          initials = parts[0].substring(0, 2).toUpperCase();
        }

        const newProfile: UserProfile = {
          ...profile,
          name,
          email,
          initials,
        };

        // Try to fetch profile photo from MS Graph
        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: account,
          });

          const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
            headers: {
              'Authorization': `Bearer ${response.accessToken}`
            }
          });

          if (photoResponse.ok) {
            const blob = await photoResponse.blob();
            objectUrl = URL.createObjectURL(blob);
            newProfile.avatar = objectUrl;
          }
        } catch (error: any) {
          // Photo might not exist or token acquisition failed
          if (error.name === 'InteractionRequiredAuthError' || error.message?.includes('consent') || error.message?.includes('AADSTS65001')) {
            console.warn("Silent token acquisition failed for user profile. Redirecting for consent...");
            await instance.acquireTokenRedirect({
              ...loginRequest,
              account: account
            });
            return;
          }
          console.debug('Profile photo not available or access denied');
        }

        setProfile(newProfile);
        localStorage.setItem('teampulse-user-profile', JSON.stringify(newProfile));
      }
    };

    syncProfile();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [accounts, instance]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const newProfile = { ...prev, ...updates };
      if (updates.name) {
        const parts = updates.name.split(' ').filter(Boolean);
        if (parts.length > 1) {
          newProfile.initials = (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (parts.length === 1) {
          newProfile.initials = parts[0].substring(0, 2).toUpperCase();
        }
      }
      localStorage.setItem('teampulse-user-profile', JSON.stringify(newProfile));
      return newProfile;
    });
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
