import { ref } from 'vue';
export function promiseRef<T>(u: Promise<T>) {
    const result = ref<Awaited<T>>();
    (async () => {
        result.value = await u;
    })();
    return result;
}
