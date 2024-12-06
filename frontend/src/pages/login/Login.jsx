import React, { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Form, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import AuthContext from '../../context/AuthContext';
import Logo from '../../assets/logos/logo.png';
import LogoWhite from '../../assets/logos/logo.png';
import BgLogin from '../../assets/bg/BgLogin.jpg';
import { FaSignInAlt } from 'react-icons/fa';
import TextInput from '../../components/Inputs/TextInput';
import { MdOutlineAlternateEmail, MdOutlinePassword } from 'react-icons/md';
import { Button } from 'flowbite-react';
import ActionButtons from '../../components/ActionButtons/ActionButtons';

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
      email: Yup.string().required(
        'Ingrese un correo electrónico o nombre de usuario válido',
      ),
      password: Yup.string().required('La contraseña es invalida'),
    }),
    onSubmit: async (values) => {
      await login(values);
      navigate('/');
    },
  });

  return (
    <FormikProvider value={formik}>
      <div className="flex h-full text-white md:text-neutral-700 relative">
        <div
          className="h-dvh shadow-xl max-h-dvh overflow-hidden w-full flex items-center justify-center bg-gray-100 bg"
          style={{
            backgroundImage: `url(${BgLogin})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="hidden h-dvh md:flex justify-start items-end bg-gradient-to-b from-transparent w-full to-black/35">
            <div className="p-2 flex flex-col items-center gap-2">
              <img src={LogoWhite} alt="Logo" className="h-auto w-16" />
              <h1 className="text-lg text-center text-planymaps-primary-light font-bold tracking-wider">
                planymaps
              </h1>
            </div>
          </div>
        </div>
        <div className="absolute md:relative flex flex-col gap-4 justify-start bg-black/35 md:bg-white p-8 pt-14 rounded shadow-lg w-full mx-auto md:max-w-md h-dvh">
          <div className="flex flex-col items-center justify-center pb-2">
            <img src={LogoWhite} alt="Logo" className="h-auto w-20 md:hidden" />
            <img
              src={Logo}
              alt="Logo"
              className="h-auto w-20 hidden md:block"
            />
            <h1 className="text-3xl text-center mb-4 font-black tracking-wider md:text-planymaps-primary">
              planymaps
            </h1>
          </div>
          <h2 className="text-2xl font-semibold">Iniciar Sesión</h2>
          <Form
            ref={formRef}
            className="space-y-4"
            onSubmit={formik.handleSubmit}
          >
            <Field
              component={TextInput}
              id="email"
              name="email"
              type="text"
              label="Correo Electrónico o Usuario"
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
                theme={{
                  color: {
                    primary:
                      'bg-planymaps-primary hover:bg-planymaps-primary-dark text-white',
                  },
                }}
                color={'primary'}
                className="w-full"
                type="submit"
              >
                <FaSignInAlt size={20} className="mr-2" />
                Iniciar Sesión
              </Button>
            </div>
            {/* register section */}
            <p
              style={{
                width: '100%',
                textAlign: 'center',
                borderBottom: '1px solid #e2e8f0',
                lineHeight: '0.1em',
                margin: '10px 0 20px',
              }}
              className="col-span-12 text-base font-semibold pt-8"
            >
              <span
                className="bg-transparent"
                style={{ padding: '0 10px' }}
              ></span>
            </p>
            <div className="flex flex-col justify-center pt-2">
              <p className="text-lg text-left pb-2">
                ¿Aún no tienes una cuenta?
              </p>
              <div className="bg-white rounded-md">
                <ActionButtons
                  extraActions={[
                    {
                      label: 'Regístrate',
                      href: '/register',
                      color: 'secondary',
                      filled: true,
                      className: 'min-w-full',
                    },
                  ]}
                />
              </div>
            </div>
          </Form>
        </div>
      </div>
    </FormikProvider>
  );
};

export default Login;
