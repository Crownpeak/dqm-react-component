import React from 'react';
import {Divider, Fab, Menu, MenuItem, Typography, useTheme, Box} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import TranslateIcon from '@mui/icons-material/Translate';

export type LocaleCode = 'en' | 'de' | 'es';

const flagSvg: Record<LocaleCode, string> = {
    en: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16"><rect width="24" height="16" fill="#fff"/><g stroke-width="0"><rect y="0" width="24" height="2" fill="#b22234"/><rect y="3" width="24" height="2" fill="#b22234"/><rect y="6" width="24" height="2" fill="#b22234"/><rect y="9" width="24" height="2" fill="#b22234"/><rect y="12" width="24" height="2" fill="#b22234"/><rect width="10" height="8" fill="#3c3b6e"/></g></svg>`,
    de: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16"><rect width="24" height="16" fill="#ffce00"/><rect y="0" width="24" height="5.33" fill="#000"/><rect y="5.33" width="24" height="5.33" fill="#dd0000"/></svg>`,
    es: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16"><rect width="24" height="16" fill="#c60b1e"/><rect y="4" width="24" height="8" fill="#ffc400"/></svg>`,
};

const flagDataUri = (lang: LocaleCode) => `url("data:image/svg+xml;utf8,${encodeURIComponent(flagSvg[lang])}")`;

export interface LanguageSwitchBaseProps {
    locale: LocaleCode;
    isUrlControlled: boolean;
    userOverride: boolean;
    switchLabel: string;
    sourceLabel: string;
    localeLabels: Record<LocaleCode, string>;
    onSelect: (lang: LocaleCode) => void;
    onReset: () => void;
    resetLabel: string;
    index: number;
}

export const LanguageSwitchBase: React.FC<LanguageSwitchBaseProps> = ({
                                                                          locale,
                                                                          isUrlControlled,
                                                                          userOverride,
                                                                          switchLabel,
                                                                          sourceLabel,
                                                                          localeLabels,
                                                                          onSelect,
                                                                          onReset,
                                                                          resetLabel,
                                                                          index = 1,
                                                                      }) => {
    const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
    const menuOpen = Boolean(menuAnchor);

    const {palette: {text: {secondary}}} = useTheme();

    const headerStyles = index === 0 ? {} : {
        position: 'absolute',
        right: 12 + (index * 50),
        top: 12,
    }

    return (
        <>
            <Fab
                size="small"
                color="primary"
                aria-label={switchLabel}
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                disabled={isUrlControlled}
                sx={{
                    boxShadow: 'none',
                    color: secondary,
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.16)',
                    },
                    ...headerStyles
                }}
            >
                <TranslateIcon fontSize="small"/>
            </Fab>

            <Menu
                anchorEl={menuAnchor}
                open={menuOpen}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                sx={{
                    '.MuiMenu-paper': {
                        width: 240,
                    },
                    'li.MuiMenuItem-root': {
                        textWrap: 'auto',
                    },
                }}
            >
                {(Object.keys(localeLabels) as LocaleCode[]).map((lang) => (
                    <MenuItem
                        key={lang}
                        selected={locale === lang}
                        onClick={() => {
                            onSelect(lang);
                            setMenuAnchor(null);
                        }}
                        sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25}}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                    component="span"
                                    aria-hidden="true"
                                    sx={{
                                        width: 22,
                                        height: 14,
                                        backgroundImage: flagDataUri(lang),
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat',
                                        boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
                                    }}
                                />
                                <Divider orientation="vertical" flexItem />
                                <Typography variant="body2">{localeLabels[lang]}</Typography>
                            </Box>
                            <Typography component="span" variant="caption" color="text.secondary" textAlign="right">
                                {lang.toUpperCase()}
                            </Typography>
                        </Box>
                        {locale === lang && (
                            <Typography variant="caption" color={isUrlControlled ? 'warning.main' : 'text.secondary'}>
                                {isUrlControlled ?
                                    <LinkIcon fontSize="inherit" sx={{mr: 0.5, verticalAlign: 'middle'}}/> : null}
                                {sourceLabel}
                            </Typography>
                        )}
                    </MenuItem>
                ))}

                <Divider sx={{my: 0.5}}/>

                <MenuItem onClick={() => {
                    onReset();
                    setMenuAnchor(null);
                }} disabled={isUrlControlled && !userOverride} sx={{gap: 1}}>
                    <RefreshIcon fontSize="small"/>
                    <Typography variant="caption" fontSize="0.8rem">{resetLabel}</Typography>
                </MenuItem>
            </Menu>
        </>
    );
};
