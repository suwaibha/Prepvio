import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authstore";
import { Loader, ChevronLeft, Shield, MailCheck } from "lucide-react";
import toast from "react-hot-toast";

const EmailVerificationPage = () => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    const { error, isLoading, verifyEmail } = useAuthStore();

    const handleChange = (index, value) => {
        const newCode = [...code];

        // Handle pasted content
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split("");
            for (let i = 0; i < 6; i++) {
                newCode[i] = pastedCode[i] || "";
            }
            setCode(newCode);

            // Focus on the last non-empty input or the first empty one
            const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
            const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
            inputRefs.current[focusIndex].focus();
        } else {
            newCode[index] = value;
            setCode(newCode);

            // Move focus to the next input field if value is entered
            if (value && index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const verificationCode = code.join("");
        try {
            await verifyEmail(verificationCode);
            navigate("/");
            toast.success("Email verified successfully");
        } catch (error) {
            console.log(error);
        }
    };

    // Auto submit when all fields are filled
    useEffect(() => {
        if (code.every((digit) => digit !== "")) {
            handleSubmit(new Event("submit"));
        }
    }, [code]);

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

            {/* Back Button */}
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

                <div className="text-center mb-8">
                    <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-black/20">
                        <MailCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">Verify Your Email</h2>
                    <p className="text-gray-500 font-medium text-sm">Enter the 6-digit code sent to your email.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-between gap-2 sm:gap-3">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength="6"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white/50 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-gray-800 shadow-sm"
                            />
                        ))}
                    </div>

                    {error && <p className="text-red-500 text-xs font-semibold text-center bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading || code.some((digit) => !digit)}
                        className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-bold hover:bg-black hover:-translate-y-0.5 transition-all shadow-xl shadow-gray-200 flex justify-center items-center text-sm"
                    >
                        {isLoading ? <Loader className="animate-spin" size={20} /> : "Verify Email"}
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
export default EmailVerificationPage;



//Backup code hai yeah 
// import { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { useAuthStore } from "../store/authstore";
// import toast from "react-hot-toast";

// const EmailVerificationPage = () => {
// 	const [code, setCode] = useState(["", "", "", "", "", ""]);
// 	const inputRefs = useRef([]);
// 	const navigate = useNavigate();

// 	const { error, isLoading, verifyEmail } = useAuthStore();

// 	const handleChange = (index, value) => {
// 		const newCode = [...code];

// 		// Handle pasted content
// 		if (value.length > 1) {
// 			const pastedCode = value.slice(0, 6).split("");
// 			for (let i = 0; i < 6; i++) {
// 				newCode[i] = pastedCode[i] || "";
// 			}
// 			setCode(newCode);

// 			// Focus on the last non-empty input or the first empty one
// 			const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
// 			const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
// 			inputRefs.current[focusIndex].focus();
// 		} else {
// 			newCode[index] = value;
// 			setCode(newCode);

// 			// Move focus to the next input field if value is entered
// 			if (value && index < 5) {
// 				inputRefs.current[index + 1].focus();
// 			}
// 		}
// 	};

// 	const handleKeyDown = (index, e) => {
// 		if (e.key === "Backspace" && !code[index] && index > 0) {
// 			inputRefs.current[index - 1].focus();
// 		}
// 	};

// 	const handleSubmit = async (e) => {
// 		e.preventDefault();
// 		const verificationCode = code.join("");
// 		try {
// 			await verifyEmail(verificationCode);
// 			navigate("/");
// 			toast.success("Email verified successfully");
// 		} catch (error) {
// 			console.log(error);
// 		}
// 	};

// 	// Auto submit when all fields are filled
// 	useEffect(() => {
// 		if (code.every((digit) => digit !== "")) {
// 			handleSubmit(new Event("submit"));
// 		}
// 	}, [code]);

// 	return (
// 	<div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-blue-50 to-yellow-50">
// 		<div className='max-w-md w-full bg-gray-100 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'>
// 			<motion.div
// 				initial={{ opacity: 0, y: -50 }}
// 				animate={{ opacity: 1, y: 0 }}
// 				transition={{ duration: 0.5 }}
// 				className='bg-gray-100 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md'
// 			>
// 				<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text'>
// 					Verify Your Email
// 				</h2>
// 				<p className='text-center text-gray-800 mb-6'>Enter the 6-digit code sent to your email address.</p>

// 				<form onSubmit={handleSubmit} className='space-y-6'>
// 					<div className='flex justify-between'>
// 						{code.map((digit, index) => (
// 							<input
// 								key={index}
// 								ref={(el) => (inputRefs.current[index] = el)}
// 								type='text'
// 								maxLength='6'
// 								value={digit}
// 								onChange={(e) => handleChange(index, e.target.value)}
// 								onKeyDown={(e) => handleKeyDown(index, e)}
// 								className='w-12 h-12 text-center text-2xl font-bold bg-gray-300 text-gray-800 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none'
// 							/>
// 						))}
// 					</div>
// 					{error && <p className='text-red-500 font-semibold mt-2'>{error}</p>}
// 					<motion.button
// 						whileHover={{ scale: 1.05 }}
// 						whileTap={{ scale: 0.95 }}
// 						type='submit'
// 						disabled={isLoading || code.some((digit) => !digit)}
// 						className='mt-5 w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white 
// 						font-bold rounded-lg shadow-lg hover:from-blue-600
// 						hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
// 						 focus:ring-offset-gray-100 transition duration-200'
// 					>
// 						{isLoading ? "Verifying..." : "Verify Email"}
// 					</motion.button>
// 				</form>
// 			</motion.div>
// 			</div>
// 	</div>
// 	);
// };
// export default EmailVerificationPage;