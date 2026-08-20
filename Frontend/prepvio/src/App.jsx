import { useState, useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import socket, { connectSocket, disconnectSocket } from "./socket";
import { useNotificationStore } from "./store/notificationStore";

import Home from "./HomePages/Home.jsx";
import Layout from "./components/Layout.jsx";
import Footer from "./HomePages/Footer.jsx";
import VoiceAssistant from "./components/VoiceAssistant.jsx";

import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

import DashboardPage from "./Dashboard/DashBoardPage.jsx";
import FAQs from "./Dashboard/FAQs.jsx";
import Interview from "./Dashboard/Interview.jsx";
import Learning from "./Dashboard/Learning.jsx";
import Message from "./Dashboard/Message.jsx";
import Notifications from "./Dashboard/Notfication.jsx";
import Payment from "./Dashboard/Payment.jsx";
import SavedCourses from "./Dashboard/SavedCourse.jsx";
import Account from "./Dashboard/setting.jsx";
import InterviewPreview from "./Dashboard/InterviewPreview.jsx";
import AptitudeTestAnalysis from "./Dashboard/AptitudeTestAnalysis.jsx";
import InterviewReportPage from "./Dashboard/InterviewReportPage.jsx";

import LearnAndPerform from "./ServiceDetails/Learn and perfrom/LearnAndPerfrom.jsx";
import Channels from "./ServiceDetails/Learn and perfrom/Channels.jsx";
import VideoPlayer from "./ServiceDetails/Learn and perfrom/VideoPlayer.jsx";
import Tickets from "./Dashboard/Tickets.jsx";
import TicketDetail from "./Dashboard/TicketDetails.jsx";

import SelectRolesAndCompany from "./ServiceDetails/Check_Your_Ability/pages/selecting_roles_and_typeofcompany/SelectRolesAndCompany.jsx";
import Rounds from "./ServiceDetails/Check_Your_Ability/pages/selecting_roles_and_typeofcompany/Rounds.jsx";
import FaceEnrollment from "./ServiceDetails/Check_Your_Ability/pages/FaceEnrollment.jsx";
import InterviewScreen from "./ServiceDetails/Check_Your_Ability/pages/Interview_page/InterviewScreen.jsx";
import AfterInterview from "./ServiceDetails/Check_Your_Ability/pages/Interview_page/AfterInterview.jsx";

import Categories from "./ServiceDetails/Check_Your_Ability/pages/selecting category/Categories.jsx";
import Aptitude from "./ServiceDetails/Check_Your_Ability/pages/Aptitude/Aptitude.jsx";
import AptitudeSubcategories from "./ServiceDetails/Check_Your_Ability/pages/Aptitude/AptitudeSubcategories.jsx";

import Feedback from "./Dashboard/Feedback.jsx";
import AptitudeReviewMode from "./Dashboard/AptitudeReviewMode.jsx";

import RazorpayTest from "./pricing/RazorpayTest.jsx";

const ProjectLearningMap = lazy(() => import("./Dashboard/ProjectLearningMap.jsx"));

import ScrollToTop from "./ScrollToTop.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authstore.js";

/* ======================================================
   PROTECTED ROUTE (AUTH + VERIFIED)
====================================================== */
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// ⛔ user not loaded yet
	if (!user) {
		return <LoadingSpinner />;
	}

	if (!user.isVerified) {
		return <Navigate to="/verify-email" replace />;
	}

	return children;
};

/* ======================================================
   REDIRECT AUTHENTICATED USERS
====================================================== */
const RedirectAuthenticatedUser = ({ children }) => {
	const { isAuthenticated, user } = useAuthStore();

	// ⛔ waiting for user object
	if (isAuthenticated && !user) {
		return <LoadingSpinner />;
	}

	if (isAuthenticated && user.isVerified) {
		return <Navigate to="/" replace />;
	}

	return children;
};

function App() {
	const { isCheckingAuth, checkAuth, setupInterceptor, isAuthenticated, user } = useAuthStore();
	const { fetchNotifications, fetchUnreadCount, addNotification } = useNotificationStore();
	const location = useLocation();
	const navigate = useNavigate();

	// ✅ Hide footer on dashboard and check-your-ability routes if needed
	const isDashboard = location.pathname.startsWith("/dashboard");
	const isInterview = location.pathname.includes("/interview") || location.pathname.includes("/services/check-your-ability");

	const showFooter = !isDashboard && !isInterview;

	// ✅ CLEANED UP: Single socket connection useEffect
	useEffect(() => {
		if (isAuthenticated && user?._id) {
			connectSocket(user._id);
		}

		return () => {
			disconnectSocket();
		};
	}, [isAuthenticated, user?._id]);

	// ✅ Setup socket listener and initial count
	useEffect(() => {
		if (isAuthenticated) {
			fetchUnreadCount();

			// Remove any existing listeners first
			socket.off("NEW_NOTIFICATION");

			// Add listener
			socket.on("NEW_NOTIFICATION", (notification) => {
				addNotification(notification);
				fetchUnreadCount();
			});
		}

		return () => {
			socket.off("NEW_NOTIFICATION");
		};
	}, [isAuthenticated, fetchUnreadCount, addNotification]);

	// Check Your Ability shared state
	const [companyType, setCompanyType] = useState(null);
	const [role, setRole] = useState(null);

	useEffect(() => {
		setupInterceptor();

		// Check for token in URL query parameter (e.g. from Google OAuth redirect)
		const params = new URLSearchParams(window.location.search);
		const token = params.get("token");
		if (token) {
			localStorage.setItem("USER_AUTH_TOKEN", token);
			// Clean up token from URL using React Router to synchronize internal state
			params.delete("token");
			const newSearch = params.toString();
			navigate(
				{
					pathname: window.location.pathname,
					search: newSearch ? `?${newSearch}` : "",
				},
				{ replace: true }
			);
		}

		checkAuth();
	}, [checkAuth, setupInterceptor, navigate]);

	if (isCheckingAuth) return <LoadingSpinner />;

	return (
		<>
			<ScrollToTop />

			<Routes>
				{/* Home */}
				<Route path="/" element={<Home />} />

				{/* Interview Preview (Public) */}
				<Route path="/interview-preview" element={<InterviewPreview />} />

				<Route path="/aptitude-review" element={<AptitudeReviewMode />} />

				{/* Dashboard (Protected) */}
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<Layout />
						</ProtectedRoute>
					}
				>
					<Route index element={<DashboardPage />} />
					<Route path="setting" element={<Account />} />
					<Route path="notifications" element={<Notifications />} />
					<Route path="learning" element={<Learning />} />
					<Route path="saved-courses" element={<SavedCourses />} />
					<Route path="interview-analysis" element={<Interview />} />
					<Route path="pricing" element={<Payment />} />
					<Route path="messages/inbox" element={<Message />} />
					<Route path="tickets" element={<Tickets />} />
					<Route path="tickets/:ticketId" element={<TicketDetail />} />
					<Route path="help/faq" element={<FAQs />} />
					<Route path="feedback" element={<Feedback />} />
					<Route path="aptitude-test-analysis" element={<AptitudeTestAnalysis />} />
					<Route path="learning-map" element={
						<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Map...</div>}>
							<ProjectLearningMap />
						</Suspense>
					} />
				</Route>

				{/* Auth */}
				<Route
					path="/signup"
					element={
						<RedirectAuthenticatedUser>
							<SignUpPage />
						</RedirectAuthenticatedUser>
					}
				/>
				<Route
					path="/login"
					element={
						<RedirectAuthenticatedUser>
							<LoginPage />
						</RedirectAuthenticatedUser>
					}
				/>

				<Route path="/verify-email" element={<EmailVerificationPage />} />
				<Route path="/forgot-password" element={<ForgotPasswordPage />} />
				<Route path="/reset-password/:token" element={<ResetPasswordPage />} />

				{/* Services */}
				<Route path="/services/learn--perform" element={<LearnAndPerform />} />
				<Route path="/services/:serviceSlug/:courseId" element={<Channels />} />
				<Route path="/:channelName/:channelId/:courseId" element={<VideoPlayer />} />

				{/* Check Your Ability Flow */}
				<Route path="/services/check-your-ability">
					{/* Step 1: Category selection */}
					<Route index element={<Categories />} />

					<Route
						path="/services/check-your-ability/aptitude"
						element={<AptitudeSubcategories />}
					/>

					<Route
						path="/services/check-your-ability/aptitude/test"
						element={<Aptitude />}
					/>

					{/* Step 2: Interview → Select company & role */}
					<Route
						path="interview"
						element={
							<SelectRolesAndCompany
								companyType={companyType}
								setCompanyType={setCompanyType}
								role={role}
								setRole={setRole}
							/>
						}
					/>

					{/* Step 3: Select rounds */}
					<Route
						path="interview/rounds"
						element={<Rounds companyType={companyType} role={role} />}
					/>
					<Route path="interview/enroll" element={<FaceEnrollment />} />

					{/* Step 4: Interview screen */}
					<Route
						path="interview/start"
						element={<InterviewScreen companyType={companyType} role={role} />}
					/>

					{/* Step 5: After interview */}
					<Route path="interview/after-interview" element={<AfterInterview />} />
				</Route>

				<Route path="/interview-report" element={<InterviewReportPage />} />

				{/* Catch-all */}
				<Route path='*' element={<Navigate to='/' replace />} />
				<Route path="/razorpay-test" element={<RazorpayTest />} />
				{/* Route moved to Dashboard */}
			</Routes>

			{showFooter && <Footer />}
			<VoiceAssistant />
			<Toaster />
		</>
	);
}

export default App;
