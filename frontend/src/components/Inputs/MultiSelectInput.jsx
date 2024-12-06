import React from 'react';
import { ErrorMessage } from 'formik';
import { Label } from 'flowbite-react';
import classNames from 'classnames';
import Select from 'react-select';

const MultiSelectInput = ({
  field,
  isOtherOption,
  onOtherSelected,
  className,
  closeMenuOnSelect = false,
  form: { touched, errors, setFieldValue },
  ...props
}) => {
  const handleChange = (selectedOptions) => {
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setFieldValue(field.name, values);

    if (values.includes('0') && onOtherSelected && isOtherOption) {
      onOtherSelected();
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
        className="mt-1 border border-gray-500 rounded-lg"
        closeMenuOnSelect={closeMenuOnSelect}
        classNamePrefix="react-select"
        onChange={handleChange}
        value={props.options.filter((option) =>
          field.value?.includes(option.value),
        )}
        options={[
          ...props.options,
          ...(isOtherOption ? [{ label: 'Otro', value: '0' }] : []),
        ]}
      />
      <ErrorMessage
        name={field.name}
        component="div"
        className="text-red-500 text-sm"
      />
    </div>
  );
};

export default MultiSelectInput;
