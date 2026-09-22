import './globals.css';

export const metadata = {
  title: 'Telar de Leontief',
  description:
    'Los cuatro ejercicios del TP4 de Modelos y Simulación tejidos pasada por pasada: relajar la tela es exactamente la serie de Neumann que invierte (I−A).',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e9ecf2' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1116' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
