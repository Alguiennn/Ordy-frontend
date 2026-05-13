import { MuseoModerno, Inter } from 'next/font/google';

// Configuramos la fuente que elegiste
export const museoModerno = MuseoModerno({
  subsets: ['latin'],
  display: 'swap',
});

// Opcional: Una fuente sans-serif para el resto de textos legales/leíbles
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});