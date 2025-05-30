import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingHeader from '../components/Landing/LandingHeader';
import BackgroundCarousel, { ThemeType } from '../components/Landing/BackgroundCarousel';
import CharacterCarousel from '../components/Landing/CharacterCarousel';

// Define themes with their corresponding character information
const themes: ThemeType[] = [
  {
    id: 'forest',
    name: 'Aventura Prehistórica',
    background: '/images/backgrounds/forest-bg.jpg',
    character: 'Dinosaurio Amigable',
    characterImage: '/images/characters/dinosaur-log.png',
    characterDescription: 'Un amigable dinosaurio que te guiará a través de emocionantes aventuras prehistóricas.'
  },
  {
    id: 'castle',
    name: 'Reino de Fantasía',
    background: '/images/backgrounds/castle-bg.png',
    character: 'Castillo Mágico',
    characterImage: '/images/characters/castle-log.png',
    characterDescription: 'Un majestuoso castillo lleno de misterios y aventuras por descubrir.'
  },
  {
    id: 'space',
    name: 'Aventura Espacial',
    background: '/images/backgrounds/space-bg.png',
    character: 'Nave Espacial',
    characterImage: '/images/characters/space-logg.png',
    characterDescription: 'Explora las maravillas del espacio con esta increíble nave espacial.'
  }
];

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero' | 'features' | 'cta' | 'footer'>('hero');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(themes[0]);
  
  const handleThemeChange = useCallback((theme: ThemeType) => {
    setCurrentTheme(theme);
  }, []);

  // Efecto para manejar el scroll y la sección activa
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);

      // Obtener las posiciones de las secciones
      const heroSection = document.getElementById('hero');
      const featuresSection = document.getElementById('features');
      const ctaSection = document.getElementById('cta');
      const footerSection = document.getElementById('footer');

      if (!heroSection || !featuresSection || !ctaSection || !footerSection) return;

      const featuresPosition = featuresSection.offsetTop - 100;
      const ctaPosition = ctaSection.offsetTop - 100;
      const footerPosition = footerSection.offsetTop - 200;

      if (scrollPosition < featuresPosition) {
        setActiveSection('hero');
      } else if (scrollPosition >= featuresPosition && scrollPosition < ctaPosition) {
        setActiveSection('features');
      } else if (scrollPosition >= ctaPosition && scrollPosition < footerPosition) {
        setActiveSection('cta');
      } else {
        setActiveSection('footer');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      {/* Background Carousel */}
      <BackgroundCarousel 
        themes={themes}
        interval={7000}
        onThemeChange={handleThemeChange}
      />
      {/* Header Fijo */}
      <LandingHeader isScrolled={isScrolled} section={activeSection} />
      
      {/* Hero Section */}
      <header id="hero" className="relative overflow-hidden pt-12 sm:pt-16 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="relative z-10 text-center px-2 sm:px-0">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center">
              <img
                src="/images/characters/loguito.png"
                alt="Logo La Cuentería"
                className="h-24 sm:h-32 md:h-40 lg:h-48 w-auto object-contain"
                style={{
                  filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                  mixBlendMode: 'multiply',
                }}
              />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 px-2 sm:px-0">
              Crea cuentos mágicos <br className="hidden sm:block" />
              <span className="text-yellow-300">para los más pequeños</span>
            </h1>
            <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-white/90 font-medium leading-relaxed px-4 sm:px-6 md:px-0 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100 drop-shadow-md">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
                Personaliza historias únicas con personajes especiales y crea recuerdos
                inolvidables para los niños que más quieres.
              </span>
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 px-4 sm:px-0">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="relative w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 overflow-hidden font-medium rounded-full group bg-gradient-to-br from-yellow-400 to-amber-500 text-purple-900 hover:from-yellow-400 hover:to-yellow-400 transition-all duration-300 ease-out shadow-lg hover:shadow-xl hover:scale-105 transform-gpu"
                  >
                    <span className="relative z-10 text-sm sm:text-base font-semibold tracking-wide">Comenzar ahora</span>
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
                  </Link>
                  <Link
                    to="/register"
                    className="relative w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 overflow-hidden font-medium rounded-full group bg-gradient-to-br from-purple-700 to-purple-900 text-white hover:from-purple-600 hover:to-purple-800 transition-all duration-300 ease-out shadow-lg hover:shadow-xl hover:scale-105 transform-gpu"
                  >
                    <span className="relative z-10 text-sm sm:text-base font-semibold tracking-wide">Crear cuenta</span>
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/home"
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-900 bg-yellow-400 hover:bg-yellow-300 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                >
                  Ir a mi cuenta
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sección de Personajes */}
      <section id="historias" className="py-12 sm:py-16 md:py-20 bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 px-4 sm:px-0">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 mb-4 sm:mb-6">
              ¡Historias que Inspiran!
            </h2>
            <div className="relative inline-block">
              <p className="relative z-10 mt-3 sm:mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-white/90 font-medium leading-relaxed">
                Descubre mundos mágicos con nuestros personajes exclusivos. 
                Cada cuento es único, como la imaginación de tus pequeños. 
                ¡Personaliza sus aventuras favoritas!
              </p>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-amber-500/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            </div>
          </div>
          
          <div className="mt-8 sm:mt-12 md:mt-16 w-full max-w-4xl mx-auto">
            <CharacterCarousel 
              characters={themes.map(theme => ({
                id: theme.id,
                name: theme.character,
                description: theme.characterDescription,
                image: theme.characterImage,
                theme: theme.name
              }))}
              currentTheme={currentTheme}
            />
          </div>
        </div>
      </section>

      {/* Sección Cómo Funciona */}
      <section id="features" className="py-16 sm:py-24 bg-white/10 backdrop-blur-sm relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-indigo-900/20"></div>
        <div className="absolute top-1/2 -left-1/4 w-1/2 h-1/2 rounded-full bg-purple-700/20 blur-3xl"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-indigo-700/20 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center relative z-10 space-y-6">
            <h2 className="text-4xl font-extrabold text-amber-900 sm:text-5xl font-serif relative inline-block pb-2">
              Crea tu cuento mágico
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></span>
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-amber-900/90 leading-relaxed font-serif">
              Transforma la imaginación en una aventura inolvidable con solo unos pasos
            </p>
            <div className="pt-2">
              <span className="inline-block px-6 py-2 text-sm font-semibold tracking-wide text-amber-900 bg-amber-100/80 rounded-full border border-amber-200/50 shadow-sm transform transition-transform hover:scale-105">
                ✨ Magia en cada página ✨
              </span>
            </div>
          </div>

          <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-2 sm:px-4">
            {[
              {
                title: '1. Elige tus personajes',
                description: 'Selecciona entre nuestros adorables personajes o crea uno totalmente personalizado. Hasta 3 personajes por cuento con sus propias características únicas.',
                icon: '🧙‍♂️',
                color: 'from-purple-500 to-indigo-600',
                image: '/images/characters/character-select.png'
              },
              {
                title: '2. Diseña la aventura',
                description: 'Elige el estilo literario, la temática y el mensaje central. Nuestra IA generará una historia única adaptada a la edad de tu pequeño lector.',
                icon: '✨',
                color: 'from-amber-500 to-orange-500',
                image: '/images/characters/story-design.png'
              },
              {
                title: '3. Personaliza y disfruta',
                description: 'Ajusta cada página, regenera ilustraciones y personaliza los detalles. Luego, descarga tu libro digital o comparte la aventura en familia.',
                icon: '📖',
                color: 'from-emerald-500 to-teal-600',
                image: '/images/characters/enjoy-story.png'
              },
            ].map((feature, index) => (
              <div key={index} className="relative transform transition-all duration-300 hover:rotate-0 hover:scale-105 group" style={{ perspective: '1000px' }}>
                <div 
                  className="relative p-6 sm:p-8 text-center md:text-left backdrop-blur-sm shadow-xl transform transition-all duration-300 h-full flex flex-col"
                  style={{
                    background: 'linear-gradient(to bottom right, #fef3c7, #fffbeb)',
                    clipPath: 'polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.5)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.5)'
                  }}
                >
                  {/* Esquina doblada */}
                  <div className="absolute bottom-0 right-0 w-12 h-12 bg-amber-200/30" style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}></div>
                  
                  {/* Ícono */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-6 rounded-2xl text-2xl text-amber-900`}>
                    {feature.icon}
                  </div>
                  
                  {/* Contenido */}
                  <h3 
                    className="text-xl sm:text-2xl font-serif font-bold text-amber-900 mb-3 sm:mb-4 relative pb-2"
                    style={{
                      borderBottom: '2px solid #d97706',
                      display: 'inline-block'
                    }}
                  >
                    {feature.title}
                  </h3>
                  
                  <p className="text-amber-900/90 leading-relaxed font-serif flex-grow text-sm sm:text-base">
                    {feature.description}
                  </p>
                  
                  {/* Imagen */}
                  <div className="mt-4 sm:mt-6 h-36 sm:h-48 rounded-lg overflow-hidden bg-amber-50/50 flex items-center justify-center border border-amber-100">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/characters/placeholder-story.png';
                      }}
                    />
                  </div>
                  
                  {/* Detalle decorativo */}
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 opacity-20">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link
              to={user ? '/home' : '/login'}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-lg text-purple-900 bg-gradient-to-r from-yellow-400 to-yellow-300 hover:from-yellow-300 hover:to-yellow-200 transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
            >
              Comenzar la aventura
              <svg className="ml-3 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>


      {/* Sección CTA */}
      <section id="cta" className="relative py-12 sm:py-16 md:py-24 overflow-hidden bg-amber-50/80">
        {/* Fondo con textura y elementos decorativos */}
        <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/90 to-amber-100/70"></div>
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-amber-200/40 blur-3xl"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-orange-100/40 blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="relative p-6 sm:p-8 md:p-10 lg:p-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl transform transition-all duration-300 hover:shadow-2xl"
               style={{
                 clipPath: 'polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%)',
                 border: '1px solid rgba(255, 255, 255, 0.5)',
                 borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                 borderRight: '1px solid rgba(0, 0, 0, 0.08)'
               }}>
            
            {/* Esquina doblada */}
            <div className="absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 bg-amber-200/30" style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}></div>
            
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-amber-900 font-serif relative inline-block pb-2">
                ¿Listo para crear magia?
                <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></span>
              </h2>
              
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-amber-900/90 font-serif px-2 sm:px-0">
                Únete a miles de padres y educadores que ya están creando recuerdos inolvidables con nuestros cuentos personalizados.
              </p>
              
              <div className="mt-8 sm:mt-10">
                <a
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-md text-amber-900 bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-200/50 transition-all duration-300 transform hover:-translate-y-0.5"
                  href="/register"
                >
                  <span className="mr-2">✨</span>
                  Crear cuenta gratis
                  <svg className="ml-2 -mr-1 w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
                
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-amber-900/70">
                  Sin tarjeta de crédito requerida • Empieza gratis
                </p>
              </div>
            </div>
            
            {/* Detalle decorativo */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 opacity-20">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-amber-50/50 border-t border-amber-100/70">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400"></div>
        </div>
        
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center">
            {/* Logo o marca */}
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">📚</span>
              <span className="text-xl font-serif font-bold text-amber-900">La Cuentería</span>
            </div>
            
            {/* Texto de derechos */}
            <p className="text-center text-sm text-amber-900/70 font-medium mb-4">
              &copy; {new Date().getFullYear()} La Cuentería. Todos los derechos reservados.
            </p>
            
            {/* Enlaces adicionales */}
            <div className="flex space-x-6">
              <a href="/terminos" className="text-amber-900/70 hover:text-amber-700 text-sm font-medium transition-colors">
                Términos
              </a>
              <a href="/privacidad" className="text-amber-900/70 hover:text-amber-700 text-sm font-medium transition-colors">
                Privacidad
              </a>
              <a href="/contacto" className="text-amber-900/70 hover:text-amber-700 text-sm font-medium transition-colors">
                Contacto
              </a>
            </div>
            
            {/* Redes sociales */}
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-amber-900/60 hover:text-amber-700 transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-amber-900/60 hover:text-amber-700 transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.415-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.415-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.976.045-1.505.207-1.858.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.023.047 1.351.058 3.807.058h.468c2.456 0 2.784-.011 3.807-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.047-1.023.058-1.351.058-3.807v-.468c0-2.456-.011-2.784-.058-3.807-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-amber-900/60 hover:text-amber-700 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Asegurar que el contenido esté por encima del fondo */}
      <div className="relative z-10">
        {/* Contenido existente */}
      </div>
    </div>
  );
};

export default LandingPage;
