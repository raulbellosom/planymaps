import { toast } from 'react-hot-toast';

/**
 * Shows a notification.
 *
 * @param {'success' | 'error' | 'warning' | 'info' | 'default'} type - The type of notification.
 * @param {string} message - The message to display.
 */
const Notifies = (type, message) => {
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'warning':
      toast.success(message, {
        style: {
          border: '1px solid #FFD166',
          padding: '16px',
          color: '#FFD166',
        },
        iconTheme: {
          primary: '#FFD166',
          secondary: '#FFFAEE',
        },
      });
      break;
    case 'info':
      toast.success(message, {
        style: {
          border: '1px solid #118AB2',
          padding: '16px',
          color: '#118AB2',
        },
        iconTheme: {
          primary: '#118AB2',
          secondary: '#FFFAEE',
        },
      }); // 'react-hot-toast' no tiene un toast.info, por lo que usamos el genérico
      break;
    default:
      toast(message);
      break;
  }
};

export default Notifies;
