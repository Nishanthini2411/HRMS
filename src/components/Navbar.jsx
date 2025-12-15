const Navbar = () => {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-800">HRMS Dashboard</h2>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">Welcome, Admin</span>
        <button className="px-3 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-100">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
