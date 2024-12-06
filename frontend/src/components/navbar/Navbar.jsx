import React from 'react';
import { Button } from 'flowbite-react';
import { HiOutlineMenuAlt1 } from 'react-icons/hi';
import Logo from '../../assets/logos/logo.svg';

const Navbar = ({
  collapsed,
  setCollapsed = () => {},
  toggled,
  setToggled = () => {},
  broken,
}) => {
  return (
    <div className="flex justify-between items-center bg-white shadow-md p-2 w-full h-16 absolute top-0 left-0 z-50">
      <Button
        onClick={broken ? setToggled : setCollapsed}
        color="light"
        style={{ borderStyle: 'none' }}
        className="h-8 w-8 flex items-center justify-center rounded-md transition-colors duration-100 ease-in-out text-purple-500 hover:text-purple-600"
      >
        <HiOutlineMenuAlt1 className="text-2xl cursor-pointer" />
      </Button>
      <img src={Logo} alt="Logo" className="h-7 block md:hidden" />
    </div>
  );
};

export default Navbar;
