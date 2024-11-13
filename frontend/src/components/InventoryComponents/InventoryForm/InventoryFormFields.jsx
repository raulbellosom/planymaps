import React, { useEffect, useState } from 'react';
import { Field, FieldArray } from 'formik';
import TextInput from '../../Inputs/TextInput';
import SelectInput from '../../Inputs/SelectInput';
import DateInput from '../../Inputs/DateInput';
import TextArea from '../../Inputs/TextArea';
import FileInput from '../../Inputs/FileInput';
import { MdInfo, MdCalendarToday, MdClose } from 'react-icons/md';
import MultiSelectInput from '../../Inputs/MultiSelectInput';
import ImagePicker from '../../Inputs/ImagePicker';
import { AiOutlineFieldNumber } from 'react-icons/ai';
import { TbNumber123 } from 'react-icons/tb';
import AutoCompleteInput from '../../Inputs/AutoCompleteInput';
import SearchSelectInput from '../../Inputs/SearchSelectInput';
import { getCustomFieldValues } from '../../../services/api';
import SimpleSearchSelectInput from '../../Inputs/SimpleSearchSelectInput';

const InventoryFormFields = ({
  inventoryModels,
  inventoryConditions,
  onOtherSelected,
  customFields = [],
  currentCustomFields = [],
}) => {
  const [selectedCustomFields, setSelectedCustomFields] = useState([]);

  useEffect(() => {
    let currentValues = [];
    currentCustomFields &&
      currentCustomFields.length > 0 &&
      currentCustomFields.forEach((field, index) => {
        currentValues.push({
          label: field.name,
          value: field.customFieldId,
          customFieldId: field.customFieldId,
        });
      });

    setSelectedCustomFields(currentValues);
  }, [currentCustomFields]);

  const handleCustomFieldSelection = (field) => {
    if (selectedCustomFields.some((f) => f.value === field.value)) {
      setSelectedCustomFields(
        selectedCustomFields.filter((f) => f.value !== field.value),
      );
    } else {
      setSelectedCustomFields([...selectedCustomFields, field]);
    }
  };

  const removeCustomField = (fieldId) => {
    setSelectedCustomFields(
      selectedCustomFields.filter((f) => f.value !== fieldId),
    );
  };
  console.log(selectedCustomFields);
  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-4">
      <div className="col-span-12 lg:col-span-8 lg:w-[97%]">
        <div className="grid grid-cols-12 gap-2">
          <p
            style={{
              width: '100%',
              textAlign: 'center',
              borderBottom: '1px solid #e2e8f0',
              lineHeight: '0.1em',
              margin: '10px 0 20px',
            }}
            className="col-span-12 text-base font-semibold"
          >
            <span style={{ background: '#fff', padding: '0 10px' }}>
              Información General del Inventario
            </span>
          </p>
          <Field
            name="modelId"
            id="modelId"
            component={SimpleSearchSelectInput}
            label="* Modelo"
            options={inventoryModels.map((model) => ({
              label: model.name,
              value: model.id,
            }))}
            className="col-span-12 md:col-span-8"
          />
          <Field
            name="serialNumber"
            id="serialNumber"
            component={TextInput}
            icon={TbNumber123}
            label="Número de Serie"
            className="col-span-6 md:col-span-4"
          />
          <Field
            name="activeNumber"
            id="activeNumber"
            component={TextInput}
            icon={AiOutlineFieldNumber}
            label="Número de Activo"
            className="col-span-6 md:col-span-4"
          />
          <Field
            name="receptionDate"
            id="receptionDate"
            component={DateInput}
            label="Fecha de Recepción"
            title="Fecha de Recepción"
            icon={MdCalendarToday}
            max={new Date().toISOString().split('T')[0]}
            className="col-span-6 md:col-span-4"
          />
          <Field
            name="status"
            id="status"
            component={SelectInput}
            icon={MdInfo}
            label="* Estado"
            options={[
              { label: 'ALTA', value: 'ALTA' },
              { label: 'BAJA', value: 'BAJA' },
              { label: 'PROPUESTA DE BAJA', value: 'PROPUESTA' },
            ]}
            className="col-span-6 md:col-span-4"
          />
          <Field
            name="conditions"
            id="conditions"
            component={MultiSelectInput}
            icon={MdInfo}
            label="Condición del Inventario"
            options={inventoryConditions.map((condition) => ({
              label: condition.name,
              value: condition.id,
            }))}
            className="col-span-12"
          />
          <Field
            name="comments"
            id="comments"
            component={TextArea}
            label="Observaciones"
            className="col-span-12"
          />
          <p
            style={{
              width: '100%',
              textAlign: 'center',
              borderBottom: '1px solid #e2e8f0',
              lineHeight: '0.1em',
              margin: '10px 0 20px',
            }}
            className="col-span-12 text-base font-semibold pt-4"
          >
            <span style={{ background: '#fff', padding: '0 10px' }}>
              Información Adicional
            </span>
          </p>
          <Field
            name="customFieldSearch"
            component={SearchSelectInput}
            closeMenuOnSelect={true}
            label="Selecciona un campo personalizado"
            options={customFields.map((field) => ({
              value: field.id,
              label: field.name,
            }))}
            onSelect={handleCustomFieldSelection}
            className="col-span-12"
          />

          <FieldArray name="customFields">
            {({ remove }) => (
              <div className="col-span-12">
                {selectedCustomFields.map((field, index) => (
                  <div key={index} className="flex items-center">
                    <Field
                      id={field.value}
                      name={`customFields[${index}]`}
                      component={AutoCompleteInput}
                      label={field.label}
                      placeholder={`Ingresa el valor para ${field.label}`}
                      loadSuggestions={async (inputValue) => {
                        if (!inputValue) {
                          return [];
                        }
                        const suggestions = await getCustomFieldValues({
                          customFieldId: field.value,
                          query: inputValue,
                        });
                        return suggestions.map((suggestion) => ({
                          label: suggestion, // Asigna el valor directamente al label
                          value: suggestion, // y al value
                        }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        removeCustomField(field.value);
                        remove(index);
                      }}
                      className="ml-2 mt-1.5 p-2 bg-red-500 text-white rounded-md"
                      title="Eliminar campo"
                    >
                      <MdClose />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FieldArray>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-4 h-full">
        <p
          style={{
            width: '100%',
            textAlign: 'center',
            borderBottom: '1px solid #e2e8f0',
            lineHeight: '0.1em',
            margin: '10px 0 20px',
          }}
          className="col-span-12 text-base font-semibold"
        >
          <span style={{ background: '#fff', padding: '0 10px' }}>
            Recursos del Inventario
          </span>
        </p>
        <div className="w-full h-full space-y-4">
          <Field
            name="images"
            id="images"
            component={ImagePicker}
            label="Imagenes"
            multiple
            accept="image/.png,.jpg,.jpeg"
          />
          <Field
            name="files"
            id="files"
            component={FileInput}
            label="Archivos"
            className="col-span-12"
            multiple
            helperText="PDF, Word, Excel, Imagenes, Rar, Zip"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.rar,.zip,.tar,.gz,.ppt,.pptx,.mp4,.avi,.mov,.json,.xml"
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryFormFields;