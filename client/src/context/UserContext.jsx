import { createContext, useContext, useEffect, useState } from 'react';
import { useUser as useClerkUser, useClerk } from '@clerk/clerk-react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useClerkUser();
  const { signOut } = useClerk();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      // Map Clerk user to our existing user shape
      setUser({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        username: clerkUser.fullName || clerkUser.username || clerkUser.firstName,
        points: clerkUser.publicMetadata?.points || 500, // Optional metadata fallback
      });
    } else if (isLoaded && !isSignedIn) {
      setUser(null);
    }
  }, [clerkUser, isLoaded, isSignedIn]);

  const logout = async () => {
    await signOut();
  };

  const setSession = () => {
    console.warn("setSession is deprecated. Clerk manages sessions automatically.");
  };

  const updateUser = () => {
    console.warn("updateUser is deprecated. Update user via Clerk API.");
  };

  return (
    <UserContext.Provider value={{ isAuthenticated: isSignedIn, logout, setSession, updateUser, user, isLoaded }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
