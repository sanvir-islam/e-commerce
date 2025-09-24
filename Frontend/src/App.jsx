import { useState } from "react";
import logo from "./assets/logo.png";
import { toast } from "react-toastify";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div
        className="w-[140px] h-[80px] "
        onClick={() => {
          toast("hello bhai");
        }}
      >
        <img src={logo} className="w-full h-full" alt="" />
      </div>
    </>
  );
}

export default App;
