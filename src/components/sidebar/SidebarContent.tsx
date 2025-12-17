import {styled} from "@mui/material/styles";
import {Box} from "@mui/material";
import type { OverlayInfo } from "../../utils/useDomPresence";

interface SidebarContentProps {
    overlayInfo: OverlayInfo;
}

export const SidebarContent = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'overlayInfo'
})<SidebarContentProps>(({theme, overlayInfo}) => ({
    flex: 1,
    overflow: 'auto',
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: overlayInfo.present && overlayInfo.position === 'bottom' ? theme.spacing(2) : 0,
    borderLeft: `1px solid ${theme.palette.divider}`,
    '&::-webkit-scrollbar': {
        width: 8,
    },
    '&::-webkit-scrollbar-track': {
        background: theme.palette.grey[100],
    },
    '&::-webkit-scrollbar-thumb': {
        background: theme.palette.grey[400],
        borderRadius: 4,
        '&:hover': {
            background: theme.palette.grey[500],
        },
    },
}));