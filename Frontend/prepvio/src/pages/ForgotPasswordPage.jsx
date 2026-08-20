import { motion } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "../store/authstore.js";
import { ArrowLeft, Loader, Mail, ChevronLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { isLoading, forgotPassword } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await forgotPassword(email);
        setIsSubmitted(true);
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

            {/* Back to Login Button */}
            <Link
                to="/login"
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

                <div className="text-center mb-6">
                    <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-black/20">
                        <Mail className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">Forgot Password</h2>
                    {!isSubmitted && (
                         <p className="text-gray-500 font-medium text-sm">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    )}
                </div>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 ml-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="name@work.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-white/50 border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 rounded-xl px-4 py-3 outline-none transition-all placeholder:text-gray-400 font-medium text-sm"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-bold hover:bg-black hover:-translate-y-0.5 transition-all shadow-xl shadow-gray-200 flex justify-center items-center text-sm"
                            type="submit"
                        >
                            {isLoading ? <Loader className="animate-spin" size={20} /> : "Send Reset Link"}
                        </motion.button>
                    </form>
                ) : (
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100"
                        >
                            <Mail className="h-6 w-6 text-green-600" />
                        </motion.div>
                        <p className="text-gray-600 mb-6 text-sm font-medium leading-relaxed">
                            If an account exists for <span className="font-bold text-gray-900">{email}</span>, you will receive a password reset link shortly.
                        </p>
                        <Link
                             to="/login"
                             className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                )}

                {/* Footer Link (Only visible when form is active) */}
                {!isSubmitted && (
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm font-bold text-gray-500 hover:text-black flex items-center justify-center gap-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                )}
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
export default ForgotPasswordPage;




//backup code hai forgot paswword ka 
// import { motion } from "framer-motion";
// import { useState } from "react";
// import { useAuthStore } from "../store/authstore.js";
// import Input from "../components/Input";
// import { ArrowLeft, Loader, Mail } from "lucide-react";
// import { Link } from "react-router-dom";

// const ForgotPasswordPage = () => {
// 	const [email, setEmail] = useState("");
// 	const [isSubmitted, setIsSubmitted] = useState(false);

// 	const { isLoading, forgotPassword } = useAuthStore();

// 	const handleSubmit = async (e) => {
// 		e.preventDefault();
// 		await forgotPassword(email);
// 		setIsSubmitted(true);
// 	};

// 	return (
// 		<motion.div
// 			initial={{ opacity: 0, y: 20 }}
// 			animate={{ opacity: 1, y: 0 }}
// 			transition={{ duration: 0.5 }}
// 			className='max-w-md w-full bg-gray-100 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
// 		>
// 			<div className='p-8'>
// 				<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text'>
// 					Forgot Password
// 				</h2>

// 				{!isSubmitted ? (
// 					<form onSubmit={handleSubmit}>
// 						<p className='text-gray-800 mb-6 text-center'>
// 							Enter your email address and we'll send you a link to reset your password.
// 						</p>
// 						<Input
// 							icon={Mail}
// 							type='email'
// 							placeholder='Email Address'
// 							value={email}
// 							onChange={(e) => setEmail(e.target.value)}
// 							required
// 						/>
// 						<motion.button
// 							whileHover={{ scale: 1.02 }}
// 							whileTap={{ scale: 0.98 }}
// 							className='w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition duration-200'
// 							type='submit'
// 						>
// 							{isLoading ? <Loader className='size-6 animate-spin mx-auto' /> : "Send Reset Link"}
// 						</motion.button>
// 					</form>
// 				) : (
// 					<div className='text-center'>
// 						<motion.div
// 							initial={{ scale: 0 }}
// 							animate={{ scale: 1 }}
// 							transition={{ type: "spring", stiffness: 500, damping: 30 }}
// 							className='w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4'
// 						>
// 							<Mail className='h-8 w-8 text-white' />
// 						</motion.div>
// 						<p className='text-gray-800 mb-6'>
// 							If an account exists for {email}, you will receive a password reset link shortly.
// 						</p>
// 					</div>
// 				)}
// 			</div>

// 			<div className='px-8 py-4 bg-gray-300 bg-opacity-50 flex justify-center'>
// 				<Link to={"/login"} className='text-sm text-blue-400 hover:underline flex items-center'>
// 					<ArrowLeft className='h-4 w-4 mr-2' /> Back to Login
// 				</Link>
// 			</div>
// 		</motion.div>
// 	);
// };
// export default ForgotPasswordPage;