import React from "react";
import {Box} from "@mui/material";
import type { OverlayInfo } from "../../utils/useDomPresence";

export const SidebarFooter = ({children, overlayInfo}: {
    children: React.ReactNode;
    overlayInfo: OverlayInfo
}) => (
    <Box
        sx={{
            position: 'relative',
            padding: (theme) => theme.spacing(2),
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            background: 'white',
            display: 'flex',
            justifyContent: 'center',
            bottom: overlayInfo.present ? (overlayInfo.contentOffset['bottom'] + 5) + 'px' : '0px',
            zIndex: 10,
        }}
    >
        {children}
    </Box>
);