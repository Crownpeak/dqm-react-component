import React from "react";
import {Box} from "@mui/material";

export const SidebarFooter = ({children}: {
    children: React.ReactNode;
}) => (
    <Box
        sx={{
            position: 'relative',
            padding: (theme) => theme.spacing(2),
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            background: 'white',
            display: 'flex',
            justifyContent: 'center',
            bottom: 0,
            zIndex: 10,
        }}
    >
        {children}
    </Box>
);