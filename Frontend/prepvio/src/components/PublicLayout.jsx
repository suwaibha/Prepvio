import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../HomePages/Header";

const PublicLayout = () => {
    return (
        <>
            <Header />
            <Outlet />
        </>
    );
};

export default PublicLayout;