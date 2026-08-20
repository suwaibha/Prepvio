import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authstore";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Lock, ChevronLeft, Shield, Loader } from "lucide-react";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { resetPassword, error, isLoading, message } = useAuthStore();

    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            await resetPassword(token, password);

            toast.success("Password reset successfully, redirecting to login page...");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Error resetting password");
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

            {/* Back to Login Button */}
            <Link
                to="/login"
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-black font-bold transition-colors text-sm"
            >
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
                    <ChevronLeft className="w-4 h-4" />
                </div>
                <span>Back to Login</span>
            </Link>

            {/* Main Card - Compact Size */}
            <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-white shadow-2xl shadow-gray-200/50 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />

                <div className="text-center mb-6">
                    <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-black/20">
                        <Lock className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">Reset Password</h2>
                    <p className="text-gray-500 font-medium text-sm">Enter your new password below.</p>
                </div>

                {error && <p className="text-red-500 text-xs font-semibold mb-4 text-center bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
                {message && <p className="text-green-500 text-xs font-semibold mb-4 text-center bg-green-50 p-2 rounded-lg border border-green-100">{message}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-white/50 border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 rounded-xl px-4 py-3 outline-none transition-all placeholder:text-gray-400 font-medium text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full bg-white/50 border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 rounded-xl px-4 py-3 outline-none transition-all placeholder:text-gray-400 font-medium text-sm"
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-bold hover:bg-black hover:-translate-y-0.5 transition-all shadow-xl shadow-gray-200 flex justify-center items-center text-sm"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader className="animate-spin" size={20} /> : "Set New Password"}
                    </motion.button>
                </form>
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
export default ResetPasswordPage;




//Backup reset password code hai yeah 
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { useAuthStore } from "../store/authstore";
// import { useNavigate, useParams } from "react-router-dom";
// import Input from "../components/Input";
// import { Lock } from "lucide-react";
// import toast from "react-hot-toast";

// const ResetPasswordPage = () => {
// 	const [password, setPassword] = useState("");
// 	const [confirmPassword, setConfirmPassword] = useState("");
// 	const { resetPassword, error, isLoading, message } = useAuthStore();

// 	const { token } = useParams();
// 	const navigate = useNavigate();

// 	const handleSubmit = async (e) => {
// 		e.preventDefault();

// 		if (password !== confirmPassword) {
// 			alert("Passwords do not match");
// 			return;
// 		}
// 		try {
// 			await resetPassword(token, password);

// 			toast.success("Password reset successfully, redirecting to login page...");
// 			setTimeout(() => {
// 				navigate("/login");
// 			}, 2000);
// 		} catch (error) {
// 			console.error(error);
// 			toast.error(error.message || "Error resetting password");
// 		}
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
// 					Reset Password
// 				</h2>
// 				{error && <p className='text-red-500 text-sm mb-4'>{error}</p>}
// 				{message && <p className='text-green-500 text-sm mb-4'>{message}</p>}

// 				<form onSubmit={handleSubmit}>
// 					<Input
// 						icon={Lock}
// 						type='password'
// 						placeholder='New Password'
// 						value={password}
// 						onChange={(e) => setPassword(e.target.value)}
// 						required
// 					/>

// 					<Input
// 						icon={Lock}
// 						type='password'
// 						placeholder='Confirm New Password'
// 						value={confirmPassword}
// 						onChange={(e) => setConfirmPassword(e.target.value)}
// 						required
// 					/>

// 					<motion.button
// 						whileHover={{ scale: 1.02 }}
// 						whileTap={{ scale: 0.98 }}
// 						className='w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition duration-200'
// 						type='submit'
// 						disabled={isLoading}
// 					>
// 						{isLoading ? "Resetting..." : "Set New Password"}
// 					</motion.button>
// 				</form>
// 			</div>
// 		</motion.div>
// 	</div>
// 	);
// };
// export default ResetPasswordPage;