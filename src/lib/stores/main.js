import { readable, writable } from 'svelte/store';

// export const api = readable('http://localhost:3000');
// export const api = readable('https://www.expressfeel.com');

export const user_segments = writable([]);

export const goHome = () => {
	selectedExpression.set(null);
	selectedTrait.set(null);
};

export const signIn = () => {
	selectedExpression.set(null);
	selectedTrait.set(null);
};
