import React, { Suspense, useContext } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LoadingModal from '../components/loadingModal/LoadingModal';
import Sidebar from '../components/sidebar/Sidebar';
import ProtectedRoute from './ProtectedRoute';

import Login from '../pages/login/Login';
import Account from '../pages/account/Account';
import Users from '../pages/users/Users';
import NotFound from '../pages/notFound/NotFound';
import Roles from '../pages/roles/Roles';
import Maps from '../pages/maps/Maps';
import Contacts from '../pages/contacts/Contacts';
import ViewMap from '../pages/maps/ViewMap';

const AppRouter = () => {
  const { user } = useContext(AuthContext);

  return (
    <>
      <Router>
        <Suspense fallback={<LoadingModal loading={true} />}>
          {user ? <AuthorizedRoute user={user} /> : <UnauthorizedRoute />}
        </Suspense>
      </Router>
    </>
  );
};

const AuthorizedRoute = ({ user }) => {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <>
            <Sidebar>
              <Routes>
                <Route element={<ProtectedRoute user={user} />}>
                  <Route path="/" element={<Maps />} />
                  <Route path="/maps/view/:id" element={<ViewMap />} />
                  <Route path="/maps" element={<Maps />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/contacts" element={<Contacts />} />

                  <Route path="/account-settings" element={<Account />} />
                  <Route path="/roles" element={<Roles />} />
                  <Route
                    path="/login"
                    element={
                      <>
                        <Navigate to={'/'} replace={true} />
                      </>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Sidebar>
          </>
        }
      />
    </Routes>
  );
};

const UnauthorizedRoute = () => {
  return (
    <Routes>
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

export default AppRouter;
