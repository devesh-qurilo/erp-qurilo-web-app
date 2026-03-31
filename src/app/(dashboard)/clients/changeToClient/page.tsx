import { Suspense } from "react";
import AddClientDetails from "./AddClientDetails";


export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading...</div>}>
            <AddClientDetails />
        </Suspense>
    );
}
