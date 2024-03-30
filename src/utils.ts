export const debounce = <TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
) => {
  let timerId: number;
  return (...args: TArgs) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
};
