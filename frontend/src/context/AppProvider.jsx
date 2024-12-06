import React from 'react';
import AuthProvider from './AuthProvider';
import UserProvider from './UserProvider';
import LoadingProvider from './LoadingProvider';
import RoleProvider from './RoleProvider';
import PermissionProvider from './PermissionProvider';
import MapsProvider from './MapsProvider';

const SecurityProvider = ({ children }) => (
  <AuthProvider>
    <RoleProvider>
      <PermissionProvider>{children}</PermissionProvider>
    </RoleProvider>
  </AuthProvider>
);

const DataProvider = ({ children }) => (
  <UserProvider>
    <MapsProvider>{children}</MapsProvider>
  </UserProvider>
);

const AppProvider = ({ children }) => (
  <LoadingProvider>
    <SecurityProvider>
      <DataProvider>{children}</DataProvider>
    </SecurityProvider>
  </LoadingProvider>
);

export default AppProvider;
