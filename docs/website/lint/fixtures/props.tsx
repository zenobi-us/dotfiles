// Fixture for no-props-destructuring.test.ts. Each line that ends in `// error` must be reported.
export function Allowed(props: { title: string }) {
  return <h3>{props.title}</h3>;
}

export const AllowedArrow = (props: { title: string }) => <h3>{props.title}</h3>;

export const ids = [{ id: 1 }].map(({ id }) => id);

export function useAllowedHook({ ref }: { ref: unknown }) {
  return ref;
}

export function Declared({ title }: { title: string }) { // error
  return <h3>{title}</h3>;
}

export const Arrow = ({ title }: { title: string }) => <h3>{title}</h3>; // error

export function WithDefault({ title } = { title: "" }) { // error
  return <h3>{title}</h3>;
}

export function InBody(props: { title: string }) {
  const { title } = props; // error
  return <h3>{title}</h3>;
}
