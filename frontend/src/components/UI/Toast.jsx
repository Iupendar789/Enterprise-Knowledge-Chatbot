import { Toaster } from "react-hot-toast";

function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,

        style: {
          background: "#0f172a",
          color: "#e2e8f0",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "12px 14px",
          fontSize: "13px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
        },

        success: {
          iconTheme: {
            primary: "#34d399",
            secondary: "#0f172a",
          },
        },

        error: {
          iconTheme: {
            primary: "#f87171",
            secondary: "#0f172a",
          },
        },
      }}
    />
  );
}

export default Toast;