// https://huemint.com/website-1/
// https://fontjoy.com/
module.exports = {
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				'primary': {
					light: '#cde9f7',
					dark: '#1089cf',
				},
				'secondary': {
					light: '#96c9ef',
					dark: '#96c9ef',
				},
				'tertiary': {
					light: '#1089cf',
					dark: '#cde9f7',
				},
				'background': {
					light: '#fcffff',
					dark: '#1f262d',
				}
			},
			fontFamily: {
				sans: ['Graphik', 'sans-serif'],
				serif: ['Merriweather', 'serif'],
			},
			extend: {
				spacing: {
					'128': '32rem',
					'144': '36rem',
				},
				borderRadius: {
					'4xl': '2rem',
				}
			}
		}
	}
}