import Logo from "./Logo";
import LoginForm from "./LoginForm";

function AuthCard() {
  return (
    <div
      className="
        w-full
        max-w-lg
        rounded-2xl
        border
        border-blue-400/25
        bg-[#07152f]/80
        p-7
        shadow-2xl
        shadow-blue-950/30
        backdrop-blur-2xl
        sm:p-8
      "
    >

      {/* Logo */}
      <div className="mb-7">
        <Logo size="md" />
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h2
          className="
            text-3xl
            font-semibold
            tracking-tight
            text-white
          "
        >
          Welcome back
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Sign in to access your enterprise knowledge assistant.
        </p>
      </div>

      {/* Login Form */}
      <LoginForm />

    </div>
  );
}

export default AuthCard;