import {
  FaBrain,
  FaShieldAlt,
  FaBolt,
} from "react-icons/fa";

function WelcomeChat() {
  return (
    <section className="flex min-h-0 flex-1 items-center justify-center px-4 py-5 sm:px-5 sm:py-6">
      <div className="w-full max-w-4xl">

        {/* Main Welcome Card */}
        <div
          className="
            rounded-2xl
            border border-[#E4E4E4]
            bg-white
            p-6
            shadow-sm
            sm:p-8
          "
        >
          {/* Top Center Branding */}
          <div className="flex flex-col items-center text-center">

            {/* AI Icon */}
            <div
              className="
                flex h-12 w-12
                items-center justify-center
                rounded-xl
                border border-[#E8C9CD]
                bg-[#F7E9EB]
                text-[#7A1F2B]
              "
            >
              <FaBrain className="text-base" />
            </div>

            {/* NovaTech Title */}
            <h1
              className="
                mt-4
                text-xl
                font-semibold
                tracking-tight
                text-[#171717]
                sm:text-2xl
              "
            >
              NovaTech Enterprise Knowledge Chatbot
            </h1>

            {/* Description */}
            <p
              className="
                mt-2
                max-w-2xl
                text-xs
                leading-5
                text-[#5F5F5F]
                sm:text-sm
              "
            >
              Ask questions about NovaTech's documents and
              get intelligent answers from your connected
              enterprise knowledge base.
            </p>

            {/* Status */}
            <div
              className="
                mt-4
                inline-flex
                items-center
                gap-2
                rounded-full
                border border-[#E4E4E4]
                bg-[#F8F8F8]
                px-3
                py-1.5
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#3F8F62]" />

              <span className="text-[9px] font-medium text-[#5F5F5F]">
                Knowledge base ready
              </span>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div
          className="
            mt-4
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-3
          "
        >

          {/* Intelligent Search */}
          <div
            className="
              rounded-xl
              border border-[#E4E4E4]
              bg-white
              p-4
              transition-all
              duration-200
              hover:border-[#E8C9CD]
              hover:bg-[#F9EFF0]
            "
          >
            <div
              className="
                flex h-8 w-8
                items-center justify-center
                rounded-lg
                bg-[#F7E9EB]
                text-[#7A1F2B]
              "
            >
              <FaBrain className="text-[10px]" />
            </div>

            <h3 className="mt-3 text-xs font-semibold text-[#171717]">
              Intelligent Search
            </h3>

            <p className="mt-1 text-[10px] leading-4 text-[#8A8A8A]">
              Find relevant information across NovaTech's
              enterprise knowledge.
            </p>
          </div>

          {/* Secure Knowledge */}
          <div
            className="
              rounded-xl
              border border-[#E4E4E4]
              bg-white
              p-4
              transition-all
              duration-200
              hover:border-[#E8C9CD]
              hover:bg-[#F9EFF0]
            "
          >
            <div
              className="
                flex h-8 w-8
                items-center justify-center
                rounded-lg
                bg-[#EDF7F1]
                text-[#3F8F62]
              "
            >
              <FaShieldAlt className="text-[10px]" />
            </div>

            <h3 className="mt-3 text-xs font-semibold text-[#171717]">
              Secure Knowledge
            </h3>

            <p className="mt-1 text-[10px] leading-4 text-[#8A8A8A]">
              Access NovaTech information through your
              secure enterprise workspace.
            </p>
          </div>

          {/* Fast Answers */}
          <div
            className="
              rounded-xl
              border border-[#E4E4E4]
              bg-white
              p-4
              transition-all
              duration-200
              hover:border-[#E8C9CD]
              hover:bg-[#F9EFF0]
            "
          >
            <div
              className="
                flex h-8 w-8
                items-center justify-center
                rounded-lg
                bg-[#FBF5E8]
                text-[#B7791F]
              "
            >
              <FaBolt className="text-[10px]" />
            </div>

            <h3 className="mt-3 text-xs font-semibold text-[#171717]">
              Fast Answers
            </h3>

            <p className="mt-1 text-[10px] leading-4 text-[#8A8A8A]">
              Get concise answers powered by NovaTech's
              connected knowledge base.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

export default WelcomeChat;