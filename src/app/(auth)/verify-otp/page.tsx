import { Suspense } from "react";
import VerifyOtpPage from "./VerifyOtpPage";

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <VerifyOtpPage />
        </Suspense>
    );
}
