import { ref, type Ref } from 'vue';
export function promiseRef<T>(promise: Promise<T>): Ref<T | undefined>;
export function promiseRef<T>(promise: Promise<T>, fallback: T): Ref<T>;
export function promiseRef<T>(promise: Promise<T>, fallback?: T) {
  const value = fallback ? ref<T>(fallback) : ref<T>();
  promise.then((data) => {
    value.value = data;
  });
  return value;
}
