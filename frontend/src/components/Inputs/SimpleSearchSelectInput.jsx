import React from 'react';
import { ErrorMessage } from 'formik';
import { Label } from 'flowbite-react';
import classNames from 'classnames';
import Select from 'react-select';

const SimpleSearchSelectInput = ({
  field,
  form: { touched, errors, setFieldValue },
  closeMenuOnSelect = true,
  onSelect,
  className,
  isMulti = false,
  ...props
}) => {
  const selectedValue = isMulti
    ? props.options.filter((option) => field.value?.includes(option.value))
    : props.options.find((option) => option.value === field.value);

  return (
    <div className={classNames('w-full', className)}>
      <Label
        htmlFor={props.id || props.name}
        className="block text-base font-medium"
        color={touched[field.name] && errors[field.name] ? 'failure' : ''}
        value={props.label}
      />
      <Select
        {...props}
        isMulti={isMulti}
        className="mt-1 border border-neutral-500 rounded-lg"
        closeMenuOnSelect={closeMenuOnSelect}
        placeholder="Selecciona una opción"
        classNamePrefix="react-select"
        value={selectedValue}
        onChange={(selectedOption) => {
          const value = isMulti
            ? selectedOption.map((option) => option.value)
            : selectedOption?.value;
          setFieldValue(field.name, value);
          if (onSelect) {
            onSelect(selectedOption);
          }
        }}
        options={props.options}
      />
      <ErrorMessage
        name={field.name}
        component="div"
        className="text-red-500 text-sm"
      />
    </div>
  );
};

export default SimpleSearchSelectInput;
