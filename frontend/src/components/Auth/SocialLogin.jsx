import { FaGoogle, FaMicrosoft, FaGithub } from "react-icons/fa";
import toast from "react-hot-toast";

function SocialLogin({ disabled = false }) {
  const handleSocialLogin = (provider) => {
    if (disabled) return;

    toast(`${provider} sign-in will be available soon`);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Google */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleSocialLogin("Google")}
        aria-label="Continue with Google"
        className="
          flex
          h-10
          items-center
          justify-center
          rounded-lg
          border
          border-white/10
          bg-white/[0.03]
          text-slate-300
          transition-all
          duration-200
          hover:border-white/20
          hover:bg-white/[0.07]
          hover:text-white
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <FaGoogle className="text-sm" />
      </button>

      {/* Microsoft */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleSocialLogin("Microsoft")}
        aria-label="Continue with Microsoft"
        className="
          flex
          h-10
          items-center
          justify-center
          rounded-lg
          border
          border-white/10
          bg-white/[0.03]
          text-slate-300
          transition-all
          duration-200
          hover:border-white/20
          hover:bg-white/[0.07]
          hover:text-white
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <FaMicrosoft className="text-sm" />
      </button>

      {/* GitHub */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleSocialLogin("GitHub")}
        aria-label="Continue with GitHub"
        className="
          flex
          h-10
          items-center
          justify-center
          rounded-lg
          border
          border-white/10
          bg-white/[0.03]
          text-slate-300
          transition-all
          duration-200
          hover:border-white/20
          hover:bg-white/[0.07]
          hover:text-white
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <FaGithub className="text-sm" />
      </button>
    </div>
  );
}

export default SocialLogin;