import React, { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import AuthContext from '../../context/AuthContext';
import Logo from '../../assets/logo/sinabe_icon.png';
import LogoWhite from '../../assets/logo/sinabe_icon_white.png';
import BgPattern from '../../assets/bg/login_bg.jpg';
import { FaSignInAlt } from 'react-icons/fa';
import TextInput from '../../components/Inputs/TextInput';
import { MdOutlineAlternateEmail, MdOutlinePassword } from 'react-icons/md';
import { Button } from 'flowbite-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const formRef = useRef(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Ingrese un correo electrónico válido'),
      password: Yup.string().required('La contraseña es invalida'),
    }),
    onSubmit: async (values) => {
      await login(values);
      navigate('/dashboard');
    },
  });

  return (
    <FormikProvider value={formik}>
      <div className="flex h-full text-white md:text-gray-800 relative">
        <div
          className="h-dvh shadow-xl max-h-dvh overflow-hidden w-full flex items-center justify-center bg-gray-100 bg"
          style={{
            backgroundImage: `url(${BgPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="hidden h-dvh md:flex justify-start items-end bg-gradient-to-b from-transparent w-full to-black">
            <div className="p-2 flex flex-col items-center gap-2">
              <img src={LogoWhite} alt="Logo" className="h-auto w-16" />
              <h1 className="text-lg text-center text-white font-bold tracking-wider">
                SINABE
              </h1>
            </div>
          </div>
        </div>
        <div className="absolute md:relative flex flex-col justify-start bg-black/35 md:bg-white p-8 pt-14 rounded shadow-lg w-full mx-auto md:max-w-md h-dvh">
          <div className="flex flex-col items-center justify-center">
            <img src={LogoWhite} alt="Logo" className="h-auto w-20 md:hidden" />
            <img
              src={Logo}
              alt="Logo"
              className="h-auto w-20 hidden md:block"
            />
            <h1 className="text-3xl text-center mb-4 font-black tracking-wider md:text-purple-600">
              SINABE
            </h1>
          </div>
          <h2 className="text-2xl mb-6">Iniciar Sesión</h2>
          <Form
            ref={formRef}
            className="space-y-4"
            onSubmit={formik.handleSubmit}
          >
            <Field
              component={TextInput}
              id="email"
              name="email"
              type="email"
              label="Correo Electrónico"
              icon={MdOutlineAlternateEmail}
            />
            <Field
              component={TextInput}
              id="password"
              name="password"
              type="password"
              label="Contraseña"
              icon={MdOutlinePassword}
            />
            <div className="flex justify-center w-full items-center gap-4 pt-4">
              <Button
                className="w-full"
                type="submit"
                gradientDuoTone="purpleToPink"
              >
                <FaSignInAlt size={20} className="mr-2" />
                Iniciar Sesión
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </FormikProvider>
  );
};

export default Login;