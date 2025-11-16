import React from "react";
import {Fab} from "@mui/material";

export const StyledFab = ({...props}: React.ComponentProps<typeof Fab>) => (
    <Fab
        {...props}
        sx={{
            position: 'fixed',
            bottom: 35,
            right: 0,
            zIndex: 1400,
            background: 'linear-gradient(135deg, #1f2937 0%, #475260 100%)',
            color: 'white',
            width: 48,
            height: 48,
            borderRadius: '5px 0 0 5px',
            boxShadow: '0 8px 24px rgba(31, 41, 55, 0.4)',
            '&:hover': {
                background: 'linear-gradient(135deg, #2c4870 0%, #4e6c91 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(44, 72, 112, 0.4)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
    />
);