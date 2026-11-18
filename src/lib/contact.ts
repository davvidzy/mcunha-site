export const WHATSAPP_NUMBER = '5561981193538';
export const WHATSAPP_DISPLAY = '(61) 98119-3538';
export const INSTAGRAM_URL = 'https://www.instagram.com/mcunhamarmoraria/';
export const MAPS_DIRECTIONS =
  'https://www.google.com/maps/dir/?api=1&destination=MCunha+Marmoraria,+QI+21+Bloco+E+Loja+54,+Lago+Sul,+Bras%C3%ADlia+-+DF';
export const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/search/?api=1&query=MCunha+Marmoraria+Lago+Sul';

export const whatsappLink = (message?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
