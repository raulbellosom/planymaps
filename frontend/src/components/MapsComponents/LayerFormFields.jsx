import React from 'react';
import { Field } from 'formik';
import TextInput from '../Inputs/TextInput';
import SelectInput from '../Inputs/SelectInput';
import ImagePicker from '../Inputs/ImagePicker';
import { TbWorldCog } from 'react-icons/tb';
import { BsStack } from 'react-icons/bs';

const LayerFormFields = ({}) => {
  return (
    <div className="grid grid-cols-1 space-y-4">
      <Field
        name="name"
        id="name"
        component={TextInput}
        label="Nombre del layer"
        type="text"
        icon={BsStack}
      />
      <Field
        name="image"
        id="image"
        component={ImagePicker}
        label="Imagenes"
        accept="image/.png,.jpg,.jpeg"
        multiple={false}
      />
      <Field name="order" id="order" component={TextInput} type="hidden" />
      <Field name="mapId" id="mapId" component={TextInput} type="hidden" />
    </div>
  );
};

export default React.memo(LayerFormFields);
