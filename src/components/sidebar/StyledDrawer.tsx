// Updated styled components for modern card-based design
import {styled} from "@mui/material/styles";
import {Drawer} from "@mui/material";
import type {OverlayInfo} from "../../utils/useDomPresence.tsx";

interface StyledDrawerProps {
    overlayInfo: OverlayInfo;
};

export const StyledDrawer = styled(Drawer, {
    shouldForwardProp: (prop) => prop !== 'overlayInfo'
})<StyledDrawerProps>(({overlayInfo}) => {
    const {
        present, position, contentOffset
    } = overlayInfo;

    const overlayResistantStyles = {};

    if (present) {
        switch (position) {
            case 'top':
                Object.assign(overlayResistantStyles, {
                    marginTop: contentOffset.top,
                    height: `calc(100vh - ${contentOffset.top}px)`
                });
                break;
            case 'bottom':
                Object.assign(overlayResistantStyles, {
                    marginBottom: contentOffset.bottom,
                    height: `calc(100vh - ${contentOffset.bottom}px)`
                });
                break;
            case 'left':
                Object.assign(overlayResistantStyles, {
                    marginLeft: contentOffset.left,
                });
                break;
            case 'right':
                Object.assign(overlayResistantStyles, {
                    marginRight: contentOffset.right,
                });
                break;
        }
    }

    return ({
        '& .MuiModal-backdrop': {
            display: 'block'
        },
        '& .MuiDrawer-paper': {
            width: '730px',
            height: '100vh',
            borderRadius: '0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            background: '#f8f9fa',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            ...overlayResistantStyles
        },
    });
});