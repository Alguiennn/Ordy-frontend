'use client';

import React from 'react';
import Typewriter from 'typewriter-effect';

const TypewriterGreeting: React.FC = () => {
  return (
    /* Manteniendo tus clases de Tailwind */
    <h2 className="text-2xl font-bold text-gray-800 min-h-[35px]">
      <Typewriter
        onInit={(typewriter) => {
          typewriter
            .typeString('Hola de nuevo :)')
            .pauseFor(2500)
            .deleteAll()
            .typeString('Echa un vistazo a todas las novedades de hoy')
            .start();
        }}
        options={{
          autoStart: true,
          loop: false,
          cursor: '|',
          delay: 70,
        }}
      />
    </h2>
  );
};

export default TypewriterGreeting;