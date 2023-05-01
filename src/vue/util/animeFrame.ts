import { computed, ref } from 'vue';
const nextFrame = () => {
    animeFrame.value++;
    requestAnimationFrame(nextFrame);
};
requestAnimationFrame(nextFrame);
export const animeFrame = ref(0);
export const animeFrameTimestamp = computed(()=>{
    animeFrame.value;
    return Date.now();
})
