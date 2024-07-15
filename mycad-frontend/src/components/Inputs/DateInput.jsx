import React from 'react';
import { ErrorMessage } from 'formik';
import { TextInput, Label } from 'flowbite-react';

const DateInput = ({ field, form: { touched, errors }, ...props }) => (
  <div className="w-full">
    <Label
      htmlFor={props.id || props.name}
      className="block text-sm font-medium"
      color={touched[field.name] && errors[field.name] ? 'failure' : ''}
    >
      {props.label}
    </Label>
    <TextInput
      type="date"
      language="es-MX"
      color={touched[field.name] && errors[field.name] ? 'failure' : ''}
      {...field}
      {...props}
      className={`mt-1`}
    />
    <ErrorMessage
      name={field.name}
      component="div"
      className="text-red-500 text-sm"
    />
  </div>
);
export default DateInput;