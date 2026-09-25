import React from 'react';
import { TextMorph } from 'torph/react';

export interface AnimatedNumberProps {
  readonly value: number | string;
  readonly className?: string;
  readonly as?: React.ElementType;
}

export function AnimatedNumber({
  value,
  className = '',
  as = 'span',
}: AnimatedNumberProps): React.JSX.Element {
  return (
    <TextMorph
      as={as}
      className={`inline-block font-mono tabular-nums ${className}`}
      numbers
    >
      {String(value)}
    </TextMorph>
  );
}
