import { Outlet } from "react-router";
import { ToastContainer } from "react-toastify";

function MainRoute() {
  return (
    <div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
      <Outlet />
    </div>
  );
}

export default MainRoute;
