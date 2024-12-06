import React from 'react';
import { Field } from 'formik';
import TextInput from '../Inputs/TextInput';
import SelectInput from '../Inputs/SelectInput';
import TextArea from '../Inputs/TextArea';
import { LiaMapSolid } from 'react-icons/lia';
import { TbWorldCog } from 'react-icons/tb';

const UserFormFields = ({}) => {
  return (
    <div className="grid grid-cols-1 space-y-4">
      <Field
        name="name"
        id="name"
        component={TextInput}
        label="Nombre del mapa"
        type="text"
        icon={LiaMapSolid}
      />
      <Field
        name="description"
        id="description"
        component={TextArea}
        label="Descripción del mapa"
        type="text"
      />
      <Field
        name="visibility"
        id="visibility"
        component={SelectInput}
        label="Tipo de visibilidad"
        options={[
          { value: 'public', label: 'Público' },
          { value: 'private', label: 'Privado' },
        ]}
        icon={TbWorldCog}
      />
      <Field name="id" id="id" component={TextInput} type="hidden" />
    </div>
  );
};

export default React.memo(UserFormFields);
