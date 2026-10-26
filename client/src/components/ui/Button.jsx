import { forwardRef } from 'react';
import { Spinner } from './Spinner';

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', isLoading = false, disabled, className = '', children, ...rest },
  ref,
) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(' ');
  return (
    <button
      ref={ref}
      type="button"
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading && <Spinner size="sm" label="" />}
      <span>{children}</span>
    </button>
  );
});
