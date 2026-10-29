
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaMagic } from "react-icons/fa";

function WelcomeSection({ userName = "User" }) {
  const navigate = useNavigate();

  const handleStartConversation = () => {
    navigate("/chat");
  };

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        rounded-2xl
        border border-[#E5EAF0]
        bg-white
        px-6
        py-7
        shadow-sm
        transition-all
        duration-300
        hover:border-[#D5DFEA]
        sm:px-8
        sm:py-8
      "
    >
      {/* Soft Background Decoration */}
      <div
        className="
          pointer-events-none
          absolute
          -right-16
          -top-20
          h-56
          w-56
          rounded-full
          bg-[#EAF2FB]
          opacity-70
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-24
          right-1/3
          h-40
          w-40
          rounded-full
          bg-[#F1F5F9]
          opacity-80
          blur-3xl
        "
      />

      {/* Content */}
      <div className="relative z-10 w-full">

        {/* AI Label */}
        <div className="flex items-center gap-2">

          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-[#EAF2FB]
              text-[#6F9BCB]
            "
          >
            <FaMagic className="text-xs" />
          </div>

          <span
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.15em]
              text-[#6F9BCB]
            "
          >
            AI Knowledge Assistant
          </span>

        </div>

        {/* Welcome Heading */}
        <h2
          className="
            mt-4
            text-2xl
            font-semibold
            leading-tight
            tracking-tight
            text-[#334155]
            sm:text-3xl
          "
        >
          Welcome back, {userName}
        </h2>

        {/* Description */}
        <p
          className="
            mt-3
            max-w-2xl
            text-sm
            leading-6
            text-[#8491A3]
          "
        >
          Explore your organization's knowledge, ask questions,
          and get intelligent answers from your connected documents.
        </p>

        {/* Start Conversation */}
        <button
          type="button"
          onClick={handleStartConversation}
          className="
            group
            mt-6
            inline-flex
            h-10
            items-center
            gap-2
            rounded-lg
            bg-[#7BA7D9]
            px-4
            text-xs
            font-medium
            text-white
            shadow-sm
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:bg-[#6996CA]
            hover:shadow-md
            active:translate-y-0
          "
        >
          Start a conversation

          <FaArrowRight
            className="
              text-[9px]
              transition-transform
              duration-200
              group-hover:translate-x-1
            "
          />
        </button>

      </div>
    </section>
  );
}

export default WelcomeSection;