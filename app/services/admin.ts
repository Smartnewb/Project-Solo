const auth = {
  cleanup: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
  },
}

const AdminService = {
  auth,
};

export default AdminService;
