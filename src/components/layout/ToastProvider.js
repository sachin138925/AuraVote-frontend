import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: 'var(--radius)',
          background: 'hsl(var(--foreground))',
          color: '#fff',
        },
      }}
    />
  );
}
