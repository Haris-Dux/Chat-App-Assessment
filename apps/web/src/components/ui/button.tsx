import type { ComponentProps } from 'react';
import { buttonClass, type ButtonStyle } from './button-class';

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'> & ButtonStyle) {
  return <button type={type} className={buttonClass({ variant, size }, className)} {...props} />;
}
