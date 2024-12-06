import * as Yup from 'yup';

export const MapFormSchema = Yup.object().shape({
  name: Yup.string().required('El nombre es requerido'),
  description: Yup.string(),
  visibility: Yup.string().required('La visibilidad es requerida'),
});
