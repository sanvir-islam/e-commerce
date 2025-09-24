const { createBrowserRouter } = require("react-router");
const { default: MainRoute } = require("./components/mainroute");
const { default: Registration } = require("./pages/Registration");

const router = createBrowserRouter([
  {
    path: "/",
    Component: MainRoute,
    children: [{ index: true, Component: Registration }, { path: "home" }],
  },
]);
