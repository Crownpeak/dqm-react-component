'use client';

import { useEffect, useState } from 'react';
import { HeroSection } from '@/components/sections/hero-section';
import { FeaturesSection } from '@/components/sections/features-section';
import { DemoSection } from '@/components/sections/demo-section';
import { IntegrationSection } from '@/components/sections/integration-section';
import { Footer } from '@/components/sections/footer';
import { LanguageSwitcher } from '@/components/language-switcher';
import { DQMSidebar, i18n as dqmI18n  } from '@crownpeak/dqm-react-component';

import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";

export default function Home() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleOpenWidget = () => {
    setVisible(true);
    setIsWidgetOpen(true);
  };

  const handleCloseWidget = () => {
    setTimeout(() => {
      setVisible(false);
    }, 200); // Kurze Verzögerung für bessere UX
    setIsWidgetOpen(false);
  };

  useEffect(() => {
    if (document.body.classList && !document.body.classList.contains('cc--darkmode')) {
      document.body.classList.add('cc--darkmode');
    }

    // Initialisiere Cookie Consent
    CookieConsent.run({
      guiOptions: {
        consentModal: {
            layout: "bar",
            position: "bottom",
            equalWeightButtons: true,
            flipButtons: true
        },
        preferencesModal: {
            layout: "bar",
            position: "left",
            equalWeightButtons: true,
            flipButtons: true
        }
    },
    categories: {
        necessary: {
            readOnly: true
        },
        functionality: {},
        analytics: {}
    },
    language: {
        default: dqmI18n.language || 'en',
        translations: {
            de: {
                consentModal: {
                    title: "Wir verwenden Cookies",
                    description: "Diese Website verwendet Cookies, um Ihre Erfahrung zu verbessern. Notwendige Cookies sind für die Grundfunktionen erforderlich. Optionale Cookies helfen uns, die Website zu verbessern und Ihnen relevante Inhalte anzuzeigen.",
                    acceptAllBtn: "Alle akzeptieren",
                    acceptNecessaryBtn: "Nur notwendige",
                    showPreferencesBtn: "Einstellungen verwalten",
                    footer: "<a href=\"https://www.crownpeak.com/policies/privacy-notice/\">Datenschutz</a>"
                },
                preferencesModal: {
                    title: "Cookie-Einstellungen",
                    acceptAllBtn: "Alle akzeptieren",
                    acceptNecessaryBtn: "Nur notwendige",
                    savePreferencesBtn: "Einstellungen speichern",
                    closeIconLabel: "Schließen",
                    serviceCounterLabel: "Dienst|Dienste",
                    sections: [
                        {
                            title: "Verwendung von Cookies",
                            description: "Wir verwenden Cookies, um die grundlegenden Funktionen der Website zu gewährleisten und Ihr Online-Erlebnis zu verbessern. Sie können für jede Kategorie wählen, ob Sie zustimmen möchten oder nicht."
                        },
                        {
                            title: "Notwendige Cookies <span class=\"pm__badge\">Immer aktiv</span>",
                            description: "Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden. Sie werden in der Regel nur als Reaktion auf von Ihnen durchgeführte Aktionen gesetzt, wie z.B. das Festlegen Ihrer Datenschutzeinstellungen.",
                            linkedCategory: "necessary"
                        },
                        {
                            title: "Funktionale Cookies",
                            description: "Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung, wie z.B. das Speichern Ihrer bevorzugten Sprache. Die Website funktioniert auch ohne diese Cookies, jedoch mit eingeschränkten Funktionen.",
                            linkedCategory: "functionality"
                        },
                        {
                            title: "Analyse-Cookies",
                            description: "Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren. Die gesammelten Informationen werden anonymisiert und dienen ausschließlich zur Verbesserung der Website.",
                            linkedCategory: "analytics"
                        },
                        {
                            title: "Weitere Informationen",
                            description: "Bei Fragen zu unserer Cookie-Richtlinie können Sie uns gerne <a class=\"cc__link\" href=\"https://www.crownpeak.com/about-us/contact-us/\">kontaktieren</a>."
                        }
                    ]
                }
            },
            en: {
                consentModal: {
                    title: "We use cookies",
                    description: "This website uses cookies to enhance your experience. Necessary cookies are required for basic functionality. Optional cookies help us improve the website and show you relevant content.",
                    acceptAllBtn: "Accept all",
                    acceptNecessaryBtn: "Necessary only",
                    showPreferencesBtn: "Manage preferences",
                    footer: "<a href=\"https://www.crownpeak.com/policies/privacy-notice/\">Privacy Policy</a>"
                },
                preferencesModal: {
                    title: "Cookie Preferences",
                    acceptAllBtn: "Accept all",
                    acceptNecessaryBtn: "Necessary only",
                    savePreferencesBtn: "Save preferences",
                    closeIconLabel: "Close",
                    serviceCounterLabel: "Service|Services",
                    sections: [
                        {
                            title: "Cookie Usage",
                            description: "We use cookies to ensure the basic functionalities of the website and to enhance your online experience. You can choose for each category to opt-in or opt-out whenever you want."
                        },
                        {
                            title: "Necessary Cookies <span class=\"pm__badge\">Always Active</span>",
                            description: "These cookies are essential for the proper functioning of the website and cannot be disabled. They are usually only set in response to actions made by you, such as setting your privacy preferences.",
                            linkedCategory: "necessary"
                        },
                        {
                            title: "Functional Cookies",
                            description: "These cookies enable enhanced functionality and personalization, such as remembering your preferred language. The website will still function without these cookies, but with limited features.",
                            linkedCategory: "functionality"
                        },
                        {
                            title: "Analytics Cookies",
                            description: "These cookies help us understand how visitors interact with the website. The information collected is anonymized and used solely to improve the website experience.",
                            linkedCategory: "analytics"
                        },
                        {
                            title: "More Information",
                            description: "For any questions regarding our cookie policy, please feel free to <a class=\"cc__link\" href=\"https://www.crownpeak.com/about-us/contact-us/\">contact us</a>."
                        }
                    ]
                }
            },
            es: {
                consentModal: {
                    title: "Utilizamos cookies",
                    description: "Este sitio web utiliza cookies para mejorar su experiencia. Las cookies necesarias son requeridas para la funcionalidad básica. Las cookies opcionales nos ayudan a mejorar el sitio web y mostrarle contenido relevante.",
                    acceptAllBtn: "Aceptar todo",
                    acceptNecessaryBtn: "Solo necesarias",
                    showPreferencesBtn: "Gestionar preferencias",
                    footer: "<a href=\"https://www.crownpeak.com/policies/privacy-notice/\">Política de Privacidad</a>"
                },
                preferencesModal: {
                    title: "Preferencias de Cookies",
                    acceptAllBtn: "Aceptar todo",
                    acceptNecessaryBtn: "Solo necesarias",
                    savePreferencesBtn: "Guardar preferencias",
                    closeIconLabel: "Cerrar",
                    serviceCounterLabel: "Servicio|Servicios",
                    sections: [
                        {
                            title: "Uso de Cookies",
                            description: "Utilizamos cookies para garantizar las funcionalidades básicas del sitio web y mejorar su experiencia en línea. Puede elegir para cada categoría si desea aceptarlas o no."
                        },
                        {
                            title: "Cookies Necesarias <span class=\"pm__badge\">Siempre activas</span>",
                            description: "Estas cookies son esenciales para el funcionamiento correcto del sitio web y no pueden ser desactivadas. Generalmente solo se establecen en respuesta a acciones realizadas por usted, como configurar sus preferencias de privacidad.",
                            linkedCategory: "necessary"
                        },
                        {
                            title: "Cookies Funcionales",
                            description: "Estas cookies permiten funcionalidades mejoradas y personalización, como recordar su idioma preferido. El sitio web seguirá funcionando sin estas cookies, pero con funciones limitadas.",
                            linkedCategory: "functionality"
                        },
                        {
                            title: "Cookies de Análisis",
                            description: "Estas cookies nos ayudan a comprender cómo los visitantes interactúan con el sitio web. La información recopilada es anónima y se utiliza únicamente para mejorar la experiencia del sitio.",
                            linkedCategory: "analytics"
                        },
                        {
                            title: "Más Información",
                            description: "Para cualquier pregunta sobre nuestra política de cookies, no dude en <a class=\"cc__link\" href=\"https://www.crownpeak.com/about-us/contact-us/\">contactarnos</a>."
                        }
                    ]
                }
            }
        }
    }
    });
  }, []);

  return (
    <main className="min-h-screen">
      <LanguageSwitcher />
      <HeroSection onOpenDemo={handleOpenWidget} />
      <FeaturesSection />
      <DemoSection onOpenDemo={handleOpenWidget} />
      <IntegrationSection />
      <Footer />
      
      {/* Echte DQMSidebar mit gemockter API */}
      {visible && (
        <DQMSidebar
          open={isWidgetOpen}
          onOpen={handleOpenWidget}
          onClose={handleCloseWidget}
          config={{
            // Mock API Key und Website ID für Demo
            apiKey: 'demo-api-key-12345',
            websiteId: 'demo-website-id',
            useLocalStorage: true ,
            disableLogout: true,
            // Optional: Backend Auth URL (wird auch gemockt)
            // authBackendUrl: window.location.origin,
          }}
        />
      )}
    </main>
  );
}
