export const auth = {
	cleanup: () => {
		localStorage.removeItem('user');
		localStorage.removeItem('isAdmin');
	},
};
