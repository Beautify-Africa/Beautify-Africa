import { useCallback, useEffect, useState } from 'react';

export function useNavbarState({ locationPathname, navigate, scrollThreshold, scrollOffset }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  const scrollToSection = useCallback(
    (event, id) => {
      event.preventDefault();
      setIsMobileMenuOpen(false);

      const isHomePage = locationPathname === '/';

      if (!isHomePage) {
        navigate('/');

        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            window.scrollTo({
              top: element.offsetTop - scrollOffset,
              behavior: 'smooth',
            });
          }
        }, 100);

        return;
      }

      const element = document.getElementById(id);
      if (element) {
        window.scrollTo({
          top: element.offsetTop - scrollOffset,
          behavior: 'smooth',
        });
      }
    },
    [locationPathname, navigate, scrollOffset]
  );

  const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const openAuthDialog = useCallback(() => setIsAuthDialogOpen(true), []);
  const closeAuthDialog = useCallback(() => setIsAuthDialogOpen(false), []);

  const openAuthDialogFromMobileMenu = useCallback(() => {
    closeMobileMenu();
    setIsAuthDialogOpen(true);
  }, [closeMobileMenu]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen, closeMobileMenu]);

  return {
    isScrolled,
    isMobileMenuOpen,
    isAuthDialogOpen,
    scrollToSection,
    openMobileMenu,
    closeMobileMenu,
    openAuthDialog,
    closeAuthDialog,
    openAuthDialogFromMobileMenu,
  };
}
