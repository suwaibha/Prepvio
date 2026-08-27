import { motion } from "framer-motion";
import { Loader, Globe, Linkedin, ChevronLeft, Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authstore";
import { MAIN_BACKEND_URL } from "../config/api";

// UI Component for Social Buttons (Visual only)
const SocialButton = ({ icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-700 font-semibold py-2.5 rounded-xl transition-all duration-200 group text-sm"
  >
    <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-900 transition-colors" />
    <span>{label}</span>
  </button>
);


const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = `${MAIN_BACKEND_URL}/api/auth/google`;
  };


  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch {
      // The auth store already exposes the server error in the form.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans bg-[#FDFBF9]"
    >
      {/* Consistent Background */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-black font-bold transition-colors text-sm"
      >
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
          <ChevronLeft className="w-4 h-4" />
        </div>
        <span>Back</span>
      </Link>

      {/* Main Card - Compact Size */}
      <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-white shadow-2xl shadow-gray-200/50 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />

        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-black/20">
            I
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 font-medium text-sm">Continue your interview training.</p>
        </div>

        {/* Social Buttons */}
        <div className="space-y-4">
          <div className="space-y-2">
            <SocialButton
              icon={Globe}
              label="Continue with Google"
              onClick={handleGoogleLogin}
            />

            {/* <SocialButton icon={Linkedin} label="Continue with LinkedIn" /> */}
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-3 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              Or sign in with email
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Login Form */}
          <form className="space-y-3" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 ml-1">Email or User ID</label>
              <input
                type="text"
                placeholder="name@work.com or PRVOO1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 rounded-xl px-4 py-3 outline-none transition-all placeholder:text-gray-400 font-medium text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/50 border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 rounded-xl pl-4 pr-11 py-3 outline-none transition-all placeholder:text-gray-400 font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 p-1 focus:outline-none transition-colors text-base select-none cursor-pointer flex items-center justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <Link to='/forgot-password' className="text-xs font-bold text-gray-500 hover:text-black transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && <p className="text-red-500 font-semibold mt-1 text-xs">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-bold hover:bg-black hover:-translate-y-0.5 transition-all shadow-xl shadow-gray-200 flex justify-center items-center text-sm mt-2"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="animate-spin" size={20} /> : "Sign in"}
            </motion.button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 font-medium text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-black font-bold hover:underline decoration-2 underline-offset-4 decoration-[#D4F478]"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="mt-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-gray-400 font-medium">
          <Shield className="w-3 h-3" />
          <span className="text-xs">Secure & Private</span>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;





//backup code hai login page ka
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { Mail, Lock, Loader } from "lucide-react";
// import { Link } from "react-router-dom";
// import Input from "../components/Input";
// import { useAuthStore } from "../store/authstore";

// const LoginPage = () => {
// 	const [email, setEmail] = useState("");
// 	const [password, setPassword] = useState("");

// 	const { login, isLoading, error } = useAuthStore();

// 	const handleLogin = async (e) => {
// 		e.preventDefault();
// 		await login(email, password);
// 	};

// 	return (
// 	<div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-blue-50 to-yellow-50">
// 		<motion.div
// 			initial={{ opacity: 0, y: 20 }}
// 			animate={{ opacity: 1, y: 0 }}
// 			transition={{ duration: 0.5 }}
// 			className='max-w-md w-full bg-gray-100 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
// 		>
// 			<div className='p-8'>
// 				<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text'>
// 					Welcome Back
// 				</h2>

// 				<form onSubmit={handleLogin}>
// 					<Input
// 						icon={Mail}
// 						type='email'
// 						placeholder='Email Address'
// 						value={email}
// 						onChange={(e) => setEmail(e.target.value)}
// 					/>

// 					<Input
// 						icon={Lock}
// 						type='password'
// 						placeholder='Password'
// 						value={password}
// 						onChange={(e) => setPassword(e.target.value)}
// 					/>

// 					<div className='flex items-center mb-6'>
// 						<Link to='/forgot-password' className='text-sm text-indigo-500 hover:underline'>
// 							Forgot password?
// 						</Link>
// 					</div>
// 					{error && <p className='text-red-500 font-semibold mb-2'>{error}</p>}

// 					<motion.button
// 						whileHover={{ scale: 1.02 }}
// 						whileTap={{ scale: 0.98 }}
// 						className='w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition duration-200'
// 						type='submit'
// 						disabled={isLoading}
// 					>
// 						{isLoading ? <Loader className='w-6 h-6 animate-spin  mx-auto' /> : "Login"}
// 					</motion.button>
// 				</form>
// 			</div>
// 			<div className='px-8 py-4 bg-gray-300 bg-opacity-50 flex justify-center'>
// 				<p className='text-sm text-shadow-gray-800'>
// 					Don't have an account?{" "}
// 					<Link to='/signup' className='text-blue-400 hover:underline'>
// 						Sign up
// 					</Link>
// 				</p>
// 			</div>
// 		</motion.div>
// 	</div>
// 	);
// };
// export default LoginPage;
