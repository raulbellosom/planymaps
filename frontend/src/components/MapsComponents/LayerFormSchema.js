import * as Yup from 'yup';

export const LayerFormSchema = Yup.object().shape({
  name: Yup.string(),
  mapId: Yup.string().required('Map is required'),
  order: Yup.number().required('Order is required'),
  image: Yup.mixed().required('La imagen es requerida'),
});
