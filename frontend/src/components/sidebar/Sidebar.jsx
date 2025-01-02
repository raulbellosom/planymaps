import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar as ProSidebar,
  Menu,
  MenuItem,
  menuClasses,
  SubMenu,
} from 'react-pro-sidebar';
import {
  FaUserCircle,
  FaSignOutAlt,
  FaUserCog,
  FaUserShield,
} from 'react-icons/fa';
import { useAuthContext } from '../../context/AuthContext';
import AccountSidebar from './AccountSidebar';
import MainLayout from '../../Layout/MainLayout';
import { MdAdminPanelSettings } from 'react-icons/md';
import useCheckPermissions from '../../hooks/useCheckPermissions';
import { TbMapStar } from 'react-icons/tb';
import { BiSolidContact } from 'react-icons/bi';
import ActionButtons from '../ActionButtons/ActionButtons';

const themes = {
  light: {
    sidebar: {
      backgroundColor: '#fafafa',
      color: '#0a3042',
    },
    menu: {
      menuContent: '#fff',
      icon: '#0a3042',
      hover: {
        backgroundColor: '#64ee85',
        color: '#fff',
      },
      disabled: {
        color: '#9fb6cf',
      },
      active: {
        color: '#FFF',
        backgroundColor: '#64ee85',
      },
    },
  },
  dark: {
    sidebar: {
      backgroundColor: '#0b2948',
      color: '#8ba1b7',
    },
    menu: {
      menuContent: '#082440',
      icon: '#59d0ff',
      hover: {
        backgroundColor: '#00458b',
        color: '#b6c8d9',
      },
      disabled: {
        color: '#3e5e7e',
      },
    },
  },
};

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Sidebar = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const [collapsed, setCollapsed] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [broken, setBroken] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [theme, setTheme] = useState('light');

  const handleRTLChange = (e) => {
    setRtl(e.target.checked);
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.checked ? 'dark' : 'light');
  };

  const handleImageChange = (e) => {
    setHasImage(e.target.checked);
  };

  const menuItemStyles = {
    root: {
      fontSize: '16px',
      fontWeight: 600,
    },
    icon: {
      [`&.${menuClasses.disabled}`]: {
        color: themes[theme].menu.disabled.color,
      },
      [`&.${menuClasses.active}`]: {
        color: themes[theme].menu.active.color,
      },
    },
    subMenuContent: ({ level }) => ({
      backgroundColor:
        level === 0
          ? hexToRgba(
              themes[theme].menu.menuContent,
              hasImage && !collapsed ? 0.15 : 1,
            )
          : '',
    }),
    SubMenuExpandIcon: {
      display: 'flex',
      justifyContent: 'center',
      alignContent: 'center',
      transform: ' scale(1.75)',
    },
    button: {
      [`&:hover, &${menuClasses.SubMenuExpandIcon}`]: {
        backgroundColor: hexToRgba(
          themes[theme].menu.hover.backgroundColor,
          hasImage ? 0.75 : 1,
        ),
        color: themes[theme].menu.hover.color,
      },
      [`&.ps-active`]: {
        backgroundColor: hexToRgba(
          themes[theme].menu.active.backgroundColor,
          hasImage ? 0.75 : 1,
        ),
        color: themes[theme].menu.active.color,
      },
      [`&.${menuClasses.disabled}`]: {
        color: themes[theme].menu.disabled.color,
      },
    },

    label: ({ open }) => ({
      fontWeight: open ? 600 : undefined,
    }),
  };

  const isActivePath = (path) => {
    const currentPath = location.pathname;

    if (currentPath === '/' && path === '/dashboard') {
      return true;
    }

    if (currentPath === path) {
      return true;
    }

    if (
      path !== '/' &&
      currentPath.startsWith(path) &&
      currentPath.length > path.length &&
      currentPath[path.length] === '/'
    ) {
      return false;
    }

    return false;
  };

  const isUsersPermission = useCheckPermissions('view_users');
  const isAccountPermission = useCheckPermissions('view_account');
  const isRolesPermission = useCheckPermissions('view_roles');

  return (
    <div
      style={{
        display: 'flex',
        direction: rtl ? 'rtl' : 'ltr',
        height: '100dvh',
      }}
    >
      <ProSidebar
        collapsed={collapsed}
        toggled={toggled}
        onBackdropClick={() => setToggled(false)}
        onBreakPoint={setBroken}
        rtl={rtl}
        breakPoint="md"
        backgroundColor={hexToRgba(
          themes[theme].sidebar.backgroundColor,
          hasImage ? 0.2 : 1,
        )}
        rootStyles={{
          color: themes[theme].sidebar.color,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <AccountSidebar
              role={user.email}
              name={user.firstName + ' ' + user.lastName}
              photo={user.photo}
              collapsed={collapsed}
            />
            <Menu menuItemStyles={menuItemStyles}>
              <MenuItem
                icon={<TbMapStar size={23} />}
                active={isActivePath('/')}
                component={<Link to={'/'} />}
              >
                Mis Mapas
              </MenuItem>
              <MenuItem
                icon={<BiSolidContact size={23} />}
                active={isActivePath('/contacts')}
                component={<Link to={'/contacts'} />}
              >
                Contactos
              </MenuItem>
              {(isUsersPermission.hasPermission ||
                isRolesPermission.hasPermission) && (
                <SubMenu
                  label="Usuarios"
                  icon={<MdAdminPanelSettings size={23} />}
                >
                  {isUsersPermission.hasPermission && (
                    <MenuItem
                      component={<Link to={'/users'} />}
                      active={isActivePath('/users')}
                      icon={<FaUserCircle size={23} />}
                    >
                      Usuarios
                    </MenuItem>
                  )}
                  {isRolesPermission.hasPermission && (
                    <MenuItem
                      component={<Link to={'/roles'} />}
                      active={isActivePath('/roles')}
                      icon={<FaUserShield size={23} />}
                    >
                      Roles
                    </MenuItem>
                  )}
                </SubMenu>
              )}
              {isAccountPermission && (
                <MenuItem
                  component={<Link to={'/account-settings'} />}
                  active={isActivePath('/account-settings')}
                  icon={<FaUserCog size={23} />}
                >
                  Editar Perfil
                </MenuItem>
              )}
            </Menu>
          </div>
          <div className="p-4">
            {/* <Button
              type="button"
              color={'light'}
              className="w-full border-none truncate flex justify-start items-center"
              onClick={logout}
            >
              <div
                className="w-full"
                style={{
                  display: 'flex',
                  justifyContent: 'start',
                  alignItems: 'center',
                }}
              >
                <i>
                  <FaSignOutAlt size={18} className="text-lg mt-0.5" />
                </i>
                {collapsed ? null : <span className="ml-4">Cerrar Sesión</span>}
              </div>
            </Button> */}
            <ActionButtons
              extraActions={[
                {
                  color: 'secondary',
                  icon: FaSignOutAlt,
                  action: logout,
                  label: !collapsed && 'Cerrar Sesión',
                  className: 'border-none min-w-full truncate',
                  filled: true,
                },
              ]}
            />
          </div>
        </div>
      </ProSidebar>
      <div className="flex-1 min-h-0 max-h-dvh overflow-hidden relative">
        <div className="flex-1 overflow-auto h-full">
          <MainLayout
            collapsed={collapsed}
            setCollapsed={() => setCollapsed(!collapsed)}
            toggled={toggled}
            setToggled={() => setToggled(!toggled)}
            broken={broken}
          >
            {children}
          </MainLayout>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
