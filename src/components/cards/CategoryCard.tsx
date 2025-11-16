// Category breakdown cards with color-coded progress bars
import {styled} from "@mui/material/styles";
import {Card} from "@mui/material";

export const CategoryCard = styled(Card)(({theme}) => ({
    borderRadius: 12,
    padding: theme.spacing(1),
    paddingTop: theme.spacing(4),
    marginBottom: theme.spacing(1),
    boxShadow: 'none',
    background: 'white',
}));