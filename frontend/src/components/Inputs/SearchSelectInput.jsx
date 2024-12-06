import React from 'react';
import { ErrorMessage } from 'formik';
import { Label } from 'flowbite-react';
import classNames from 'classnames';
import Select from 'react-select/creatable';

const SearchSelectInput = ({
  field,
  form: { touched, errors, setFieldValue },
  closeMenuOnSelect = false,
  onSelect,
  className,
  ...props
}) => {
  const handleChange = (selectedOptions) => {
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];

    if (onSelect) {
      selectedOptions.forEach((option) => {
        onSelect(option);
      });
    }
  };

  return (
    <div className={classNames('w-full', className)}>
      <Label
        htmlFor={props.id || props.name}
        className="block text-base font-medium"
        color={touched[field.name] && errors[field.name] ? 'failure' : ''}
        value={props.label}
      />
      <Select
        {...field}
        {...props}
        isMulti
        className="mt-1 border border-neutral-500 rounded-lg"
        closeMenuOnSelect={closeMenuOnSelect}
        placeholder="Selecciona una opción"
        classNamePrefix="react-select"
        onChange={handleChange}
        value={props.options.filter((option) =>
          field.value?.includes(option.value),
        )}
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

export default SearchSelectInput;
