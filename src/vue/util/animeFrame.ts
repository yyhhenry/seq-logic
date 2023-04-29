import { ref } from 'vue';
const nextFrame = () => {
    animeFrame.value++;
    requestAnimationFrame(nextFrame);
};
requestAnimationFrame(nextFrame);
export const animeFrame = ref(0);
