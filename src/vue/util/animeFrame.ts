import { computed, ref } from 'vue';
const nextFrame = () => {
    animeFrame.value++;
    requestAnimationFrame(nextFrame);
};
requestAnimationFrame(nextFrame);
export const animeFrame = ref(0);
const startTimestamp = ref(Date.now());
export function resetStartTimestamp() {
    startTimestamp.value = Date.now();
}
export const animeFrameTimestamp = computed(() => {
    animeFrame.value;
    return Date.now() - startTimestamp.value;
});
