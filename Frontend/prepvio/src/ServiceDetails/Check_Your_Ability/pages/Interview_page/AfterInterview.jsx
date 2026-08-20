import { useEffect, useState } from "react";

function AfterInterview() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Each visit will have its own key
    const visitKey = "afterInterviewRefreshed";

    // Check if page was already refreshed in THIS visit
    const alreadyRefreshed = sessionStorage.getItem(visitKey);

    if (!alreadyRefreshed) {
      // Mark as refreshed
      sessionStorage.setItem(visitKey, "true");
      console.log("🔄 Refreshing AfterInterview page once...");
      window.location.reload();
    } else {
      // Show the actual content after one refresh
      setIsLoading(false);
    }

    // Cleanup: remove the flag when user leaves the page
    const handleBeforeUnload = () => {
      sessionStorage.removeItem(visitKey);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          background: "#111827",
          fontSize: "1.2rem",
        }}
      >
        Finalizing interview...
      </div>
    );
  }

  return (
    <>
      <h1
        style={{
          textAlign: "center",
          marginTop: "20vh",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        After Interview ✅
      </h1>
    </>
  );
}

export default AfterInterview;
