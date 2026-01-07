import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ReactReduxContext } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { LanguageSwitchBase } from './LanguageSwitchBase';
import { applyNavigatorLocale, resetLocale, setUserLocale } from '../../store/localeSlice';
import { type SupportedLocale } from '../../locale';

const sourceLabelMap: Record<string, string> = {
  url: 'common:source_url',
  user: 'common:source_user',
  navigator: 'common:source_navigator',
  default: 'common:source_default',
};

export const LanguageSwitch: React.FC<{index: number}> = ({index = 1}) => {
  const { t } = useTranslation(['common']);
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const [state, setState] = useState(() => store?.getState()?.locale);

  useEffect(() => {
    if (!store) return undefined;
    setState(store.getState().locale);
    const unsubscribe = store.subscribe(() => {
      setState(store.getState().locale);
    });
    return unsubscribe;
  }, [store]);

  const localeLabels = useMemo(() => ({
    en: t('common:language_en'),
    de: t('common:language_de'),
    es: t('common:language_es'),
  }), [t]);

  if (!store || !state) return null;
  const { locale, source, userOverride } = state;

  const handleSelect = (nextLocale: SupportedLocale) => {
    store.dispatch(setUserLocale(nextLocale));
  };

  const handleReset = () => {
    store.dispatch(resetLocale());
    store.dispatch(applyNavigatorLocale());
  };

  const isUrlControlled = source === 'url';
  const sourceKey = sourceLabelMap[source] ?? sourceLabelMap.default;

  const sourceLabel = t(sourceKey);

  return (
    <LanguageSwitchBase
      locale={locale as SupportedLocale}
      isUrlControlled={isUrlControlled}
      userOverride={!!userOverride}
      switchLabel={t('common:language_switch_label')}
      sourceLabel={sourceLabel}
      localeLabels={localeLabels}
      onSelect={handleSelect}
      onReset={handleReset}
      resetLabel={t('common:reset')}
      index={index}
    />
  );
};
