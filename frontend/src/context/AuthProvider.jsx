import React, { useReducer, useEffect } from 'react';
import AuthContext from './AuthContext';
import authReducer from './AuthReducer';
import { useAuthData } from '../hooks/useAuth';

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: true,
  });

  const {
    login,
    logout,
    register,
    loadUser,
    updatePassword,
    updateProfile,
    updateProfileImage,
  } = useAuthData(dispatch);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          dispatch({ type: 'AUTH_ERROR' });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }

        const user = await loadUser();
        if (user) {
          dispatch({ type: 'LOAD_USER', payload: user });
        } else {
          throw new Error('Invalid user');
        }
      } catch (error) {
        dispatch({ type: 'AUTH_ERROR' });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    };

    verifyToken();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        dispatch,
        updatePassword,
        updateProfile,
        updateProfileImage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
