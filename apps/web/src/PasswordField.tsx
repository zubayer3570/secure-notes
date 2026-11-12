import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react';
import { checkPassword, MIN_PASSWORD_LENGTH, passwordProblem } from './password';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type' | 'minLength' | 'onChange'> & {
  prefix: string;
  label?: string;
};

export function PasswordField({ prefix, label, ...inputProps }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => ref.current?.setCustomValidity(passwordProblem(value)), [value]);

  useEffect(() => {
    const form = ref.current?.form;
    const clear = () => setValue('');
    form?.addEventListener('reset', clear);
    return () => form?.removeEventListener('reset', clear);
  }, []);

  const input = (
    <input
      {...inputProps}
      ref={ref}
      name="password"
      type="password"
      minLength={MIN_PASSWORD_LENGTH}
      onChange={(event) => setValue(event.target.value)}
      data-testid={`${prefix}-password`}
    />
  );

  return (
    <>
      {label ? (
        <label>
          {label} {input}
        </label>
      ) : (
        input
      )}
      {value && <PasswordRules prefix={prefix} value={value} />}
    </>
  );
}

function PasswordRules({ prefix, value }: { prefix: string; value: string }) {
  return (
    <ul className="rules" aria-live="polite" data-testid={`${prefix}-password-rules`}>
      {checkPassword(value).map(({ key, label, met }) => (
        <li
          key={key}
          className={met ? 'met' : 'unmet'}
          data-testid={`${prefix}-password-rule`}
          data-rule={key}
          data-met={met}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
