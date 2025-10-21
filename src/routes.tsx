import {createBrowserRouter} from "react-router-dom";
import RootLayout from "@/pages/Layout";
import {AuthPage} from "@/pages/auth.tsx";

export const router = createBrowserRouter([
    {
        path: "",
        element: <RootLayout/>,
        children: [
            {
                path: "/",
                element: <AuthPage/>,
            },
        ],
    },
]);
