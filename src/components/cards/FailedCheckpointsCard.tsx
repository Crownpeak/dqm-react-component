// Failed checkpoints card
import {styled} from "@mui/material/styles";
import {Card} from "@mui/material";

export const FailedCheckpointsCard = styled(Card)(({theme}) => ({
    borderRadius: 10,
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: '10px',
    paddingBottom: '10px',
    marginBottom: theme.spacing(2),
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    background: 'white',
}));