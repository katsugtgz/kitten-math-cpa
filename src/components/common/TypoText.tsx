import React from 'react';
import { glue } from '@typehug/en';

export interface TypoTextProps {
  readonly children: string;
  readonly className?: string;
  readonly as?: React.ElementType;
}

export function TypoText({
  children,
  className = '',
  as: Component = 'span',
}: TypoTextProps): React.JSX.Element {
  const glued = React.useMemo(() => {
    if (typeof children !== 'string') return children;
    try {
      return glue(children);
    } catch {
      return children;
    }
  }, [children]);

  return <Component className={className}>{glued}</Component>;
}
