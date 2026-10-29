import AnimatedBackground from "./AnimatedBackground";
import FeatureSection from "./FeatureSection";
import AuthCard from "./AuthCard";
import Footer from "./Footer";
import ThemeToggle from "../UI/ThemeToggle";
import Toast from "../UI/Toast";

function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#020817] text-white">

      {/* Background */}
      <AnimatedBackground />

      {/* Toast */}
      <Toast />

      {/* Theme Toggle */}
      <div className="absolute right-6 top-6 z-30">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center">
        <div
          className="
            mx-auto
            grid
            w-full
            max-w-7xl
            grid-cols-1
            items-center
            gap-12
            px-6
            py-16
            lg:grid-cols-[1.15fr_0.85fr]
            lg:gap-20
            lg:px-12
            xl:px-16
          "
        >

          {/* Left */}
          <section className="hidden lg:block">
            <FeatureSection />
          </section>

          {/* Right */}
          <section className="flex w-full justify-center lg:justify-end">
            <AuthCard />
          </section>

        </div>
      </main>

      {/* Footer */}
      <div className="relative z-10 border-t border-blue-400/10">
        <Footer />
      </div>

    </div>
  );
}

export default AuthLayout;