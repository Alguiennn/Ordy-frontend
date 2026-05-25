'use client';

import React from 'react';
import Typewriter from 'typewriter-effect';

interface TypewriterProps {
  messages: string[];
  className?: string;
  loop?: boolean;
  delay?: number;
  pause?: number;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
}

const TypewriterGreeting: React.FC<TypewriterProps> = ({ 
  messages, 
  className = "text-2xl font-bold text-gray-800", 
  loop = false,
  delay = 70,
  pause = 2500,
  as: Component = 'h2'
}) => {
  return (
    <Component className={className} style={{ minHeight: '1.2em' }}>
      <Typewriter
        onInit={(typewriter) => {
          messages.forEach((msg, index) => {
            typewriter.typeString(msg);
            if (index < messages.length - 1 || loop) {
              typewriter.pauseFor(pause).deleteAll();
            }
          });
          typewriter.start();
        }}
        options={{
          autoStart: true,
          loop: loop,
          delay: delay,
          cursor: '|',
        }}
      />
    </Component>
  );
};

export default TypewriterGreeting;